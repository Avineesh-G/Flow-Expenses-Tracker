## Setting Up Android Studio to Build the APK

### Prerequisites

Before you can build the Android APK, you need to install **Android Studio** on your PC. It is free.

1. Download it from: https://developer.android.com/studio
2. During installation, let it install the Android SDK automatically.
3. Once installed, open Android Studio once so it finishes setting up.

---

### Build Steps (run these commands after Android Studio is installed)

**Step 1: Initialize the Android project**
```bash
npx cap add android
```

**Step 2: Copy the plugin into the Android project**

After running `npx cap add android`, open the file:
`android/app/src/main/java/com/flow/expenses/MainActivity.java`

And add this line inside the `onCreate` method:
```java
registerPlugin(SmsReaderPlugin.class);
```

**Step 3: Sync the web build into Android**
```bash
npm run build
npx cap sync android
```

**Step 4: Open in Android Studio**
```bash
npx cap open android
```

**Step 5: Build the APK**
- In Android Studio: **Build** menu → **Build Bundle(s) / APK(s)** → **Build APK(s)**
- The APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

**Step 6: Share the APK**
- Upload the APK to Google Drive
- Share the download link with users
- Users need to enable "Install from unknown sources" in their phone settings

---

### For future updates
Run these commands whenever you make code changes:
```bash
npm run build
npx cap sync android
```
Then rebuild in Android Studio.
