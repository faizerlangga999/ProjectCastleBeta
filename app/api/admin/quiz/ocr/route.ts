import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const config = {
    api: {
        bodyParser: false,
    },
};

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const base64Data = Buffer.from(buffer).toString("base64");
        const mimeType = file.type;

        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-lite", // Using 2.0 for better stability
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        const prompt = `
      Extract ALL multiple choice questions from this image/document.
      Return the output strictly as an ARRAY of objects.
      
      JSON Structure:
      [
        {
          "question_text": "...",
          "options": {
            "A": "...",
            "B": "...",
            "C": "...",
            "D": "...",
            "E": "..."
          },
          "correct_answer": "A",
          "explanation_text": "..."
        }
      ]
      
      RULES:
      1. LaTeX: Convert all math to LaTeX. Use $ for inline (e.g., $x^2$) and $$ for block.
      2. Matrices: Use \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}. 2D layout is MANDATORY.
      3. Fractions: Use \\frac{n}{d}.
      4. If correct answer is unknown, set to null.
    `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType,
                },
            },
        ]);

        const response = await result.response;
        const text = response.text();

        try {
            // Find JSON array or object in the response (robust against extra text)
            const jsonMatch = text.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
            const jsonString = jsonMatch ? jsonMatch[0] : text;

            const data = JSON.parse(jsonString);
            return NextResponse.json(data);
        } catch (parseError) {
            console.error("Error parsing JSON from Gemini:", text);
            // Try one last cleanup for common markdown issues
            try {
                const cleaned = text.replace(/```json|```/g, "").trim();
                return NextResponse.json(JSON.parse(cleaned));
            } catch (innerError) {
                return NextResponse.json({ error: "Failed to parse AI response", raw_response: text }, { status: 500 });
            }
        }

    } catch (error: any) {
        console.error("OCR API Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
