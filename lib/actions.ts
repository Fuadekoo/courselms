"use server";

import { embedQuery, embedChunks } from "@/lib/embed";
import { queryRelevantChunks, saveChunks } from "@/lib/chroma";
import { askLLM, askLLMWithPDFs, AIProvider, PDFFile } from "@/lib/ask";
import {
  getCachedEmbeddings,
  setCachedEmbeddings,
  getCachedResponse,
  setCachedResponse,
  getCachedContent,
  setCachedContent,
} from "@/lib/cache";
import { writeFile, readFile, readdir } from "fs/promises";
import { join } from "path";
import { createHash } from "crypto";

// Simple text chunking function
function chunkText(text: string, chunkSize: number = 10000): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}

// Ask question using course-specific AI PDF data
export async function askCourseQuestion(courseId: string, question: string) {
  let course: {
    pdfData: string | null;
    aiProvider: string | null;
    titleEn: string | null;
    titleAm: string | null;
    aboutEn: string | null;
    aboutAm: string | null;
    courseMaterials: string | null;
    video: string | null;
    thumbnail: string | null;
  } | null = null;
  let aiProvider: AIProvider = "gemini";

  // Check API keys before processing
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
  const hasGeminiKey = !!process.env.GEMINI_API_KEY;
  console.log("🔑 API Key Status:", { hasOpenAIKey, hasGeminiKey });

  try {
    console.log("🤖 askCourseQuestion called:", {
      courseId,
      question: question.substring(0, 50),
    });

    const prisma = (await import("@/lib/db")).default;

    // Get the course with AI PDF data and course information
    course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        pdfData: true,
        aiProvider: true,
        titleEn: true,
        titleAm: true,
        aboutEn: true,
        aboutAm: true,
        courseMaterials: true,
        video: true,
        thumbnail: true,
      },
    });

    aiProvider = (course?.aiProvider as AIProvider) || "gemini";

    // If no PDF is provided, use course data as context for AI
    if (!course?.pdfData) {
      console.log("⚠️ No PDF found, using course data as context:", aiProvider);

      try {
        const { askLLM } = await import("@/lib/ask");
        const { getCourseMaterials } = await import(
          "@/lib/action/courseMaterials"
        );

        // Build enhanced context from course information
        const context: string[] = [];

        // Add course header information
        context.push("COURSE INFORMATION:");
        context.push("================");

        // Add course title and description with better formatting
        if (course?.titleEn) {
          context.push(`Course Title: ${course.titleEn}`);
        }
        if (course?.titleAm) {
          context.push(`የኮርስ ርዕስ (Amharic): ${course.titleAm}`);
        }

        context.push(""); // Add spacing

        if (course?.aboutEn) {
          context.push(`Course Description: ${course.aboutEn}`);
        }
        if (course?.aboutAm) {
          context.push(`የኮርስ መግለጫ (Amharic): ${course.aboutAm}`);
        }

        context.push(""); // Add spacing

        // Add introduction video information
        context.push("INTRODUCTION VIDEO:");
        context.push("===================");
        if (course?.video) {
          context.push(`🎥 Introduction video is available for this course`);
          context.push(`Video URL: ${course.video}`);
          if (course.thumbnail) {
            context.push(`Thumbnail: ${course.thumbnail}`);
          }
        } else {
          context.push(
            "No introduction video is currently available for this course."
          );
        }

        context.push(""); // Add spacing

        // Add course materials information
        context.push("COURSE MATERIALS:");
        context.push("==================");
        try {
          const materials = await getCourseMaterials(courseId);
          if (materials && materials.length > 0) {
            const materialsList = materials
              .map((m) => `• ${m.name} (${m.type})`)
              .join("\n");
            context.push(`Available Materials:\n${materialsList}`);
          } else {
            context.push(
              "No additional materials are currently available for this course."
            );
          }
        } catch (materialsError) {
          console.log("⚠️ Could not fetch course materials:", materialsError);
          context.push(
            "Course materials information is currently unavailable."
          );
        }

        context.push(""); // Add spacing

        // Add subactivity videos information
        context.push("COURSE VIDEOS AND ACTIVITIES:");
        context.push("=============================");
        try {
          const { getMySingleCourseContent } = await import(
            "@/actions/student/mycourse"
          );
          const { auth } = await import("@/lib/auth");

          const session = await auth();
          if (session?.user?.id) {
            const courseContent = await getMySingleCourseContent(
              session.user.id,
              courseId
            );

            if (courseContent?.activity && courseContent.activity.length > 0) {
              courseContent.activity.forEach(
                (activity: any, activityIndex: number) => {
                  const activityTitle =
                    activity.titleEn ||
                    activity.titleAm ||
                    `Activity ${activityIndex + 1}`;
                  context.push(`📚 ${activityTitle}`);

                  if (activity.subActivity && activity.subActivity.length > 0) {
                    activity.subActivity.forEach(
                      (subActivity: any, subIndex: number) => {
                        const subTitle =
                          subActivity.titleEn ||
                          subActivity.titleAm ||
                          `Sub-activity ${subIndex + 1}`;
                        const videoInfo = subActivity.video
                          ? ` (Video available)`
                          : ` (No video)`;
                        const freeStatus = subActivity.isFree ? ` - FREE` : ``;

                        context.push(
                          `  ${
                            subIndex + 1
                          }. ${subTitle}${videoInfo}${freeStatus}`
                        );
                      }
                    );
                  } else {
                    context.push(`  No sub-activities available`);
                  }

                  context.push(""); // Add spacing between activities
                }
              );
            } else {
              context.push(
                "No activities or videos are currently available for this course."
              );
            }
          } else {
            context.push(
              "Unable to access course content - user not authenticated."
            );
          }
        } catch (contentError) {
          console.log("⚠️ Could not fetch course content:", contentError);
          context.push(
            "Course video and activity information is currently unavailable."
          );
        }

        context.push(""); // Add spacing
        context.push("INSTRUCTIONS:");
        context.push("=============");
        context.push(
          "You are Darulkubra AI, a helpful course assistant. Your role is to help students overcome challenges and difficulties they encounter while taking this course."
        );
        context.push("");
        context.push("HELPING APPROACH:");
        context.push(
          "- Focus on assisting with learning challenges, concepts they find difficult, or problems they're facing"
        );
        context.push(
          "- Use the course materials, videos, and activities provided above to guide students"
        );
        context.push(
          "- Suggest specific videos or activities that can help with their current challenge"
        );
        context.push(
          "- Provide step-by-step guidance when explaining difficult concepts"
        );
        context.push(
          "- Recommend the most relevant introduction video or activity videos for their specific question"
        );
        context.push("");
        context.push("RESPONSE GUIDELINES:");
        context.push(
          "- Be encouraging and supportive when students mention difficulties"
        );
        context.push(
          "- Reference specific course content (videos, activities, materials) in your answers"
        );
        context.push(
          "- If the question cannot be answered using this information, politely explain what information you have access to and suggest contacting the instructor for more specific details"
        );
        context.push("- Always maintain a helpful, educational tone");

        // Use course context to answer the question
        const directAnswer = await askLLM(question, context, aiProvider);

        return {
          success: true,
          answer: directAnswer,
          aiProvider,
        };
      } catch (aiError) {
        console.error(
          "❌ Error calling AI provider with course context:",
          aiError
        );
        // Return default helpful response when AI processing fails
        const defaultResponse = `Hey! Darulkubra AI here. I'm having a bit of trouble processing your question right now. 😅

Here's what you can try:
• Check your internet connection
• Try asking your question in a different way
• Reach out to your instructor - they can help!

If documents need to be set up, let your instructor know. I'll be back up and running soon!`;

        return {
          success: true,
          answer: defaultResponse,
          aiProvider,
        };
      }
    }

    const filename = course.pdfData;

    console.log("📄 Reading PDF file:", filename, "with provider:", aiProvider);

    // Generate cache key based on courseId and question
    const contentHash = createHash("md5")
      .update(courseId + filename)
      .digest("hex");

    // Check cache first
    const cachedResponse = await getCachedResponse(
      question,
      contentHash,
      aiProvider
    );
    if (cachedResponse) {
      console.log("✅ Using cached response for question");
      return {
        success: true,
        answer: cachedResponse,
        aiProvider,
      };
    }

    // Read the PDF file from filesystem
    const filePath = join(process.cwd(), "docs", "ai-pdfs", filename);

    // Check if file exists
    try {
      const pdfBuffer = await readFile(filePath);
      const base64Data = pdfBuffer.toString("base64");

      console.log(`✅ PDF loaded, size: ${base64Data.length} chars`);

      // Create PDF metadata for AI processing
      const pdfMetadata: PDFFile = {
        fileName: filename,
        mimeType: "application/pdf",
        base64Data: base64Data,
        aiProvider: aiProvider,
        uploadedAt: new Date().toISOString(),
      };

      // Validate API key before processing
      if (aiProvider === "openai" && !hasOpenAIKey) {
        throw new Error(
          "OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment variables."
        );
      }
      if (aiProvider === "gemini" && !hasGeminiKey) {
        throw new Error(
          "Gemini API key is not configured. Please set GEMINI_API_KEY in your environment variables."
        );
      }

      console.log("🤖 Calling AI with PDF data...", {
        provider: aiProvider,
        hasApiKey: aiProvider === "openai" ? hasOpenAIKey : hasGeminiKey,
      });

      // Use the AI to answer the question
      try {
        const answer = await askLLMWithPDFs(
          question,
          [pdfMetadata],
          aiProvider
        );

        console.log("✅ AI response received, length:", answer.length);

        // Cache the response
        await setCachedResponse(question, contentHash, aiProvider, answer);

        return {
          success: true,
          answer,
          aiProvider,
        };
      } catch (aiError: any) {
        console.error("❌ Error calling AI with PDF:", aiError);
        console.error("Error type:", aiError?.errorType);
        console.error("Error message:", aiError?.message);
        console.error("Is PDF error:", aiError?.isPdfError);

        // Check if it's an API key error - don't try fallback, just return helpful message
        const errorMessage =
          aiError?.message || String(aiError || "Unknown error");
        if (
          errorMessage.includes("API key") ||
          errorMessage.includes("not configured") ||
          errorMessage.includes("authentication")
        ) {
          console.error(
            "🔑 API key issue detected - returning helpful message"
          );
          return {
            success: true,
            answer:
              "Hey! Darulkubra AI here. There's a setup issue - your instructor needs to configure the AI service API key. Let them know! 🔧",
            aiProvider,
          };
        }

        // If PDF processing failed, try fallback with course context
        if (aiError?.isPdfError) {
          console.log(
            "⚠️ PDF processing failed, trying with course context as fallback..."
          );

          try {
            const { askLLM } = await import("@/lib/ask");
            const { getCourseMaterials } = await import(
              "@/lib/action/courseMaterials"
            );

            // Build enhanced context from course information (fallback mode)
            const context: string[] = [];

            // Add course header information
            context.push("COURSE INFORMATION:");
            context.push("================");

            // Add course title and description with better formatting
            if (course.titleEn) {
              context.push(`Course Title: ${course.titleEn}`);
            }
            if (course.titleAm) {
              context.push(`የኮርስ ርዕስ (Amharic): ${course.titleAm}`);
            }

            context.push(""); // Add spacing

            if (course.aboutEn) {
              context.push(`Course Description: ${course.aboutEn}`);
            }
            if (course.aboutAm) {
              context.push(`የኮርስ መግለጫ (Amharic): ${course.aboutAm}`);
            }

            context.push(""); // Add spacing

            // Add introduction video information (fallback mode)
            context.push("INTRODUCTION VIDEO:");
            context.push("===================");
            if (course.video) {
              context.push(
                `🎥 Introduction video is available for this course`
              );
              context.push(`Video URL: ${course.video}`);
              if (course.thumbnail) {
                context.push(`Thumbnail: ${course.thumbnail}`);
              }
            } else {
              context.push(
                "No introduction video is currently available for this course."
              );
            }

            context.push(""); // Add spacing

            // Add course materials information
            context.push("COURSE MATERIALS:");
            context.push("==================");
            try {
              const materials = await getCourseMaterials(courseId);
              if (materials && materials.length > 0) {
                const materialsList = materials
                  .map((m) => `• ${m.name} (${m.type})`)
                  .join("\n");
                context.push(`Available Materials:\n${materialsList}`);
              } else {
                context.push(
                  "No additional materials are currently available for this course."
                );
              }
            } catch {
              context.push(
                "Course materials information is currently unavailable."
              );
            }

            context.push(""); // Add spacing

            // Add subactivity videos information (fallback mode)
            context.push("COURSE VIDEOS AND ACTIVITIES:");
            context.push("=============================");
            try {
              const { getMySingleCourseContent } = await import(
                "@/actions/student/mycourse"
              );
              const { auth } = await import("@/lib/auth");

              const session = await auth();
              if (session?.user?.id) {
                const courseContent = await getMySingleCourseContent(
                  session.user.id,
                  courseId
                );

                if (
                  courseContent?.activity &&
                  courseContent.activity.length > 0
                ) {
                  courseContent.activity.forEach(
                    (activity: any, activityIndex: number) => {
                      const activityTitle =
                        activity.titleEn ||
                        activity.titleAm ||
                        `Activity ${activityIndex + 1}`;
                      context.push(`📚 ${activityTitle}`);

                      if (
                        activity.subActivity &&
                        activity.subActivity.length > 0
                      ) {
                        activity.subActivity.forEach(
                          (subActivity: any, subIndex: number) => {
                            const subTitle =
                              subActivity.titleEn ||
                              subActivity.titleAm ||
                              `Sub-activity ${subIndex + 1}`;
                            const videoInfo = subActivity.video
                              ? ` (Video available)`
                              : ` (No video)`;
                            const freeStatus = subActivity.isFree
                              ? ` - FREE`
                              : ``;

                            context.push(
                              `  ${
                                subIndex + 1
                              }. ${subTitle}${videoInfo}${freeStatus}`
                            );
                          }
                        );
                      } else {
                        context.push(`  No sub-activities available`);
                      }

                      context.push(""); // Add spacing between activities
                    }
                  );
                } else {
                  context.push(
                    "No activities or videos are currently available for this course."
                  );
                }
              } else {
                context.push(
                  "Unable to access course content - user not authenticated."
                );
              }
            } catch {
              context.push(
                "Course video and activity information is currently unavailable."
              );
            }

            context.push(""); // Add spacing
            context.push("INSTRUCTIONS:");
            context.push("=============");
            context.push(
              "You are Darulkubra AI, a helpful course assistant. Your role is to help students overcome challenges and difficulties they encounter while taking this course. (Note: This is a fallback response when PDF processing encountered issues)"
            );
            context.push("");
            context.push("HELPING APPROACH:");
            context.push(
              "- Focus on assisting with learning challenges, concepts they find difficult, or problems they're facing"
            );
            context.push(
              "- Use the course materials, videos, and activities provided above to guide students"
            );
            context.push(
              "- Suggest specific videos or activities that can help with their current challenge"
            );
            context.push(
              "- Provide step-by-step guidance when explaining difficult concepts"
            );
            context.push(
              "- Recommend the most relevant introduction video or activity videos for their specific question"
            );
            context.push("");
            context.push("RESPONSE GUIDELINES:");
            context.push(
              "- Be encouraging and supportive when students mention difficulties"
            );
            context.push(
              "- Reference specific course content (videos, activities, materials) in your answers"
            );
            context.push(
              "- If the question cannot be answered using this information, politely explain what information you have access to and suggest contacting the instructor for more specific details"
            );
            context.push("- Always maintain a helpful, educational tone");

            const fallbackAnswer = await askLLM(question, context, aiProvider);
            console.log("✅ Fallback answer received using course context");

            return {
              success: true,
              answer: fallbackAnswer,
              aiProvider,
            };
          } catch (fallbackError) {
            console.error("❌ Fallback also failed:", fallbackError);
            // Provide helpful error message
            const errorMsg =
              aiError.errorType === "AUTH_ERROR"
                ? "Hey! Darulkubra AI here. There's a setup issue - your instructor needs to configure the AI service. Let them know! 🔧"
                : aiError.errorType === "NETWORK_ERROR"
                ? "Hi! Darulkubra AI here. Having trouble connecting. Check your internet and try again! 📡"
                : `Hey! Darulkubra AI here. I encountered an issue: ${
                    aiError.message || "Unknown error"
                  }. Please try again or contact your instructor.`;

            return {
              success: true,
              answer: errorMsg,
              aiProvider,
            };
          }
        }

        // Re-throw if we couldn't handle it
        throw aiError;
      }
    } catch (fileError) {
      console.error("❌ Error reading PDF file:", fileError);
      const errorMessage =
        fileError instanceof Error ? fileError.message : String(fileError);

      // If file doesn't exist, try with course context
      if (
        errorMessage.includes("ENOENT") ||
        errorMessage.includes("not found")
      ) {
        console.log("⚠️ PDF file not found, using course context instead...");
        try {
          const { askLLM } = await import("@/lib/ask");
          const { getCourseMaterials } = await import(
            "@/lib/action/courseMaterials"
          );

          const context: string[] = [];
          if (course?.titleEn) context.push(`Course Title: ${course.titleEn}`);
          if (course?.aboutEn)
            context.push(`Course Description: ${course.aboutEn}`);

          try {
            const materials = await getCourseMaterials(courseId);
            if (materials && materials.length > 0) {
              const materialsList = materials
                .map((m) => `- ${m.name}`)
                .join("\n");
              context.push(`Course Materials: ${materialsList}`);
            }
          } catch {}

          const fallbackAnswer = await askLLM(question, context, aiProvider);
          return {
            success: true,
            answer: fallbackAnswer,
            aiProvider,
          };
        } catch (fallbackError) {
          console.error("❌ Fallback failed:", fallbackError);
        }
      }

      // Return default response when PDF file cannot be read
      const defaultResponse = `Hey! Darulkubra AI here. Oops! I can't find the document right now. 📚

It looks like the document might not be uploaded yet. Here's what to do:
• Let your instructor know - they can upload it
• Try again in a bit
• If you need help right away, contact your instructor

Once the document is ready, I'll be able to help you with your questions!`;

      return {
        success: true,
        answer: defaultResponse,
        aiProvider,
      };
    }
  } catch (error) {
    console.error("❌ Error asking course question:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Return a helpful default response instead of an error
    const defaultResponse = `Hey! Darulkubra AI here. Hmm, something went wrong while I was trying to answer your question. 🤔

Don't worry though! Try these:
• Ask your question in a different way
• Make sure you're connected to the internet
• If it keeps happening, let your instructor know
• Check if documents are set up

I'll be ready to help once things are working again!`;

    return {
      success: true,
      answer: defaultResponse,
      aiProvider: aiProvider,
    };
  }
}

export async function askQuestion(question: string, aiProvider?: AIProvider) {
  try {
    // Read all files from data folder and process them
    const dataFolder = join(process.cwd(), "data");
    const files = await readdir(dataFolder);

    if (files.length === 0) {
      return {
        success: false,
        error: "No files uploaded yet. Please upload a file first.",
      };
    }

    // Process all files and get their content
    let allContent = "";
    let detectedAiProvider: AIProvider = "gemini"; // default
    const pdfFiles: PDFFile[] = [];
    let contentHash = "";

    for (const file of files) {
      const filePath = join(dataFolder, file);

      // Handle PDF files (stored as JSON with base64 data)
      if (file.endsWith(".pdf.json")) {
        const pdfData = JSON.parse(await readFile(filePath, "utf-8"));
        pdfFiles.push(pdfData);
        detectedAiProvider = pdfData.aiProvider || "gemini";
        contentHash += pdfData.base64Data.substring(0, 100); // Use first 100 chars for hash
      }
      // Handle text files
      else {
        const content = await readFile(filePath, "utf-8");

        // Extract AI provider from metadata if present
        if (content.startsWith("AI_PROVIDER:")) {
          const lines = content.split("\n");
          const providerLine = lines[0];
          const provider = providerLine
            .replace("AI_PROVIDER:", "")
            .trim() as AIProvider;
          if (provider === "gemini" || provider === "openai") {
            detectedAiProvider = provider;
          }
          // Remove metadata line from content
          allContent += lines.slice(2).join("\n") + "\n\n";
        } else {
          allContent += content + "\n\n";
        }
        contentHash += content.substring(0, 100); // Use first 100 chars for hash
      }
    }

    // Use provided AI provider or detected one
    const finalAiProvider = aiProvider || detectedAiProvider;

    // Generate content hash for caching
    const fullContentHash = createHash("md5").update(contentHash).digest("hex");

    // Check cache for AI response first
    const cachedResponse = await getCachedResponse(
      question,
      fullContentHash,
      finalAiProvider
    );
    if (cachedResponse) {
      console.log(
        "Using cached response for question:",
        question.substring(0, 50) + "..."
      );
      return {
        success: true,
        answer: cachedResponse,
        aiProvider: finalAiProvider,
      };
    }

    // If we have PDF files, process them directly with the selected AI provider
    if (pdfFiles.length > 0) {
      const answer = await askLLMWithPDFs(question, pdfFiles, finalAiProvider);

      // Cache the response
      await setCachedResponse(
        question,
        fullContentHash,
        finalAiProvider,
        answer
      );

      return { success: true, answer, aiProvider: finalAiProvider };
    }

    // For text files or OpenAI, use the traditional embedding approach with caching
    if (allContent.trim()) {
      // Check cache for embeddings
      const cachedEmbeddings = await getCachedEmbeddings(allContent);
      let embeddings: number[][];

      if (cachedEmbeddings) {
        console.log("Using cached embeddings for content");
        embeddings = cachedEmbeddings;
      } else {
        console.log("Generating new embeddings for content");
        // Create embeddings for the content
        const chunks = chunkText(allContent);
        embeddings = await embedChunks(chunks);

        // Cache the embeddings
        await setCachedEmbeddings(allContent, embeddings);
      }

      await saveChunks(chunkText(allContent), embeddings);

      // Now answer the question
      const queryEmbedding = await embedQuery(question);
      const contextChunks = await queryRelevantChunks(queryEmbedding);
      const answer = await askLLM(
        question,
        contextChunks.filter(Boolean) as string[],
        finalAiProvider
      );

      // Cache the response
      await setCachedResponse(
        question,
        fullContentHash,
        finalAiProvider,
        answer
      );

      return { success: true, answer, aiProvider: finalAiProvider };
    }

    return {
      success: false,
      error: "No readable content found in uploaded files.",
    };
  } catch (error) {
    console.error("Error asking question:", error);
    return { success: false, error: "Failed to process question" };
  }
}

export async function uploadFile(formData: FormData) {
  try {
    console.log("📤 uploadFile called");
    const file = formData.get("file") as File;
    const aiProvider = (formData.get("aiProvider") as AIProvider) || "gemini";
    const courseId = formData.get("courseId") as string | null;

    console.log("📋 Upload params:", {
      hasFile: !!file,
      fileName: file?.name,
      fileType: file?.type,
      fileSize: file?.size,
      aiProvider,
      courseId,
    });

    if (!file) {
      console.error("❌ No file provided");
      return { success: false, error: "No file provided" };
    }

    if (!courseId) {
      console.error("❌ No courseId provided");
      return { success: false, error: "Course ID is required" };
    }

    let text: string;
    let fileName: string;

    // Handle PDF files - convert to base64 for both Gemini and OpenAI
    if (file.type === "application/pdf") {
      console.log("📄 Processing PDF file...");

      // Validate file size (15MB limit for AI processing)
      if (file.size > 15 * 1024 * 1024) {
        console.error("❌ File too large:", file.size);
        return {
          success: false,
          error: "File size must be less than 15MB for optimal AI processing",
        };
      }

      console.log("🔄 Converting PDF to base64...");
      // For both Gemini and OpenAI, we'll store the PDF as base64
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString("base64");

      console.log(`✅ Base64 conversion complete (${base64.length} chars)`);

      // If courseId is provided, save file and store filename in database
      console.log(
        "💾 Saving file and storing filename in database for course:",
        courseId
      );

      // Save the actual PDF file to filesystem
      const { mkdir } = await import("fs/promises");
      const uploadsDir = join(process.cwd(), "docs", "ai-pdfs");

      try {
        await mkdir(uploadsDir, { recursive: true });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // Directory might already exist
      }

      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const uniqueFilename = `${timestamp}-${sanitizedName}`;
      const filePath = join(uploadsDir, uniqueFilename);

      // Write PDF file to disk
      await writeFile(filePath, buffer);
      console.log(`📁 PDF file saved to: ${filePath}`);

      const prisma = (await import("@/lib/db")).default;
      const { revalidatePath } = await import("next/cache");

      // Store only the filename in database
      await prisma.course.update({
        where: { id: courseId },
        data: {
          pdfData: uniqueFilename,
          aiProvider: aiProvider,
        },
      });

      console.log(
        `✅ AI PDF filename stored in database for course ${courseId} with ${aiProvider} provider`
      );

      // Revalidate the course registration page
      revalidatePath(`/[lang]/@manager/course/registration/${courseId}`);
      revalidatePath("/[lang]/@manager/course/registration");

      return {
        success: true,
        pdfData: uniqueFilename,
        fileName: uniqueFilename,
        message: `AI PDF uploaded successfully! Using ${
          aiProvider === "openai" ? "OpenAI" : "Gemini"
        } AI.`,
      };
    }
    // Handle text files
    else if (file.type === "text/plain") {
      text = await file.text();

      // Process the extracted text
      if (!text || text.trim().length === 0) {
        return {
          success: false,
          error: "The file appears to be empty or contains no readable text.",
        };
      }

      // Generate file hash for caching
      const fileHash = createHash("md5").update(text).digest("hex");

      // Check if we already have this content cached
      const cachedContent = await getCachedContent(fileHash);
      if (cachedContent) {
        console.log("Using cached content for file:", file.name);
        text = cachedContent;
      } else {
        // Cache the content
        await setCachedContent(fileHash, text);
      }

      // Save file to data folder with AI provider metadata
      const dataFolder = join(process.cwd(), "data");
      fileName = `${Date.now()}-${file.name.replace(
        /[^a-zA-Z0-9.-]/g,
        "_"
      )}.txt`;
      const filePath = join(dataFolder, fileName);

      // Add AI provider metadata to the content
      const contentWithMetadata = `AI_PROVIDER: ${aiProvider}\n\n${text}`;

      await writeFile(filePath, contentWithMetadata, "utf-8");

      return {
        success: true,
        message: `Text file saved successfully as ${fileName}. You can now ask questions about it using ${
          aiProvider === "gemini" ? "Gemini" : "OpenAI"
        } AI.`,
      };
    }
    // Unsupported file type
    else {
      console.error("❌ Unsupported file type:", file.type);
      return {
        success: false,
        error: `Unsupported file type: ${file.type}. Please upload a PDF (.pdf) or text (.txt) file.`,
      };
    }
  } catch (error) {
    console.error("❌ Error uploading file:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: `Failed to process file: ${errorMessage}`,
    };
  }
}
