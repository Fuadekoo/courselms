# HLS Conversion Speed Optimization Guide

## 🚀 Speed Improvements Implemented

### 1. **Hardware Acceleration (5-10x Faster)**
The converter now automatically detects and uses hardware encoders:

- **NVIDIA NVENC** (Windows/Linux) - **5-10x faster** than software
  - Automatically detected if NVIDIA GPU is available
  - Uses `h264_nvenc` encoder with fast preset

- **Intel QuickSync** (Windows/Linux) - **3-5x faster** than software
  - Automatically detected if Intel CPU with integrated graphics
  - Uses `h264_qsv` encoder

- **Apple VideoToolbox** (macOS) - **3-5x faster** than software
  - Automatically detected on macOS
  - Uses `h264_videotoolbox` encoder

- **AMD AMF** (Windows/Linux) - **3-5x faster** than software
  - Automatically detected if AMD GPU is available
  - Uses `h264_amf` encoder

### 2. **Software Encoding Optimization (2-3x Faster)**
If hardware acceleration is not available, the converter uses:
- **`veryfast` preset** instead of default (medium)
- **`fastdecode` tune** for faster decoding
- **Auto-threading** (`-threads 0`) to use all CPU cores

### 3. **Automatic Detection**
The converter automatically:
- Detects available hardware encoders
- Falls back to optimized software encoding if no hardware is available
- Logs which encoder is being used

## 📊 Performance Comparison

| Method | Speed | Quality | Notes |
|--------|-------|---------|-------|
| **NVIDIA NVENC** | 5-10x faster | Excellent | Best option if available |
| **Intel QuickSync** | 3-5x faster | Very Good | Good for Intel systems |
| **Apple VideoToolbox** | 3-5x faster | Very Good | Best for macOS |
| **AMD AMF** | 3-5x faster | Very Good | Good for AMD systems |
| **Software (veryfast)** | 2-3x faster | Good | Fallback option |

## 🔧 Additional Speed Tips

### 1. **Parallel Processing**
You can convert multiple files simultaneously by:
- Using the "Convert All" button in the admin interface
- Running multiple conversion jobs at once (limited by system resources)

### 2. **Reduce Quality Levels (Faster)**
For even faster conversion, you can modify the converter to use fewer quality levels:
- Current: 3 levels (1080p, 360p, 144p)
- Faster: 2 levels (1080p, 360p) - reduces encoding time by ~33%

### 3. **Use SSD Storage**
- Store videos on SSD for faster read/write
- Reduces I/O bottlenecks during conversion

### 4. **System Requirements**
For best performance:
- **GPU**: NVIDIA/AMD/Intel with hardware encoding support
- **CPU**: Multi-core processor (4+ cores recommended)
- **RAM**: 8GB+ recommended
- **Storage**: SSD preferred

## 🎯 Expected Conversion Times

For a **10-minute 1080p video**:

| Method | Estimated Time |
|--------|----------------|
| NVIDIA NVENC | 2-4 minutes |
| Intel QuickSync | 3-5 minutes |
| Apple VideoToolbox | 3-5 minutes |
| AMD AMF | 3-5 minutes |
| Software (veryfast) | 8-12 minutes |
| Software (default) | 20-30 minutes |

*Times vary based on video complexity, system specs, and other factors*

## 🔍 How to Check Hardware Support

### Check FFmpeg Encoders:
```bash
ffmpeg -encoders | grep h264
```

Look for:
- `h264_nvenc` - NVIDIA
- `h264_qsv` - Intel
- `h264_videotoolbox` - Apple
- `h264_amf` - AMD

### Check GPU:
**Windows:**
```powershell
Get-WmiObject Win32_VideoController | Select-Object Name
```

**Linux:**
```bash
lspci | grep -i vga
```

**macOS:**
```bash
system_profiler SPDisplaysDataType
```

## ⚙️ Environment Variables

You can force specific settings:

```bash
# Force software encoding (disable hardware detection)
# Use this in production if hardware encoding fails
FFMPEG_FORCE_SOFTWARE=1

# Custom FFmpeg path
FFMPEG_PATH=/path/to/ffmpeg
```

## 🐛 Production Troubleshooting

### Hardware Encoding Fails in Production

If you see errors like:
```
⚠️ Hardware encoding (h264_nvenc) failed. Falling back to software encoding...
```

This typically happens when:
- FFmpeg was compiled with hardware encoder support, but the server doesn't have GPU access
- NVIDIA drivers are not installed or configured
- Running on a headless server without GPU

**Solution:** Set the environment variable to force software encoding:

```bash
# In your production environment (.env or system environment)
FFMPEG_FORCE_SOFTWARE=1
```

This will skip hardware detection entirely and use optimized software encoding.

### Browser Extension Error

If you see:
```
Uncaught (in promise) Error: Could not establish connection. Receiving end does not exist.
```

This is **not related to your code** - it's a browser extension trying to communicate with a content script. You can safely ignore this error, or suppress it in your browser console filters.

## 📝 Notes

- Hardware acceleration requires compatible GPU/driver
- Quality is maintained regardless of encoding method
- The converter automatically selects the fastest available method
- All methods produce the same HLS output format

