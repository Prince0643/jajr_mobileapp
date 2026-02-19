---
description: How to deploy the Expo web app to Netlify
description: This workflow builds the Expo app as a static web site and deploys to Netlify
---

# Deploy Expo Web App Workflow

## Overview
This workflow builds the Expo React Native app as a static web application and deploys to Netlify.

## Prerequisites
- Node.js installed
- Netlify account (for deployment)
- Expo CLI (`npx expo`)

## Steps

1. **Install dependencies (if not already done)**
   ```bash
   npm install
   ```

2. **Build the web version**
   // turbo
   ```bash
   npx expo export --platform web
   ```
   This creates a `dist` folder with the static site.

3. **Test locally (optional)**
   ```bash
   npx serve dist
   ```
   Then open http://localhost:3000 to verify.

4. **Deploy to Netlify**
   Use the Windsurf deploy tool:
   - Framework: `create-react-app` (for Expo web builds)
   - Project path: The `dist` folder path
   - Or use Netlify CLI: `netlify deploy --prod --dir=dist`

## Environment Variables
Ensure these are set in your `.env` file or deployment environment:
- `EXPO_PUBLIC_API_URL` - Your API endpoint

## Troubleshooting

### Build fails
- Check that all dependencies are installed
- Verify `app.json` is configured correctly
- Run `npx expo doctor` to check for issues

### White screen after deploy
- Check browser console for errors
- Verify API URLs are using HTTPS in production
- Ensure `react-native-web` is properly configured

### Assets not loading
- Check that assets are in the `assets` folder
- Verify `assetBundlePatterns` in `app.json`

## Notes
- Expo web uses `react-native-web` for web compatibility
- Native-only features won't work in web (camera, sensors, etc.)
- Use Platform.OS checks for platform-specific code
