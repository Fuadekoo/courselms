# Professional Language Update

## Overview
Updated all AI prompts to use more professional language by removing phrases like "course material", "course content", and "course document" from responses.

---

## Changes Made

### 1. Removed Unprofessional Phrases

**Removed:**
- "course material"
- "course content"
- "course document"
- "course PDF document"
- "course materials"

**Replaced with:**
- "the document"
- "the provided content"
- "the PDF"
- "documents"

### 2. Updated System Instructions

#### `askLLM` Function:
- Changed: "based on the provided course content" → "based on the provided document"
- Changed: "Only use information from the provided content" → "Use information from the provided content to answer questions professionally"

#### `askLLMWithPDFs` Function:
- Changed: "course PDF document" → "PDF document"
- Changed: "course document" → "document"
- Changed: "course content" → "document content"
- Changed: "course material" → "document"
- Added instruction: "Avoid using phrases like 'course material', 'course content', or 'course document' - refer to it simply as 'the document' or 'the provided content'"

### 3. Updated User Prompts

All prompts now:
- Use "the document" instead of "the course document"
- Use "the provided content" instead of "course material"
- Include explicit instruction to avoid unprofessional phrases
- Maintain professional tone throughout

### 4. Updated Error Messages

**Before:**
- "I can't find the course materials"
- "course document might not be uploaded"
- "course materials are set up"

**After:**
- "I can't find the document"
- "document might not be uploaded"
- "documents are set up"

---

## Examples

### Before (Unprofessional):
> "Based on the course material, let me explain..."
> "The course content shows that..."
> "According to the course document..."

### After (Professional):
> "Based on the document, let me explain..."
> "The provided content shows that..."
> "According to the document..."

---

## Files Modified

1. **`lib/ask.ts`**:
   - `askLLM` function - System instructions for OpenAI and Gemini
   - `askLLMWithPDFs` function - System instructions and prompts for both providers
   - Error response messages

2. **`lib/actions.ts`**:
   - Default error responses when no PDF is set
   - Default error responses when PDF cannot be read
   - Main error handler default responses

---

## Benefits

1. **More Professional**: Responses sound more polished and professional
2. **Cleaner Language**: Avoids repetitive phrases like "course material"
3. **Better Flow**: Natural language without unnecessary qualifiers
4. **Consistent Tone**: Maintains professional tone throughout all responses

---

## Status

✅ **Complete** - All prompts updated to use professional language without "course material" phrases

