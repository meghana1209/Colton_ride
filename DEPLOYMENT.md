# Colton Ride - Android Deployment Guide

## 1. Android Studio Setup
1. Download and install **Android Studio Jellyfish** or later.
2. Clone this repository (or copy the `android_template` folder).
3. In Android Studio, select **File > New > Import Project** and point to the `android_template` directory.
4. Ensure you have the **Kotlin** and **Compose** plugins installed.

## 2. Firebase Setup (Android)
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Create a new project or select your current one.
3. Add an **Android App**:
   - Register with package name `com.colton.ride`.
   - Download `google-services.json`.
   - Place `google-services.json` in the `app/` module directory.
4. Enable **Authentication** (Google Sign-In) and **Firestore**.

## 3. Google Maps API Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Enable **Maps SDK for Android** and **Directions API**.
3. Generate an API Key.
4. Add the key to `secrets.properties` or `AndroidManifest.xml`:
   ```xml
   <meta-data
       android:name="com.google.android.geo.API_KEY"
       android:value="YOUR_API_KEY"/>
   ```

## 4. APK Generation
1. In Android Studio, go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
2. For production, use **Build > Generate Signed Bundle / APK**.
3. Create a KeyStore (.jks file) and follow the signing process.

## 5. Play Store Deployment
1. Create a **Google Play Console** account.
2. Create a new App and upload your **AAB (Android App Bundle)**.
3. Complete the app listing (descriptions, screenshots, icons).
4. Set up the privacy policy and data safety forms.
5. Push to "Closed Testing" or "Production".

---

## Technical Stack
- **Architecture**: MVVM + Clean Architecture
- **Dependency Injection**: Hilt
- **Network**: Retrofit + OKHttp
- **UI**: Jetpack Compose (Material 3)
- **Database**: Room + Firestore
