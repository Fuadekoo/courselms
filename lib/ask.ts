import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export type AIProvider = "gemini" | "openai";

export async function askLLM(
  question: string,
  context: string[],
  aiProvider: AIProvider = "gemini"
) {
  // If no context is provided, use general AI response
  const hasContext = context && context.length > 0;

  const prompt = hasContext
    ? `Answer the question based only on the following course content:\n\n${context.join(
        "\n\n"
      )}\n\nQuestion: ${question}`
    : question;

  try {
    if (aiProvider === "openai") {
      const systemContent = hasContext
        ? "You are a helpful AI assistant that answers questions based on the provided course content. Only use information from the provided content to answer questions."
        : "You are a helpful AI assistant. Answer questions clearly and concisely.";

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemContent,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      return completion.choices[0]?.message?.content || "No response generated";
    } else {
      // Default to Gemini
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      });

      return result.response.text();
    }
  } catch (error) {
    console.error(`Error with ${aiProvider}:`, error);
    throw new Error(`Failed to get response from ${aiProvider}`);
  }
}

export type PDFFile = {
  fileName: string;
  mimeType: string;
  base64Data: string;
  aiProvider: AIProvider;
  uploadedAt: string;
};

export async function askLLMWithPDFs(
  question: string,
  pdfFiles: PDFFile[],
  aiProvider: AIProvider = "gemini"
) {
  try {
    if (aiProvider === "openai") {
      console.log("🤖 Using OpenAI for PDF processing");

      // For OpenAI, we'll use the vision model to process PDFs
      const userContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] =
        [];

      // Add PDF images to the content first
      for (const pdfFile of pdfFiles) {
        console.log("🔄 Converting PDF to images for OpenAI...");
        // Convert PDF to images for OpenAI vision model
        const pdfImages = await convertPDFToImages(pdfFile.base64Data);
        console.log(`✅ Converted to ${pdfImages.length} images`);

        for (const imageBase64 of pdfImages) {
          userContent.push({
            type: "image_url",
            image_url: {
              url: `data:image/png;base64,${imageBase64}`,
            },
          });
        }
      }

      // Add the text prompt after images
      const prompt = `The images above show pages from a course PDF document.

IMPORTANT INSTRUCTIONS:
1. Carefully read and analyze ALL the text content shown in the PDF images above
2. Answer the question ONLY using information visible in these PDF images
3. Provide specific details, examples, and explanations from the document
4. Quote relevant sections when appropriate
5. If you cannot find the answer in the visible PDF content, you MUST respond with EXACTLY: "I cannot find this information in the course materials"
6. Be detailed and comprehensive in your response when information is found
7. Do not make up or assume information that is not explicitly shown in the PDF

Student's Question: ${question}

Please provide a detailed answer based on what you can see in the PDF images:`;

      userContent.push({ type: "text", text: prompt });

      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        {
          role: "system",
          content:
            'You are a helpful course assistant. You must answer questions based ONLY on the content shown in the PDF images provided. Extract and use specific information from the images. If information is not found in the images, respond with EXACTLY: "I cannot find this information in the course materials". Never make up information that is not visible in the images.',
        },
        {
          role: "user",
          content: userContent,
        },
      ];

      console.log("📤 Sending to OpenAI GPT-4o with vision");

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: messages,
        max_tokens: 2000,
        temperature: 0.4,
      });

      const response =
        completion.choices[0]?.message?.content || "No response generated";
      console.log("📥 OpenAI response received:", response.substring(0, 100));

      // Check if the AI couldn't find information in the course materials
      if (
        response.toLowerCase().includes("cannot find") ||
        response.toLowerCase().includes("not in the pdf") ||
        response.toLowerCase().includes("not in the course materials") ||
        response.toLowerCase().includes("not found in") ||
        response.toLowerCase().includes("no information")
      ) {
        return "Please ask only about the course.";
      }

      return response;
    } else {
      // Gemini PDF processing
      console.log("🤖 Using Gemini for PDF processing");

      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
          temperature: 0.4,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 2048,
        },
        systemInstruction:
          'You are a helpful course assistant. You must answer questions based ONLY on the content provided in the PDF document. Extract specific information, provide detailed explanations, and quote relevant sections. If information is not in the PDF, respond with EXACTLY: "I cannot find this information in the course materials". Never make up information that is not in the PDF.',
      });

      // Prepare the parts array with PDF data first, then the prompt
      const parts: Array<
        { text: string } | { inlineData: { mimeType: string; data: string } }
      > = [];

      // Add each PDF file to the parts first
      for (const pdfFile of pdfFiles) {
        parts.push({
          inlineData: {
            mimeType: pdfFile.mimeType,
            data: pdfFile.base64Data,
          },
        });
      }

      // Then add the prompt with clear instructions
      const prompt = `You are a helpful course assistant. The PDF document above contains the course material.

IMPORTANT INSTRUCTIONS:
1. Answer the question ONLY using information from the PDF document provided above
2. Provide specific details, examples, and explanations from the document
3. Quote relevant sections when appropriate
4. If the answer is not in the PDF, you MUST respond with EXACTLY: "I cannot find this information in the course materials"
5. Be detailed and comprehensive in your response when information is found
6. Use clear formatting and structure your answer well
7. Do not make up or assume information that is not explicitly in the PDF

Student's Question: ${question}

Please provide a detailed answer based on the PDF content:`;

      parts.push({ text: prompt });

      console.log("📤 Sending to Gemini:", {
        pdfCount: pdfFiles.length,
        questionLength: question.length,
        model: "gemini-2.5-flash",
      });

      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: parts,
          },
        ],
      });

      const response = result.response.text();
      console.log("📥 Gemini response received:", response.substring(0, 100));

      // Check if the AI couldn't find information in the course materials
      if (
        response.toLowerCase().includes("cannot find") ||
        response.toLowerCase().includes("not in the pdf") ||
        response.toLowerCase().includes("not in the course materials") ||
        response.toLowerCase().includes("not found in") ||
        response.toLowerCase().includes("no information")
      ) {
        return "Please ask only about the course.";
      }

      return response;
    }
  } catch (error) {
    console.error(`Error processing PDFs with ${aiProvider}:`, error);
    throw new Error(`Failed to process PDF documents with ${aiProvider}`);
  }
}

// Helper function to convert PDF to images for OpenAI
async function convertPDFToImages(pdfBase64: string): Promise<string[]> {
  try {
    const pdfBuffer = Buffer.from(pdfBase64, "base64");

    // Load the PDF document using pdf-lib
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pageCount = pdfDoc.getPageCount();

    const imageBase64Array: string[] = [];
    const outputWidth = 2000;
    const outputHeight = 2000;
    const density = 200; // DPI for rendering

    // Extract each page using pdf-lib and convert to image using sharp
    for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
      try {
        // Create a single-page PDF for this page using pdf-lib
        const singlePagePdf = await PDFDocument.create();
        const [copiedPage] = await singlePagePdf.copyPages(pdfDoc, [pageIndex]);
        singlePagePdf.addPage(copiedPage);
        const pagePdfBytes = await singlePagePdf.save();

        // Use sharp (server-only) to convert the single-page PDF to PNG image
        // Sharp supports PDF input when compiled with PDF support
        const imageBuffer = await sharp(pagePdfBytes, {
          density,
          limitInputPixels: false,
        })
          .png()
          .resize(outputWidth, outputHeight, {
            fit: "inside",
            withoutEnlargement: true,
            background: { r: 255, g: 255, b: 255, alpha: 1 }, // White background
          })
          .toBuffer();

        // Convert to base64
        const imageBase64 = imageBuffer.toString("base64");
        imageBase64Array.push(imageBase64);
      } catch (pageError) {
        console.error(`Error converting page ${pageIndex + 1}:`, pageError);
        // Skip this page and continue with others
      }
    }

    return imageBase64Array;
  } catch (error) {
    console.error("Error converting PDF to images:", error);
    // Fallback: return empty array if conversion fails
    return [];
  }
}
