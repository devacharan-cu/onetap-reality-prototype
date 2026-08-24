import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { z } from "zod";

export const runtime = "nodejs";

const fieldSchema = z.object({
  value: z.string().default("Not mentioned"),
  status: z.enum(["verified", "web_verified", "not_mentioned", "uncertain"]).default("not_mentioned"),
  source: z.enum(["image", "web", "none"]).default("none"),
  confidence: z.number().default(1.0),
  evidence: z.string().optional(),
  sourceCitation: z.string().optional(),
});

const chatRequestSchema = z.object({
  message: z.string().min(1, "Question cannot be empty"),
  context: z.string().default("general"),
  title: z.string().default("Visual Subject"),
  summary: z.string().default(""),
  fields: z.record(z.string(), fieldSchema).default({}),
});

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
    const parsedBody = chatRequestSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Invalid question payload." },
        { status: 400 }
      );
    }

    const { message, context, title, summary, fields } = parsedBody.data;

    // Categorize fields into Verified (Image), Verified (Web), and Not Mentioned
    const verifiedImageFields: Array<{ name: string; value: string; evidence?: string }> = [];
    const verifiedWebFields: Array<{ name: string; value: string; citation?: string }> = [];
    const notMentionedFields: string[] = [];

    for (const [fieldName, field] of Object.entries(fields)) {
      if (field.status === "verified" && field.source === "image" && field.value !== "Not mentioned") {
        verifiedImageFields.push({
          name: fieldName,
          value: field.value,
          evidence: field.evidence,
        });
      } else if (field.status === "web_verified" && field.value !== "Not mentioned") {
        verifiedWebFields.push({
          name: fieldName,
          value: field.value,
          citation: field.sourceCitation || "Web Grounding",
        });
      } else {
        notMentionedFields.push(fieldName);
      }
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `You are the Zero-Hallucination Assistant for OneTap Reality (iQOO Hackathon 2026).
You are answering a user inquiry about a verified visual scene scanned on their phone.

STRUCTURED VERIFIED EVIDENCE:
- Context Type: ${context}
- Subject Title: ${title}
- Visual Summary: ${summary}

VERIFIED FACTS (FROM IMAGE ONLY):
${
  verifiedImageFields.length > 0
    ? verifiedImageFields.map((f) => `- ${f.name}: "${f.value}" (Evidence snippet: "${f.evidence || f.value}")`).join("\n")
    : "- None"
}

VERIFIED FACTS (FROM TRUSTED WEB SOURCES):
${
  verifiedWebFields.length > 0
    ? verifiedWebFields.map((f) => `- ${f.name}: "${f.value}" (Citation: ${f.citation})`).join("\n")
    : "- None"
}

FACTS EXPLICITLY NOT MENTIONED / ABSENT IN SOURCE:
${notMentionedFields.length > 0 ? notMentionedFields.map((f) => `- ${f}`).join(", ") : "- None"}

USER QUERY:
"${message}"

STRICT ZERO-HALLUCINATION & MULTILINGUAL RULES:
1. ONLY use the verified facts provided above. Do NOT invent missing details, phone numbers, addresses, dates, or websites.
2. If the user asks for a detail (e.g. location, venue, phone, time, website, price) that is absent or in the NOT MENTIONED list:
   - In the language of the user's query, state clearly that this information is not mentioned in the source.
   - Example (English): "The location is not mentioned in the source." / "No phone number is mentioned."
   - Example (Hindi): "स्थान का उल्लेख नहीं है।" / "फ़ोन नंबर का उल्लेख नहीं है।"
   - Example (Tamil): "இடம் குறிப்பிடப்படவில்லை."
   - Example (Spanish): "La ubicación no se menciona en la fuente."
3. If the user asks for translation, explanation, or summary:
   - Translate, explain, or summarize ONLY the verified facts.
   - NEVER introduce template placeholders (e.g. "123 Anywhere Street", "123-456-7890", "reallygreatsite.com").
4. If referring to web-verified facts, state that they were verified online.
5. Keep answers direct, concise, and helpful (1-3 sentences).`;

    const contents = [{ text: systemPrompt }];

    const modelsToTry = [
      "gemini-3.5-flash",
      "gemini-flash-latest",
      "gemini-3.5-flash-lite",
      "gemini-3.1-flash-lite",
    ];
    let answer = "";

    for (const model of modelsToTry) {
      try {
        const is37 = model.includes("3.7");
        const config: {
          thinkingConfig?: { thinkingLevel: ThinkingLevel };
        } = {};

        if (is37) {
          config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
        }

        const response = await ai.models.generateContent({
          model,
          contents,
          config,
        });

        if (response.text && response.text.trim()) {
          answer = response.text.trim();
          break;
        }
      } catch (err) {
        console.warn(`Chat model ${model} failed:`, err);
      }
    }

    if (!answer) {
      return NextResponse.json(
        { error: "Could not generate an answer. Please try asking again." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      answer,
    });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during follow-up." },
      { status: 500 }
    );
  }
}
