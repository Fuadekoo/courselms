# 🐧 Ubuntu Apache Production Setup Guide

## Setting Environment Variables for FFmpeg Hardware Encoding Fix

Since your production server is Ubuntu with Apache, here are the ways to set the `FFMPEG_FORCE_SOFTWARE=1` environment variable:

---

## Method 1: Add to `.env` File (Recommended)

This is the easiest method since your `server.ts` already loads `.env`:

### Steps:

1. **SSH into your Ubuntu server:**
   ```bash
   ssh user@your-server-ip
   ```

2. **Navigate to your application directory:**
   ```bash
   cd /path/to/your/application
   # Example: cd /var/www/your-app
   ```

3. **Edit or create `.env` file:**
   ```bash
   nano .env
   # or
   vi .env
   ```

4. **Add this line:**
   ```bash
   FFMPEG_FORCE_SOFTWARE=1
   ```

5. **Save and exit:**
   - For nano: `Ctrl+X`, then `Y`, then `Enter`
   - For vi: `:wq` then `Enter`

6. **Restart your application:**
   ```bash
   # If using PM2:
   pm2 restart all
   
   # If using systemd:
   sudo systemctl restart your-app-name
   
   # If using npm/node directly:
   # Stop current process (Ctrl+C) and restart
   ```

---

## Method 2: Systemd Service File

If you're using systemd to run your Node.js application:

1. **Edit your service file:**
   ```bash
   sudo nano /etc/systemd/system/your-app.service
   ```

2. **Add the environment variable in the `[Service]` section:**
   ```ini
   [Unit]
   Description=Your Next.js App
   After=network.target

   [Service]
   Type=simple
   User=www-data
   WorkingDirectory=/path/to/your/application
   Environment="NODE_ENV=production"
   Environment="FFMPEG_FORCE_SOFTWARE=1"
   ExecStart=/usr/bin/node server.js
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```

3. **Reload systemd and restart:**
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl restart your-app
   ```

---

## Method 3: PM2 Ecosystem File

If you're using PM2:

1. **Create or edit `ecosystem.config.js` in your app directory:**
   ```bash
   nano ecosystem.config.js
   ```

2. **Add the environment variable:**
   ```javascript
   module.exports = {
     apps: [{
       name: 'your-app',
       script: 'server.js',
       env: {
         NODE_ENV: 'production',
         FFMPEG_FORCE_SOFTWARE: '1'
       }
     }]
   };
   ```

3. **Restart with PM2:**
   ```bash
   pm2 restart ecosystem.config.js
   # or
   pm2 restart all
   ```

---

## Method 4: Apache Environment Variables (If using mod_env)

If Apache is directly running your Node.js app (unlikely but possible):

1. **Edit Apache configuration:**
   ```bash
   sudo nano /etc/apache2/sites-available/your-site.conf
   ```

2. **Add in the VirtualHost section:**
   ```apache
   <VirtualHost *:80>
       ServerName your-domain.com
       
       # Environment variables
       SetEnv FFMPEG_FORCE_SOFTWARE 1
       
       # Your other Apache config...
   </VirtualHost>
   ```

3. **Restart Apache:**
   ```bash
   sudo systemctl restart apache2
   ```

---

## Method 5: Export in Shell Script (If using startup script)

If you have a startup script:

1. **Edit your startup script:**
   ```bash
   nano /path/to/startup.sh
   ```

2. **Add before starting the app:**
   ```bash
   #!/bin/bash
   export FFMPEG_FORCE_SOFTWARE=1
   export NODE_ENV=production
   
   # Then start your app
   node server.js
   ```

---

## ✅ Verification

After setting the environment variable and restarting:

1. **Check if it's loaded:**
   ```bash
   # SSH into server and check process environment
   ps aux | grep node
   # Or check logs
   tail -f /var/log/your-app.log
   ```

2. **Test video conversion:**
   - Upload a video through your application
   - Check the logs - you should see:
     ```
     [HLS Conversion] Software encoding forced via FFMPEG_FORCE_SOFTWARE environment variable
     ```
   - Instead of hardware encoding errors

3. **Check application logs:**
   ```bash
   # If using PM2:
   pm2 logs
   
   # If using systemd:
   sudo journalctl -u your-app -f
   ```

---

## 🔍 Troubleshooting

### If environment variable is not being read:

1. **Check if `.env` file exists and is readable:**
   ```bash
   ls -la .env
   cat .env
   ```

2. **Verify the file is in the correct location:**
   - Should be in the same directory as `server.ts`

3. **Check file permissions:**
   ```bash
   chmod 644 .env
   ```

4. **Verify Node.js can read it:**
   ```bash
   node -e "require('dotenv').config(); console.log(process.env.FFMPEG_FORCE_SOFTWARE)"
   ```

### If still getting hardware encoding errors:

1. **Check if the variable is actually set:**
   ```bash
   # In your Node.js app, add temporary logging:
   console.log('FFMPEG_FORCE_SOFTWARE:', process.env.FFMPEG_FORCE_SOFTWARE);
   ```

2. **Make sure you restarted the application** after adding the variable

3. **Check for typos** in the variable name (case-sensitive)

---

## 📝 Quick Reference

**Most Common Setup (PM2 or systemd with .env):**

```bash
# 1. Add to .env
echo "FFMPEG_FORCE_SOFTWARE=1" >> .env

# 2. Restart
pm2 restart all
# OR
sudo systemctl restart your-app
```

**Verify it's working:**
- Upload a video
- Check logs - should see "Software encoding forced" message
- No more hardware encoding errors

---

## 🎯 Expected Behavior After Fix

✅ **Before:** Hardware encoding tries and fails, then falls back to software  
✅ **After:** Software encoding is used directly (faster startup, no errors)

The conversion will still work perfectly, just using CPU-based encoding instead of trying (and failing) to use GPU encoding.

