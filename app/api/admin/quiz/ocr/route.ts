import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { extractText } from "unpdf";

const API_KEY = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

export const config = {
    api: {
        bodyParser: false,
    },
};

// Simple delay function for retries
const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

async function callGeminiWithRetry(model: any, content: any, maxRetries = 3) {
    let lastError: any;
    for (let i = 0; i < maxRetries; i++) {
        try {
            const result = await model.generateContent(content);
            return result;
        } catch (error: any) {
            lastError = error;
            const status = error?.status || 0;
            const message = error?.message || "";

            console.error(`Gemini Attempt ${i + 1} failed (Status: ${status}):`, message);

            // If it's a 429 (Rate Limit) or 500/503 (Server Error), we retry
            if (status === 429 || status >= 500) {
                const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s...
                console.log(`Retrying in ${delay}ms...`);
                await wait(delay);
                continue;
            }
            // If it's a 400 (Bad Request) or others, don't bother retrying
            throw error;
        }
    }
    throw lastError;
}

export async function POST(req: NextRequest) {
    try {
        if (!API_KEY) {
            console.error("GEMINI_API_KEY is missing.");
            return NextResponse.json({ error: "GEMINI_API_KEY tidak dikonfigurasi di .env" }, { status: 500 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const nodeBuffer = Buffer.from(buffer);
        const mimeType = file.type;

        let extractedText = "";

        // --- STEP 1: LOCAL EXTRACTION ---
        if (mimeType === "application/pdf") {
            try {
                const { text } = await extractText(nodeBuffer);
                extractedText = Array.isArray(text) ? text.join("\n") : (text || "");
                console.log("PDF Local Extraction successful, length:", extractedText.length);
            } catch (err: any) {
                console.warn("Local PDF extraction failed:", err.message);
            }
        }



        // --- STEP 2: AI REFINEMENT ---
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        let result;

        if (extractedText && extractedText.trim().length > 50) {
            // Truncate if excessively long to avoid payload limits/timeouts
            const truncatedText = extractedText.substring(0, 15000);

            const prompt = `
                Extract multiple choice questions from this raw text in Indonesian.
                Return strictly as a JSON ARRAY of objects.
                
                IMPORTANT RULES FOR MATH:
                1. ALL math expressions MUST be wrapped in LaTeX delimiters ($...$ for inline, $$...$$ for block).
                2. Example: "Result of $x^2$ is..." instead of "Result of x^2 is...".
                3. Do NOT use raw LaTeX commands (like \\frac) without surrounding $ signs.

                STRUCTURE:
                [{"question_text": "...", "options": {"A": "...", "B": "...", "C": "...", "D": "...", "E": "..."}, "correct_answer": "...", "explanation_text": "..."}]
                
                OTHER RULES:
                1. Fix OCR typos and clarify messy sentence structures.
                2. Output exactly matched JSON format.
                
                RAW TEXT:
                ${truncatedText}
            `;
            result = await callGeminiWithRetry(model, prompt);
        } else {
            console.log("Fallback: Sending full file to Vision model");
            const base64Data = nodeBuffer.toString("base64");
            const prompt = `
                Extract multiple choice questions from this document.
                Return strictly as a JSON ARRAY of objects.
                
                IMPORTANT RULES FOR MATH:
                1. ALL math expressions MUST be wrapped in LaTeX delimiters ($...$ for inline, $$...$$ for block).
                2. Example: "Result of $x^2$ is..."
                3. Do NOT use raw LaTeX commands (like \\frac) without surrounding $ signs.

                Structure: [{"question_text": "...", "options": {"A": "...", "B": "...", "C": "...", "D": "...", "E": "..."}, "correct_answer": "...", "explanation_text": "..."}]
            `;
            result = await callGeminiWithRetry(model, [
                prompt,
                { inlineData: { data: base64Data, mimeType: mimeType } },
            ]);
        }

        const response = await result.response;
        const text = response.text();

        try {
            const jsonStart = text.indexOf('[');
            const jsonEnd = text.lastIndexOf(']') + 1;
            const cleanedText = (jsonStart !== -1 && jsonEnd !== -1) ? text.substring(jsonStart, jsonEnd) : text;
            const data = JSON.parse(cleanedText);
            return NextResponse.json(Array.isArray(data) ? data : [data]);
        } catch (parseError: any) {
            console.error("Gemini JSON Parse Error:", text);
            return NextResponse.json({
                error: "Format respon AI tidak valid",
                details: parseError.message,
                raw: text.substring(0, 500)
            }, { status: 500 });
        }

    } catch (error: any) {
        console.error("OCR API CRITICAL ERROR:", {
            message: error.message,
            status: error.status,
            stack: error.stack
        });
        return NextResponse.json({
            error: `Gagal memproses AI: ${error.message || "Unknown error"}`,
            status: error.status || 500
        }, { status: 500 });
    }
}
