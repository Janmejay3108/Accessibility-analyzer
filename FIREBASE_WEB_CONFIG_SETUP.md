# Firebase Web Configuration Setup

## 🚨 URGENT: Fix Authentication Error

Your sign-in is failing because the frontend Firebase configuration has placeholder values. Follow these steps to fix it:

## Step 1: Get Your Firebase Web App Configuration

1. **Open Firebase Console**: https://console.firebase.google.com
2. **Select your project**: `accessibility-analyzer-cc6c6`
3. **Click the gear icon** (⚙️) → **Project settings**
4. **Scroll down to "Your apps"** section
5. **Look for a web app** (🌐 icon) or **click "Add app"** → **Web** if none exists

### If you need to create a web app:
1. Click **"Add app"** → **Web** (🌐)
2. **App nickname**: `Accessibility Analyzer Web`
3. **Check "Also set up Firebase Hosting"** (optional)
4. Click **"Register app"**

### Get the configuration:
1. **Click on your web app** in the "Your apps" section
2. **Scroll down to "SDK setup and configuration"**
3. **Select "Config"** (not npm)
4. **Copy the firebaseConfig object**

It should look like this:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC-your-real-api-key-here",
  authDomain: "accessibility-analyzer-cc6c6.firebaseapp.com",
  projectId: "accessibility-analyzer-cc6c6",
  storageBucket: "accessibility-analyzer-cc6c6.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

## Step 2: Update Your Frontend .env File

Replace the placeholder values in `frontend/.env`:

```bash
# Replace these lines in frontend/.env:
REACT_APP_FIREBASE_API_KEY=YOUR_ACTUAL_API_KEY_HERE
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=YOUR_ACTUAL_SENDER_ID_HERE  
REACT_APP_FIREBASE_APP_ID=YOUR_ACTUAL_APP_ID_HERE
```

**With your actual values from the Firebase Console.**

## Step 3: Restart Your Development Server

After updating the .env file:

```bash
# Stop the frontend server (Ctrl+C)
# Then restart it:
cd frontend
npm start
```

## Step 4: Test Authentication

1. **Go to**: http://localhost:3000/auth
2. **Try signing in** - the error should be gone
3. **Test Google Sign-In** button

## Verification

✅ **Success indicators:**
- No "api-key-not-valid" error
- Sign-in form works
- Google Sign-In button works
- You can create an account

❌ **If still having issues:**
- Double-check the API key is correct
- Ensure no extra spaces in .env values
- Verify the project ID matches
- Check browser console for other errors

## Security Note

🔒 **The API key in frontend/.env is safe to commit** - it's a public identifier, not a secret. The real security is handled by Firebase's authentication rules and your backend service account key.

## Next Steps After Fix

Once authentication works:
1. ✅ Test user registration
2. ✅ Test Google OAuth
3. ✅ Test sign-out
4. ✅ Test protected routes (Dashboard)
5. ✅ Verify user data is saved to Firestore
