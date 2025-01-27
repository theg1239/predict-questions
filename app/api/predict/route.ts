import { NextResponse, NextRequest } from "next/server";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { parseForm } from "@/lib/parse-form";
import fs from "fs";

export const runtime = "nodejs";

type ContentPart =
  | { type: "text"; text: string }
  | { type: "file"; data: Buffer; mimeType: string };

interface CoreUserMessage {
  role: "user";
  content: ContentPart[];
}

interface PredictedQuestion {
  id: number;
  text: string;
  dataTable?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { files } = await parseForm(req);
    if (files.length === 0) {
      console.error("No files parsed from the form data.");
      return NextResponse.json({ error: "No files uploaded." }, { status: 400 });
    }

    const allowedMimeTypes = ["application/pdf"];
    const invalidFiles = files.filter(
      (file) => !allowedMimeTypes.includes(file.mimetype || "")
    );
    if (invalidFiles.length > 0) {
      console.error(
        "Unsupported file types detected:",
        invalidFiles.map((f) => f.mimetype)
      );
      return NextResponse.json(
        {
          error:
            "Unsupported file types uploaded. Please upload PDF files only.",
        },
        { status: 400 }
      );
    }

    const messages: CoreUserMessage[] = [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Please analyze the content of the uploaded PDF documents and generate a list of potential exam questions in pure JSON format. The JSON should be an array of objects, each with the following structure:

{
  "id": number,
  "text": string,
  "dataTable": string // A markdown table that can be parsed, if the question does have a table"
}

Do not include any markdown, code fences, or additional text outside of the JSON. Ensure the JSON is valid and only contains the list of questions with their corresponding data tables.`,
          },
        ],
      },
    ];

    for (const file of files) {
      const fileBuffer = fs.readFileSync(file.filepath);
      messages[0].content.push({
        type: "file",
        data: fileBuffer,
        mimeType: file.mimetype || "application/pdf",
      });
    }

    console.log("Prepared messages for AI SDK:", JSON.stringify(messages, null, 2));

    const geminiModel = google(
      process.env.GEMINI_MODEL || "models/gemini-1.5-flash"
    );

    const result = await generateText({
      model: geminiModel,
      messages,
    });

    console.log("AI Model Response:", JSON.stringify(result, null, 2));

    let predictedQuestions: PredictedQuestion[] = [];
    try {
      let cleanText = result.text.trim();

      const jsonFenceMatch = cleanText.match(/```json\s*([\s\S]*?)```/i);
      if (jsonFenceMatch && jsonFenceMatch[1]) {
        cleanText = jsonFenceMatch[1].trim();
      }

      if (!cleanText.startsWith("[")) {
        const firstBracket = cleanText.indexOf("[");
        const lastBracket = cleanText.lastIndexOf("]");
        if (firstBracket !== -1 && lastBracket !== -1) {
          cleanText = cleanText.substring(firstBracket, lastBracket + 1).trim();
        } else {
          throw new Error("No JSON array found in AI response.");
        }
      }

      predictedQuestions = JSON.parse(cleanText);

      if (!Array.isArray(predictedQuestions)) {
        throw new Error("Parsed AI response is not an array.");
      }
    } catch (parseError) {
      console.error("Error parsing AI response as JSON:", parseError);
      console.log("AI Response Text:", result.text);

      return NextResponse.json(
        { error: "Failed to parse AI response. AI must return valid JSON." },
        { status: 500 }
      );
    }

    console.log("Parsed Predicted Questions:", predictedQuestions);

    const isValid = predictedQuestions.every((q) => {
      const hasId = typeof q.id === "number";
      const hasText = typeof q.text === "string";
      const validDataTable =
        q.dataTable === undefined || typeof q.dataTable === "string";
      return hasId && hasText && validDataTable;
    });

    if (!isValid) {
      console.error("Invalid question structure detected.");
      return NextResponse.json(
        { error: "Invalid structure in predicted questions." },
        { status: 500 }
      );
    }

    for (const filePath of files.map((f) => f.filepath)) {
      fs.unlinkSync(filePath);
    }

    return NextResponse.json({ questions: predictedQuestions }, { status: 200 });
  } catch (error: any) {
    console.error("Error in /api/predict route:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json(
    { error: "Method Not Allowed. Use POST instead." },
    { status: 405 }
  );
}

export async function PUT(req: NextRequest) {
  return NextResponse.json(
    { error: "Method Not Allowed. Use POST instead." },
    { status: 405 }
  );
}