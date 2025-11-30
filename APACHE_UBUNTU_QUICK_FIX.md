# 🚀 Quick Fix for Ubuntu Apache Server

## Your Setup
- **Server:** Ubuntu
- **Web Server:** Apache (reverse proxy)
- **Application:** Node.js/Next.js running on port 3000
- **File:** `server.ts` loads `.env` automatically

---

## ✅ Solution: Add to `.env` File

This is the **easiest and recommended** method for your setup.

### Step-by-Step:

1. **SSH into your Ubuntu server:**
   ```bash
   ssh your-username@your-server-ip
   ```

2. **Go to your application directory:**
   ```bash
   cd /var/www/your-app
   # or wherever your app is located
   ```

3. **Edit the `.env` file:**
   ```bash
   sudo nano .env
   ```

4. **Add this line at the end of the file:**
   ```bash
   FFMPEG_FORCE_SOFTWARE=1
   ```

5. **Save and exit:**
   - Press `Ctrl+X`
   - Press `Y` to confirm
   - Press `Enter` to save

6. **Restart your Node.js application:**

   **If using PM2 (most common):**
   ```bash
   pm2 restart all
   # or
   pm2 restart your-app-name
   ```

   **If using systemd:**
   ```bash
   sudo systemctl restart your-app-name
   ```

   **If running manually:**
   - Stop the current process (Ctrl+C)
   - Restart: `node server.js` or `npm start`

---

## 🔍 Verify It's Working

1. **Check your application logs:**
   ```bash
   # If using PM2:
   pm2 logs
   
   # If using systemd:
   sudo journalctl -u your-app-name -f
   ```

2. **Upload a test video** through your application

3. **Look for this message in logs:**
   ```
   [HLS Conversion] Software encoding forced via FFMPEG_FORCE_SOFTWARE environment variable
   ```

4. **You should NOT see:**
   - ❌ Hardware encoding errors
   - ❌ "h264_nvenc failed" messages
   - ❌ "Falling back to software encoding" warnings

---

## 📋 Example `.env` File

Your `.env` file should look something like this:

```bash
# Database
DATABASE_URL="your-database-url"

# Other environment variables...
NODE_ENV=production

# FFmpeg - Force software encoding (fixes hardware encoding errors)
FFMPEG_FORCE_SOFTWARE=1
```

---

## 🐛 Troubleshooting

### If the variable isn't working:

1. **Check if `.env` file exists:**
   ```bash
   ls -la .env
   ```

2. **Verify the content:**
   ```bash
   cat .env | grep FFMPEG
   ```

3. **Check file permissions:**
   ```bash
   chmod 644 .env
   ```

4. **Make sure you restarted the app** after adding the variable

5. **Check if Node.js can read it:**
   ```bash
   node -e "require('dotenv').config(); console.log(process.env.FFMPEG_FORCE_SOFTWARE)"
   ```
   Should output: `1`

---

## 📝 Apache Configuration (Reference)

If you need to check your Apache reverse proxy setup, it typically looks like this:

```apache
<VirtualHost *:80>
    ServerName e-learning.darelkubra.com
    
    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
    
    # Optional: WebSocket support
    RewriteEngine on
    RewriteCond %{HTTP:Upgrade} websocket [NC]
    RewriteCond %{HTTP:Connection} upgrade [NC]
    RewriteRule ^/?(.*) ws://localhost:3000/$1 [P,L]
</VirtualHost>
```

**Note:** The environment variable goes in `.env` (Node.js), NOT in Apache config.

---

## ✅ Expected Result

After applying this fix:

- ✅ Videos convert successfully using software encoding
- ✅ No more hardware encoding errors
- ✅ Conversion works reliably on Ubuntu server
- ✅ Slightly slower than hardware, but stable and error-free

The conversion will still work perfectly - it just uses CPU-based encoding instead of trying (and failing) to use GPU encoding.

---

## 🆘 Still Having Issues?

If you're still seeing errors after following these steps:

1. **Check your application is actually reading `.env`:**
   - Look at `server.ts` line 9: `process.loadEnvFile(".env")`
   - Make sure `.env` is in the same directory as `server.ts`

2. **Verify the app restarted:**
   ```bash
   ps aux | grep node
   # Check the process start time
   ```

3. **Check logs for the exact error message** and share it for further troubleshooting

