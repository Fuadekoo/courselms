import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

export type AIProvider = "gemini" | "openai";

export async function askLLM(
  question: string,
  context: string[],
  aiProvider: AIProvider = "gemini"
) {
  // If no context is provided, use general AI response
  const hasContext = context && context.length > 0;

  const prompt = hasContext
    ? `You are helping a student with questions about their course. Use the following course information to answer their question. If the question is related to the course but the specific information isn't in the provided context, use your knowledge to provide a helpful answer that relates to the course topic.\n\nCourse Information:\n${context.join(
        "\n\n"
      )}\n\nQuestion: ${question}\n\nProvide a helpful answer based on the course information above.`
    : question;

  try {
    if (aiProvider === "openai") {
      // Check if OpenAI is configured
      if (!openai || !process.env.OPENAI_API_KEY) {
        throw new Error("OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment variables.");
      }
      
      const systemContent = hasContext
        ? "You are Darulkubra AI, a helpful AI assistant for Darulkubra Academy. You answer questions based on the provided course information. Always identify yourself as Darulkubra AI in your responses. Use information from the provided course content to answer questions. If a question is related to the course but specific details aren't in the provided context, use your knowledge to provide a helpful answer that relates to the course topic."
        : "You are Darulkubra AI, a helpful AI assistant for Darulkubra Academy. Always identify yourself as Darulkubra AI in your responses. Answer questions clearly and concisely.";

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
      // Check if Gemini is configured
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("Gemini API key is not configured. Please set GEMINI_API_KEY in your environment variables.");
      }
      
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        systemInstruction: hasContext
          ? "You are Darulkubra AI, a helpful AI assistant for Darulkubra Academy. You answer questions based on the provided course information. Always identify yourself as Darulkubra AI in your responses. Use information from the provided course content to answer questions. If a question is related to the course but specific details aren't in the provided context, use your knowledge to provide a helpful answer that relates to the course topic."
          : "You are Darulkubra AI, a helpful AI assistant for Darulkubra Academy. Always identify yourself as Darulkubra AI in your responses. Answer questions clearly and concisely."
      });

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
    
    // Provide a helpful default response instead of throwing
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Check for specific error types
    if (errorMessage.includes('API key') || errorMessage.includes('authentication')) {
      return `Hey! This is Darulkubra AI. There's a setup issue on my end. Your instructor needs to configure the AI service. Let them know and they'll get it sorted! 😊`;
    }
    
    if (errorMessage.includes('network') || errorMessage.includes('timeout') || errorMessage.includes('fetch')) {
      return `Hi! Darulkubra AI here. Can't connect right now - might be an internet issue. Check your connection and try again! If it keeps happening, let your instructor know. 🌐`;
    }
    
    // Generic helpful response
    return `Hey! Darulkubra AI here. Oops! I ran into a problem: ${errorMessage}

Try these:
• Ask your question differently
• Check your internet
• Let your instructor know if it keeps happening

I'll be back to help soon! 💪`;
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
      // Check if OpenAI is configured
      if (!openai || !process.env.OPENAI_API_KEY) {
        throw new Error("OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment variables.");
      }
      
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
      const prompt = `You are Darulkubra AI, the AI assistant for Darulkubra Academy. Always identify yourself as Darulkubra AI in your response.

The images above show pages from the provided PDF document.

IMPORTANT INSTRUCTIONS:
1. Carefully read and analyze ALL the text content shown in the PDF images above
2. PRIORITIZE information from the document - use it as your primary source
3. If the question is RELATED to the document content (even if not explicitly stated in the PDF), you can use your general knowledge to provide a helpful answer that connects to the document
4. When using general knowledge, always relate it back to the document and explain how it connects
5. Provide specific details, examples, and explanations from the document when available
6. Quote relevant sections from the PDF when appropriate
7. If the question is completely unrelated to the document content, politely explain that it's outside the scope
8. Be detailed and comprehensive in your response
9. Make connections between the document and related concepts to help the student understand better
10. Avoid using phrases like "course material", "course content", or "course document" - refer to it simply as "the document" or "the provided content"

Student's Question: ${question}

Please provide a detailed answer that uses the document as the foundation, and supplement with related knowledge when helpful. Remember to identify yourself as Darulkubra AI:`;

      userContent.push({ type: "text", text: prompt });

      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        {
          role: "system",
          content:
            'You are Darulkubra AI, a helpful assistant for Darulkubra Academy. Always identify yourself as Darulkubra AI in your responses. Your primary source is the PDF document shown in the images. When answering questions: 1) Always prioritize information from the document, 2) If a question is related to the document but not explicitly stated in the PDF, use your general knowledge to provide a helpful answer that connects to the document, 3) Explain how your answer relates to the document, 4) Only refuse to answer if the question is completely unrelated to the document topic. Be helpful and educational while staying relevant. Avoid using phrases like "course material", "course content", or "course document" - refer to it simply as "the document" or "the provided content".',
        },
        {
          role: "user",
          content: userContent,
        },
      ];

      console.log("📤 Sending to OpenAI GPT-4o with vision");
      console.log("📊 Request details:", {
        pdfCount: pdfFiles.length,
        imageCount: userContent.filter(c => c.type === "image_url").length,
        questionLength: question.length,
        hasApiKey: !!process.env.OPENAI_API_KEY
      });

      if (!openai) {
        throw new Error("OpenAI client is not initialized. Please check your API key configuration.");
      }

      let completion;
      try {
        completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: messages,
          max_tokens: 2000,
          temperature: 0.4,
        });
      } catch (apiError: any) {
        console.error("❌ OpenAI API call failed:", apiError);
        const apiErrorMessage = apiError?.message || String(apiError || 'Unknown error');
        
        // Check for specific OpenAI API errors
        if (apiErrorMessage.includes('API key') || apiErrorMessage.includes('Invalid API key') || apiErrorMessage.includes('authentication')) {
          throw new Error("OpenAI API key is invalid or not configured. Please set a valid OPENAI_API_KEY in your environment variables.");
        }
        if (apiErrorMessage.includes('rate limit') || apiErrorMessage.includes('quota')) {
          throw new Error("OpenAI API rate limit exceeded. Please try again later.");
        }
        if (apiErrorMessage.includes('model') || apiErrorMessage.includes('not found')) {
          throw new Error("OpenAI model not available. Please check your API access.");
        }
        
        // Re-throw with more context
        throw new Error(`OpenAI API error: ${apiErrorMessage}`);
      }

      const response =
        completion.choices[0]?.message?.content || "No response generated";
      console.log("📥 OpenAI response received:", response.substring(0, 100));

      // Only reject if the response clearly indicates the question is completely unrelated
      // Don't reject if AI is providing related information even if not explicitly in PDF
      if (
        response.toLowerCase().includes("completely unrelated") ||
        response.toLowerCase().includes("outside the scope") ||
        response.toLowerCase().includes("not related to this course")
      ) {
        return "Hey! Darulkubra AI here. This question seems to be outside the scope. Please ask questions related to the document content!";
      }

      return response;
    } else {
      // Gemini PDF processing
      console.log("🤖 Using Gemini for PDF processing");
      
      // Check if Gemini is configured
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("Gemini API key is not configured. Please set GEMINI_API_KEY in your environment variables.");
      }

      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
          temperature: 0.4,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 2048,
        },
        systemInstruction:
          'You are Darulkubra AI, a helpful assistant for Darulkubra Academy. Always identify yourself as Darulkubra AI in your responses. Your primary source is the PDF document. When answering: 1) Always prioritize information from the document, 2) If a question is related to the document but not explicitly in the PDF, use your general knowledge to provide a helpful answer that connects to the document, 3) Explain how your answer relates to the document, 4) Only refuse if the question is completely unrelated to the document topic. Be helpful and educational while staying relevant. Avoid using phrases like "course material", "course content", or "course document" - refer to it simply as "the document" or "the provided content".',
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
      const prompt = `You are Darulkubra AI, the AI assistant for Darulkubra Academy. Always identify yourself as Darulkubra AI in your response.

The PDF document above contains the provided content.

IMPORTANT INSTRUCTIONS:
1. PRIORITIZE information from the document - use it as your primary source
2. If the question is RELATED to the document content (even if not explicitly stated in the PDF), you can use your general knowledge to provide a helpful answer that connects to the document
3. When using general knowledge, always relate it back to the document and explain how it connects
4. Provide specific details, examples, and explanations from the document when available
5. Quote relevant sections from the PDF when appropriate
6. If the question is completely unrelated to the document content, politely explain that it's outside the scope
7. Be detailed and comprehensive in your response
8. Make connections between the document and related concepts to help the student understand better
9. Avoid using phrases like "course material", "course content", or "course document" - refer to it simply as "the document" or "the provided content"

Student's Question: ${question}

Please provide a detailed answer that uses the document as the foundation, and supplement with related knowledge when helpful. Remember to identify yourself as Darulkubra AI:`;

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

      // Only reject if the response clearly indicates the question is completely unrelated
      // Don't reject if AI is providing related information even if not explicitly in PDF
      if (
        response.toLowerCase().includes("completely unrelated") ||
        response.toLowerCase().includes("outside the scope") ||
        response.toLowerCase().includes("not related to this course")
      ) {
        return "Hey! Darulkubra AI here. This question seems to be outside the scope. Please ask questions related to the document content!";
      }

      return response;
    }
  } catch (error) {
    console.error(`❌ Error processing PDFs with ${aiProvider}:`, error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Create a custom error that can be caught and handled by caller
    const pdfError = new Error(`PDF processing failed: ${errorMessage}`) as Error & {
      isPdfError: boolean;
      errorType: string;
    };
    pdfError.isPdfError = true;
    pdfError.errorType = errorMessage.includes('API key') || errorMessage.includes('authentication') 
      ? 'AUTH_ERROR'
      : errorMessage.includes('network') || errorMessage.includes('timeout') || errorMessage.includes('fetch')
      ? 'NETWORK_ERROR'
      : 'UNKNOWN_ERROR';
    
    // Throw the error so caller can catch and try fallback
    throw pdfError;
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
