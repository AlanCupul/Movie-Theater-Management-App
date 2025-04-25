import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
  const { movieTitle } = await req.json();
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "Missing Gemini API key" }, { status: 500 });
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `Do not give me options, just write one creative and somewhat short movie description for the movie titled: "${movieTitle}"`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });
    const description = response.text || "No description generated.";
    return NextResponse.json({ description });
  } catch (e) {
    return NextResponse.json({ error: "Failed to generate description." }, { status: 500 });
  }
}
