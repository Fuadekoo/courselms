# ⚡ Quick Setup Checklist

## 🚀 5-Minute Setup for Video Protection

### Step 1: Generate Secret Key ✅

**Mac/Linux:**
```bash
openssl rand -hex 32
```

**Windows PowerShell:**
```powershell
[Convert]::ToBase64String([byte[]](1..32 | ForEach-Object {Get-Random -Maximum 256}))
```

**Copy the output!**

---

### Step 2: Add to .env File ✅

Open your `.env` file and add:

```bash
VIDEO_SECRET_KEY="paste-your-generated-key-here"
```

**Example:**
```bash
VIDEO_SECRET_KEY="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"
```

---

### Step 3: Verify Files ✅

Make sure these files exist (they should already):

- ✅ `lib/videoSecurity.ts`
- ✅ `pages/api/stream.ts`
- ✅ `app/api/video-token/route.ts`
- ✅ `components/stream/Player.tsx`
- ✅ `components/stream/VideoProtection.css`

---

### Step 4: Build & Test ✅

```bash
npm run build
npm run dev
```

Then test:
1. ✅ Open a video → Should play normally
2. ✅ Right-click → Should be blocked
3. ✅ Try IDM/FDM → Should get 404 error

---

### Step 5: Deploy 🚀

```bash
# Your deployment command
npm run build
# Deploy to production
```

---

## ✅ That's It!

Your videos are now protected!

### What Works:
- ✅ Normal video playback
- ✅ Custom controls
- ✅ Mobile support
- ✅ Token auto-refresh

### What's Blocked:
- ❌ IDM/FDM downloads
- ❌ Right-click save
- ❌ wget/curl downloads
- ❌ Direct URL access
- ❌ Network inspection downloads

---

## 🆘 Troubleshooting:

### Videos don't play?
- Check VIDEO_SECRET_KEY is set in .env
- Restart dev server
- Check browser console for errors

### Still can download?
- Clear browser cache
- Check user agent isn't in whitelist
- Verify token generation is working

### Build fails?
- Run `npm install`
- Check TypeScript errors
- Verify all files exist

---

## 📚 Full Documentation:

- `VIDEO_SECURITY_SETUP.md` - Detailed setup
- `ADVANCED_VIDEO_PROTECTION_COMPLETE.md` - Technical details
- `VIDEO_DOWNLOAD_PROTECTION.md` - All features

---

**Your videos are protected! 🔒✨**

