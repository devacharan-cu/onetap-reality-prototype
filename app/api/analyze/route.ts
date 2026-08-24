import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { z } from "zod";

export const runtime = "nodejs";

const requestSchema = z.object({
  image: z
    .string()
    .startsWith("data:image/", { message: "Image must be a data:image/ URL." }),
});

const geminiResponseSchema = z.object({
  context: z.string().default("GENERAL"),
  title: z.string().default("Visual Subject"),
  summary: z.string().default(""),
  confidence: z.number().min(0).max(1).default(0.75),
  entities: z.object({
    eventTitle: z.string().default(""),
    date: z.string().default(""),
    time: z.string().default(""),
    location: z.string().default(""),
    phoneNumber: z.string().default(""),
    productName: z.string().default(""),
    routeNumber: z.string().default(""),
    emergencyDetected: z.boolean().default(false),
  }),
  evidence: z.object({
    eventTitle: z.string().default(""),
    date: z.string().default(""),
    time: z.string().default(""),
    location: z.string().default(""),
    phoneNumber: z.string().default(""),
    productName: z.string().default(""),
    routeNumber: z.string().default(""),
  }),
});

export type ActionType =
  | "calendar"
  | "maps"
  | "call"
  | "search"
  | "explain"
  | "share"
  | "emergency";

export type ServerAction = {
  id: string;
  label: string;
  description: string;
  type: ActionType;
};

function normalize(value?: string): string {
  if (!value) return "";
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasEvidence(value?: string, evidence?: string): boolean {
  if (!value || !evidence) return false;
  const v = normalize(value);
  const e = normalize(evidence);
  if (!v || !e) return false;
  if (e.includes(v) || v.includes(e)) return true;

  const words = v.split(" ").filter((w) => w.length > 1);
  if (words.length === 0) return false;
  const matches = words.filter((w) => e.includes(w));
  return matches.length / words.length >= 0.5;
}

function hasPhoneEvidence(value?: string, evidence?: string): boolean {
  if (!value || !evidence) return false;
  const valDigits = value.replace(/\D/g, "");
  const eviDigits = evidence.replace(/\D/g, "");
  if (valDigits.length < 7 || eviDigits.length < 7) return false;
  return eviDigits.includes(valDigits) || valDigits.includes(eviDigits);
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured on the server." },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => null);
    const parsedBody = requestSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Invalid image payload. Must be a valid base64 data:image URL." },
        { status: 400 }
      );
    }

    const { image } = parsedBody.data;
    const match = image.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (!match) {
      return NextResponse.json(
        { error: "Malformed data URI. Expected data:image/<format>;base64,<data>" },
        { status: 400 }
      );
    }

    const mimeType = match[1];
    const base64Data = match[2];

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are the visual reasoning engine for OneTap Reality (iQOO Hackathon 2026).
Analyze this image to identify actionable, high-utility information.

CRITICAL RULES:
1. NEVER invent or hallucinate dates, phone numbers, addresses, product names, or events.
2. If text or details are NOT clearly visible in the image, set the entity and evidence to empty strings ("").
3. Follow: NO EVIDENCE -> NO ENTITY -> NO ACTION.
4. For every entity you extract, provide the EXACT verbatim snippet or visual cue as "evidence".
5. Set emergencyDetected to true ONLY if there is clear visual evidence of an emergency (e.g. fire, vehicle accident, severe road hazard).

Return ONLY valid JSON matching this exact structure:
{
  "context": "Short category e.g. EVENT_POSTER, BUSINESS_CARD, TRANSIT_SIGN, PRODUCT, DOCUMENT, GENERAL",
  "title": "Concise 3-6 word title of the scene/subject",
  "summary": "1-2 sentence summary of what is visible",
  "confidence": 0.0 to 1.0,
  "entities": {
    "eventTitle": "Name of event or empty",
    "date": "Exact event date or empty",
    "time": "Exact event time or empty",
    "location": "Exact address or place name or empty",
    "phoneNumber": "Exact phone number or empty",
    "productName": "Exact product/item name or empty",
    "routeNumber": "Transit route/bus number or empty",
    "emergencyDetected": false
  },
  "evidence": {
    "eventTitle": "Verbatim visible evidence or empty",
    "date": "Verbatim visible date text or empty",
    "time": "Verbatim visible time text or empty",
    "location": "Verbatim visible location text or empty",
    "phoneNumber": "Verbatim visible phone digits or empty",
    "productName": "Verbatim visible product text or empty",
    "routeNumber": "Verbatim visible route text or empty"
  }
}`;

    // Primary model: gemini-3.7-flash with LOW thinking.
    // Fallback: gemini-3.6-flash if temporary high-demand (503) occurs.
    const modelsToTry = ["gemini-3.7-flash", "gemini-3.6-flash"];
    let responseText = "";

    for (const model of modelsToTry) {
      try {
        const is37 = model.includes("3.7");
        const config: {
          responseMimeType: string;
          thinkingConfig?: { thinkingLevel: ThinkingLevel };
        } = {
          responseMimeType: "application/json",
        };

        if (is37) {
          config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
        }

        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
            {
              text: prompt,
            },
          ],
          config,
        });

        if (response.text && response.text.trim()) {
          responseText = response.text.trim();
          break;
        }
      } catch (geminiErr) {
        console.warn(`Attempt with ${model} failed:`, geminiErr);
      }
    }

    if (!responseText) {
      return NextResponse.json(
        { error: "The AI analysis returned an empty response. Please try again." },
        { status: 502 }
      );
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        { error: "The AI analysis returned malformed data. Please try again." },
        { status: 502 }
      );
    }

    const validatedData = geminiResponseSchema.safeParse(parsedJson);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: "The AI analysis structure could not be validated. Please try again." },
        { status: 502 }
      );
    }

    const { context, title, summary, confidence, entities, evidence } =
      validatedData.data;

    // Strict Anti-Hallucination Action Derivation on Server
    const actions: ServerAction[] = [];

    // 1. Calendar: Event Title + Date with verified evidence
    const validEvent = hasEvidence(entities.eventTitle, evidence.eventTitle);
    const validDate = hasEvidence(entities.date, evidence.date);
    if (entities.date && validDate) {
      actions.push({
        id: "action-calendar",
        label: "Add to Calendar",
        description: `Schedule "${entities.eventTitle || title}" on ${entities.date}${
          entities.time ? ` at ${entities.time}` : ""
        }`,
        type: "calendar",
      });
    }

    // 2. Maps: Location with verified evidence
    const validLocation = hasEvidence(entities.location, evidence.location);
    if (entities.location && validLocation) {
      actions.push({
        id: "action-maps",
        label: "Open in Maps",
        description: `Get directions to ${entities.location}`,
        type: "maps",
      });
    }

    // 3. Call: Phone number with verified digit evidence
    const validPhone = hasPhoneEvidence(entities.phoneNumber, evidence.phoneNumber);
    if (entities.phoneNumber && validPhone) {
      actions.push({
        id: "action-call",
        label: "Call Phone",
        description: `Dial ${entities.phoneNumber}`,
        type: "call",
      });
    }

    // 4. Search: Product, Route, or Subject with verified evidence
    const searchSubject =
      (hasEvidence(entities.productName, evidence.productName) &&
        entities.productName) ||
      (hasEvidence(entities.routeNumber, evidence.routeNumber) &&
        entities.routeNumber) ||
      (validEvent && entities.eventTitle) ||
      (validLocation && entities.location) ||
      title;

    if (searchSubject && searchSubject !== "Visual Subject") {
      actions.push({
        id: "action-search",
        label: "Search on Web",
        description: `Search Google for "${searchSubject}"`,
        type: "search",
      });
    }

    // 5. Explain: When there is meaningful summary
    if (summary && summary.length > 10) {
      actions.push({
        id: "action-explain",
        label: "Explain Context",
        description: "Review detailed insights from visual analysis",
        type: "explain",
      });
    }

    // 6. Share: Always available if we have an analysis
    actions.push({
      id: "action-share",
      label: "Share Details",
      description: "Send extracted details to WhatsApp, notes, or apps",
      type: "share",
    });

    // 7. Emergency Prototype Flow
    if (entities.emergencyDetected) {
      actions.unshift({
        id: "action-emergency",
        label: "Emergency Assistant (Prototype)",
        description: "Review safety protocol and acquire GPS coordinates",
        type: "emergency",
      });
    }

    // Sanitize entities if no evidence exists (ensure client receives empty string)
    const sanitizedEntities = {
      eventTitle: validEvent ? entities.eventTitle : "",
      date: validDate ? entities.date : "",
      time: hasEvidence(entities.time, evidence.time) ? entities.time : "",
      location: validLocation ? entities.location : "",
      phoneNumber: validPhone ? entities.phoneNumber : "",
      productName: hasEvidence(entities.productName, evidence.productName)
        ? entities.productName
        : "",
      routeNumber: hasEvidence(entities.routeNumber, evidence.routeNumber)
        ? entities.routeNumber
        : "",
      emergencyDetected: entities.emergencyDetected,
    };

    const clampedConfidence = Math.max(0.1, Math.min(1.0, confidence));

    return NextResponse.json({
      context,
      title,
      summary,
      confidence: clampedConfidence,
      entities: sanitizedEntities,
      evidence,
      actions,
    });
  } catch (error) {
    console.error("API Analyze Error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during image analysis." },
      { status: 500 }
    );
  }
}
