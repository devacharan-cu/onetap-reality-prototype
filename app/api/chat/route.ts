import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { z } from "zod";

export const runtime = "nodejs";

const chatRequestSchema = z.object({
  message: z.string().min(1, "Question cannot be empty"),
  context: z.string().default("general"),
  title: z.string().default("Visual Subject"),
  summary: z.string().default(""),
  fields: z.record(z.string(), z.unknown()).default({}),
  image: z.string().optional(),
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

    const { message, context, title, summary, fields, image } = parsedBody.data;

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are OneTap Reality Assistant (iQOO Hackathon 2026).
The user is asking a follow-up question about an image they just scanned with their phone.

SCENE CONTEXT:
- Context Type: ${context}
- Subject Title: ${title}
- Visual Summary: ${summary}
- Extracted Fields: ${JSON.stringify(fields, null, 2)}

USER QUESTION: "${message}"

CRITICAL RULES:
1. Answer strictly based on the visible image and verified scene facts above.
2. If the user asks for a detail (e.g. price, time, contact, address) that is NOT present or marked "Not mentioned":
   State clearly: "This information is not mentioned in the image and could not be verified."
3. NEVER invent or hallucinate facts, dates, prices, or numbers.
4. Keep the answer direct, concise, and phone-friendly (1-3 sentences max).
5. If the user asks to translate, provide a direct translation of the visible content.`;

    const contents: Array<{
      text?: string;
      inlineData?: { mimeType: string; data: string };
    }> = [];

    if (image && image.startsWith("data:image/")) {
      const match = image.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (match) {
        contents.push({
          inlineData: {
            mimeType: match[1],
            data: match[2],
          },
        });
      }
    }

    contents.push({ text: prompt });

    const modelsToTry = ["gemini-3.7-flash", "gemini-3.6-flash"];
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
