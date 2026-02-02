# Running and Testing MyApp

This guide covers how to set up, run, and test your React Native mobile app using Android Studio's AVD.

## Prerequisites

### Required Software
- **Node.js** (v18 or higher) - Already installed (v24.13.0)
- **npm** (v9 or higher) - Already installed (v11.6.2)
- **Android Studio** - Latest version with Android SDK
- **Git** - For version control

### Verify Installation
```bash
node --version
npm --version
```

## Android Studio Setup

### 1. Install Android Studio
1. Download from [developer.android.com](https://developer.android.com/studio)
2. Run the installer and follow the setup wizard
3. Choose "Standard" installation for recommended settings

### 2. Configure Android SDK
1. Open Android Studio
2. Go to **Tools → SDK Manager**
3. Install the following components:
   - **Android SDK Platform-Tools**
   - **Android SDK Build-Tools** (latest version)
   - **Android 14 (API level 34)** or higher
   - **Android 13 (API level 33)**

### 3. Create Android Virtual Device (AVD)
1. In Android Studio, go to **Tools → Device Manager**
2. Click **+ Create Device**
3. Choose a device model (recommended: Pixel 6 or similar)
4. Select system image:
   - **Recommended**: Android 14 (API 34) with Google Play Services
   - **Alternative**: Android 13 (API 33) with Google Play Services
5. Click **Next** → **Finish**
6. Wait for the AVD to download and create

### 4. Start the AVD
1. In Device Manager, click the **Play** button next to your AVD
2. Wait for the emulator to fully boot (may take 1-2 minutes)

## Project Setup

### 1. Install Dependencies
```bash
# Navigate to project directory
cd c:\Users\jajrc\Downloads\mobileapp\myApp

# Install all dependencies
npm install --legacy-peer-deps
```

### 2. Environment Setup
Create a `.env` file in the project root:
```env
# Add your environment variables here
# EXPO_PUBLIC_API_URL=http://192.168.100.42/attendance_web/
```

## Running the App

### Option 1: Using Expo Go (Recommended for Development)
1. Install Expo Go app on your AVD:
   - Open Play Store in the emulator
   - Search for "Expo Go"
   - Install and open the app

2. Start the development server:
```bash
npm start
```

3. Connect to the app:
   - Scan the QR code with Expo Go (use camera app in emulator)
   - Or enter the tunnel URL manually in Expo Go

### Option 2: Direct Android Build
1. Start the development server:
```bash
npm run android
```

2. The app will automatically build and install on your running AVD

## Testing the App

### Manual Testing
1. **Navigation**: Test all screens and navigation flows
2. **Forms**: Test all form inputs and validations
3. **API Calls**: Test network requests and error handling
4. **Performance**: Monitor app performance and responsiveness
5. **Responsive Design**: Test on different screen orientations

### Using Android Studio Tools
1. **Logcat**: View app logs and debug messages
   - Go to **View → Tool Windows → Logcat**
   - Filter by your app package name

2. **Layout Inspector**: Inspect UI components
   - Go to **Tools → Layout Inspector**
   - Select your running app

3. **Network Inspector**: Monitor network requests
   - Go to **View → Tool Windows → Network Inspector**

### Automated Testing
1. **Run Jest Tests**:
```bash
npm test
```

2. **Run ESLint**:
```bash
npm run lint
```

## Common Issues and Solutions

### Issue: Metro bundler not starting
```bash
# Clear Metro cache
npx expo start --clear
```

### Issue: AVD is slow
1. Increase AVD RAM in Device Manager → Edit Device → Advanced Settings
2. Enable hardware acceleration in BIOS
3. Use x86 images instead of ARM

### Issue: App not connecting to Metro
1. Ensure your firewall allows Node.js connections
2. Try using tunnel mode: `npx expo start --tunnel`
3. Check that your AVD has internet connectivity

### Issue: Build failures
```bash
# Clean and rebuild
npx expo install --fix
npm run android -- --clear-cache
```

## Development Workflow

### 1. Daily Development
```bash
# Start development server
npm start

# In another terminal, run tests
npm test

# Check code quality
npm run lint
```

### 2. Before Committing
```bash
# Run all checks
npm run lint
npm test
npx tsc --noEmit
```

### 3. Building for Production
```bash
# Build for Android
npx expo build:android

# Build for iOS (requires macOS)
npx expo build:ios
```

## Performance Monitoring

The app includes a PerformanceMonitor component. To use it:

1. Import in your screen:
```tsx
import { PerformanceMonitor } from '@/components/PerformanceMonitor';
```

2. Add to your component:
```tsx
<PerformanceMonitor />
```

3. Monitor performance metrics in the console

## Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Android Studio User Guide](https://developer.android.com/studio/intro)

## Troubleshooting

If you encounter issues:

1. Check the terminal output for error messages
2. Look at Logcat in Android Studio for Android-specific errors
3. Restart the Metro bundler: `npm start -- --reset-cache`
4. Reinstall dependencies: `rm -rf node_modules && npm install --legacy-peer-deps`
5. Restart your AVD if experiencing performance issues

## Quick Start Commands

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm start

# Run on Android
npm run android

# Run tests
npm test

# Check code quality
npm run lint
```

Happy coding! 🚀

<!--  -->
<!-- ACTUAL RUN COMMAND -->
<!--  -->
npx expo start