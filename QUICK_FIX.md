# 🚨 CRITICAL FIXES REQUIRED

## 1. Fix AI Copilot & Chatbot (500 Error)
I have updated your configuration with the correct Gemini API key.
**YOU MUST RESTART THE BACKEND SERVER FOR THIS TO WORK.**

**How to restart:**
1. Click inside your backend terminal window.
2. Press `Ctrl + C` to stop the server.
3. Type `npm run dev` and press Enter.

## 2. Fix Google Login (403 Error)
Google is blocking your login because the **Origin URL** is missing.

**Steps to fix:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Click your Client ID: `636666241864-...`
3. Scroll to **Authorized JavaScript origins**
4. Click **ADD URI**
5. Type: `http://localhost:8081` (Make sure it is exactly this!)
6. Click **SAVE**

**After saving:**
1. Wait 1 minute.
2. Refresh your browser using `Ctrl + Shift + R`.
3. Try logging in again.

**Both features will work perfectly once these two steps are done!**
