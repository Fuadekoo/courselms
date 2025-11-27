/**
 * Simple script to check if FFmpeg is installed and accessible
 * Run with: npm run check:ffmpeg
 * or: node scripts/check-ffmpeg.cjs
 */

const { exec } = require("child_process");
const { promisify } = require("util");

const execAsync = promisify(exec);

async function checkFFmpeg() {
  console.log("🔍 Checking FFmpeg installation...\n");

  try {
    const { stdout, stderr } = await execAsync("ffmpeg -version");
    
    if (stdout) {
      const versionLine = stdout.split("\n")[0];
      console.log("✅ FFmpeg is installed!");
      console.log(`   ${versionLine}\n`);
      
      // Extract version number
      const versionMatch = versionLine.match(/version\s+([^\s]+)/i);
      if (versionMatch) {
        console.log(`   Version: ${versionMatch[1]}\n`);
      }
      
      console.log("✅ HLS conversion will work correctly.\n");
      return true;
    }
  } catch (error) {
    console.error("❌ FFmpeg is NOT installed or not in PATH!\n");
    console.error("   Error:", error.message.split("\n")[0], "\n");
    console.log("📦 Installation Instructions:\n");
    console.log("   Windows:");
    console.log("     choco install ffmpeg\n");
    console.log("   macOS:");
    console.log("     brew install ffmpeg\n");
    console.log("   Linux (Ubuntu/Debian):");
    console.log("     sudo apt update && sudo apt install ffmpeg\n");
    console.log("   Or download from: https://ffmpeg.org/download.html\n");
    return false;
  }
}

// Run the check
checkFFmpeg()
  .then((installed) => {
    process.exit(installed ? 0 : 1);
  })
  .catch((error) => {
    console.error("Error checking FFmpeg:", error);
    process.exit(1);
  });

