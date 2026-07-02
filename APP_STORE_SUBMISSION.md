# App Store / Play Store submission guide

Tier-1 (mechanical) prep is done in the repo. The steps below are the ones that
must run on your Mac with Xcode + Android Studio, because they generate and sign
native projects that can't be produced from the web tooling.

> **Tier-2 reminder:** a clean build does not guarantee approval. An app that
> hosts reviews of real, named, non-consenting people is in Apple Guideline 1.1 /
> 1.2's highest-scrutiny zone. Have the moderation + consent + removal story ready
> for App Review, and talk to counsel before submitting. This doc only covers the
> mechanical readiness.

---

## Already done in the repo

- **Bundle ID** `app.sipjuice`, **app name** `Juice`, **version** `1.0.0`
  (`capacitor.config.ts`, `package.json`). ⚠️ The bundle ID is permanent after
  first submission — change it now if you want something else.
- **Push presentation options** and iOS `contentInset` set in `capacitor.config.ts`.
- **Icon/splash source art** in `resources/` (`icon.png` 1024², `splash.png`
  2732², adaptive `icon-foreground/background.png`) + an `assets:generate` script.
- Web-side store requirements already satisfied: in-app **account deletion**
  (`delete-account` fn → Privacy Settings), **Privacy Policy / Terms / Support**
  routes, **report + block + moderation + dispute** flows.

---

## 1. Add native platforms (on your Mac)

```bash
npm install                 # picks up @capacitor/assets
npm run build
npx cap add ios
npx cap add android
npm run assets:generate     # writes icons + splash into both native projects
npx cap sync
```

## 2. iOS — Info.plist permission strings (REQUIRED — missing = auto-reject)

Open `ios/App/App/Info.plist` in Xcode and add:

```xml
<key>NSCameraUsageDescription</key>
<string>Juice uses your camera to take the one-time selfie that verifies you're a real person, and to add photos to a story.</string>
```

We capture from the camera only (no library picker), so `NSPhotoLibraryUsageDescription`
is not required. We do no ad/IDFA tracking, so `NSUserTrackingUsageDescription`
is not required.

## 3. iOS — Privacy manifest (Apple now requires this)

Create `ios/App/App/PrivacyInfo.xcprivacy`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>NSPrivacyTracking</key>
  <false/>
  <key>NSPrivacyTrackingDomains</key>
  <array/>
  <key>NSPrivacyCollectedDataTypes</key>
  <array>
    <dict>
      <key>NSPrivacyCollectedDataType</key>
      <string>NSPrivacyCollectedDataTypeEmailAddress</string>
      <key>NSPrivacyCollectedDataTypeLinked</key><true/>
      <key>NSPrivacyCollectedDataTypeTracking</key><false/>
      <key>NSPrivacyCollectedDataTypePurposes</key>
      <array><string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string></array>
    </dict>
    <dict>
      <key>NSPrivacyCollectedDataType</key>
      <string>NSPrivacyCollectedDataTypePhotosorVideos</string>
      <key>NSPrivacyCollectedDataTypeLinked</key><true/>
      <key>NSPrivacyCollectedDataTypeTracking</key><false/>
      <key>NSPrivacyCollectedDataTypePurposes</key>
      <array><string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string></array>
    </dict>
    <dict>
      <key>NSPrivacyCollectedDataType</key>
      <string>NSPrivacyCollectedDataTypeUserID</string>
      <key>NSPrivacyCollectedDataTypeLinked</key><true/>
      <key>NSPrivacyCollectedDataTypeTracking</key><false/>
      <key>NSPrivacyCollectedDataTypePurposes</key>
      <array><string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string></array>
    </dict>
  </array>
  <key>NSPrivacyAccessedAPITypes</key>
  <array>
    <dict>
      <key>NSPrivacyAccessedAPIType</key>
      <string>NSPrivacyAccessedAPICategoryUserDefaults</string>
      <key>NSPrivacyAccessedAPITypeReasons</key>
      <array><string>CA92.1</string></array>
    </dict>
  </array>
</dict>
</plist>
```

## 4. iOS — Push entitlement

In Xcode → Signing & Capabilities → **+ Capability → Push Notifications**.
Confirm `ios/App/App/App.entitlements` contains `aps-environment` = `development`
(Xcode flips it to `production` for the App Store build). Drop
`GoogleService-Info.plist` into `ios/App/App/` and re-run `npx cap sync`.

## 5. Android — permissions & versioning

`android/app/src/main/AndroidManifest.xml` (Capacitor adds INTERNET; add camera):

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-feature android:name="android.hardware.camera" android:required="false" />
```

We capture via the camera and upload the captured file, so no
`READ_MEDIA_IMAGES` is required. Set in `android/app/build.gradle`:

```gradle
applicationId "app.sipjuice"
versionCode 1
versionName "1.0.0"
targetSdkVersion 34   // or the current Play minimum
```

Put `google-services.json` in `android/app/` for FCM, then `npx cap sync`.

## 6. App Store Connect / Play Console metadata

- **Age rating:** 17+ (iOS) / Mature 17+ (Play) — the content is about dating and
  real people; do not under-rate or you'll be flagged.
- **App privacy "nutrition label":** declare Email, Photos, User ID, Coarse
  Location (if location is enabled), all "linked to identity," none used for
  tracking — matching the manifest above.
- **Sign-in demo account:** App Review needs a working, pre-verified test login
  (they cannot pass your human selfie verification). Provide credentials in the
  review notes, plus a note explaining the verification gate and the
  report/block/removal (`/dispute`) flows.
- **Support URL** → `https://sipjuice.app/support`; **Privacy Policy URL** →
  `https://sipjuice.app/privacy-policy`.

## 7. Pre-flight

```bash
npm run build && npx cap sync
npx cap open ios       # Product → Archive → Distribute
npx cap open android   # Build → Generate Signed Bundle (.aab)
```
