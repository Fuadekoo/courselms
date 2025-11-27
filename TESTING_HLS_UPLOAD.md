# 🧪 Testing HLS Upload & Conversion in Development

This guide will help you test the video upload and Adaptive HLS conversion feature in your development environment.

## Prerequisites

### 1. Install FFmpeg

FFmpeg is required for HLS conversion. Install it based on your operating system:

#### Windows:
```powershell
# Using Chocolatey (recommended)
choco install ffmpeg

# Or download from: https://ffmpeg.org/download.html
# Extract and add to PATH
```

#### macOS:
```bash
# Using Homebrew (recommended)
brew install ffmpeg
```

#### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install ffmpeg
```

### 2. Verify FFmpeg Installation

Run this command in your terminal:
```bash
ffmpeg -version
```

You should see FFmpeg version information. If not, make sure FFmpeg is in your PATH.

## Testing Steps

### Option 1: Use the Test Page (Recommended)

1. **Start your development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

2. **Open the test page:**
   Navigate to: `http://localhost:3000/test-upload`

3. **Upload a video:**
   - Click "Choose File" and select an MP4 video file
   - Click "Upload & Convert to HLS"
   - Watch the upload progress
   - The page will automatically check conversion status

4. **Monitor conversion:**
   - Upload completes → Shows "HLS conversion queued"
   - Conversion runs in background
   - Status updates automatically (polls every 2 seconds)
   - When complete, shows "COMPLETED" status with manifest path

### Option 2: Test via API Directly

1. **Upload via API:**
   ```bash
   # Using curl (replace with your actual file path)
   curl -X POST http://localhost:3000/api/upload \
     -F "chunk=@/path/to/your/video.mp4" \
     -F "filename=test.mp4" \
     -F "chunkIndex=0" \
     -F "totalChunks=1"
   ```

2. **Check conversion status:**
   ```bash
   # Replace <jobId> with the jobId from upload response
   curl http://localhost:3000/api/hls-status?jobId=<jobId>
   ```

### Option 3: Test with Chunked Upload (Like Production)

For larger files, test chunked upload:

```javascript
// Example in browser console or a test script
const file = /* your file input */;
const CHUNK_SIZE = 512 * 1024; // 512KB
const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
const uuidName = `${Date.now()}-${Math.floor(Math.random() * 100000)}.mp4`;

for (let i = 0; i < totalChunks; i++) {
  const start = i * CHUNK_SIZE;
  const end = Math.min(file.size, start + CHUNK_SIZE);
  const chunk = file.slice(start, end);

  const formData = new FormData();
  formData.append("chunk", chunk);
  formData.append("filename", uuidName);
  formData.append("chunkIndex", i.toString());
  formData.append("totalChunks", totalChunks.toString());

  await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });
}
```

## What to Check

### 1. **Upload Success**
- ✅ File uploads successfully
- ✅ Response includes `jobId` and `converting: true`
- ✅ Original MP4 saved to `fuad/course/`

### 2. **HLS Conversion**
- ✅ Job status shows "processing" then "completed"
- ✅ HLS files created in `fuad/course/{baseName}/`
- ✅ Master playlist exists: `{baseName}.m3u8`
- ✅ Segment files created: `{baseName}_0_000.ts`, `{baseName}_1_000.ts`, etc.
- ✅ Original MP4 deleted after successful conversion

### 3. **File Structure**
After successful conversion, you should see:
```
fuad/course/
  └── {baseName}/
      ├── {baseName}.m3u8          (Master playlist)
      ├── {baseName}_0.m3u8        (1080p variant)
      ├── {baseName}_1.m3u8        (720p variant)
      ├── {baseName}_2.m3u8        (480p variant)
      ├── {baseName}_0_000.ts      (1080p segments)
      ├── {baseName}_0_001.ts
      ├── {baseName}_1_000.ts      (720p segments)
      ├── {baseName}_1_001.ts
      ├── {baseName}_2_000.ts      (480p segments)
      └── {baseName}_2_001.ts
```

### 4. **Job Status Tracking**
- ✅ Job files in `fuad/jobs/{jobId}.json`
- ✅ Status updates: `pending` → `processing` → `completed`/`failed`
- ✅ Error messages logged if conversion fails

## Troubleshooting

### FFmpeg Not Found
**Error:** `FFmpeg is not installed. Please install FFmpeg to enable HLS conversion.`

**Solution:**
1. Install FFmpeg (see Prerequisites)
2. Verify installation: `ffmpeg -version`
3. Restart your development server

### Conversion Fails
**Check:**
1. FFmpeg version (should be recent)
2. Video file format (MP4 recommended)
3. Server logs for FFmpeg errors
4. Disk space available
5. File permissions in `fuad/course/` directory

### Upload Works But No Conversion
**Check:**
1. File extension is `.mp4` (case-insensitive)
2. Server console for job queue logs
3. Job status API: `/api/hls-status?jobId={jobId}`

### Large Files Timeout
**Solution:**
- Increase timeout in `lib/hls-converter.ts` (currently 1 hour)
- Consider processing larger files in a separate worker process

## Testing Different Scenarios

### ✅ Small Video (< 10MB)
- Should convert quickly
- Good for initial testing

### ✅ Medium Video (10-100MB)
- Tests chunked upload
- Normal conversion time

### ✅ Large Video (> 100MB)
- Tests full upload pipeline
- Longer conversion time

### ✅ Non-MP4 Files
- Should upload but skip conversion
- Returns original filename

## API Endpoints

### Upload Endpoint
- **POST** `/api/upload`
- Accepts chunked file uploads
- Returns `jobId` for MP4 files

### Status Endpoint
- **GET** `/api/hls-status?jobId={jobId}`
- Returns conversion job status
- Status values: `pending`, `processing`, `completed`, `failed`

## Next Steps

After testing:
1. ✅ Upload works correctly
2. ✅ HLS conversion completes successfully
3. ✅ Files are accessible for streaming
4. ✅ Integration with video player works

You're ready to use this in production! 🎉

