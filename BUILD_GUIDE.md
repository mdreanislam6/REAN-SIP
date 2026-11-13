# REAN SIP — APK বানানোর গাইড

এই রিপোতে **REAN SIP** অ্যাপের সম্পূর্ণ সোর্স কোড আছে (Expo / React Native, প্যাকেজ আইডি
`com.reansip.app`)। APK বানানোর দুটি পথ আছে — একটিতে কিছুই ইনস্টল করতে হয় না, অন্যটিতে নিজের
কম্পিউটারে বিল্ড হয়।

---

## পথ ১ — GitHub Actions দিয়ে APK (সবচেয়ে সহজ, কিছু ইনস্টল লাগে না)

রিপোতে `.github/workflows/android-apk.yml` আছে। `main` ব্রাঞ্চে পুশ করলেই GitHub-এর নিজের
সার্ভারে (Ubuntu) Java 17, Android SDK ও Gradle সেটআপ হয়ে APK বিল্ড হয় এবং GitHub Release-এ
যুক্ত হয়। **Expo অ্যাকাউন্ট, `EXPO_TOKEN` বা কোনো সিক্রেট লাগে না।**

1. `main`-এ পুশ করুন, অথবা GitHub-এ **Actions** ট্যাব → *Build Android APK* → **Run workflow**।
2. বিল্ড শেষ হওয়া পর্যন্ত অপেক্ষা করুন (প্রথমবার ১৫–২৫ মিনিট, পরেরবার কম)।
3. **Releases** পেজে যান — সর্বশেষ রিলিজে `rean-sip.apk` যুক্ত থাকবে। ওয়ার্কফ্লো রানের
   **Artifacts** অংশেও একই ফাইল থাকবে।

তারপর APK ফোনে ডাউনলোড করে ইনস্টল করুন (ব্রাউজার/ফাইল ম্যানেজারকে "install unknown apps"
অনুমতি দিতে হবে)।

> বিল্ড ব্যর্থ হলে Actions → ওই রান → লগ দেখুন। সবচেয়ে সাধারণ কারণ: `npm install` ব্যর্থ হওয়া
> (নেটওয়ার্ক) বা Gradle ডিপেন্ডেন্সি ডাউনলোড টাইমআউট — আবার রান করলেই সাধারণত ঠিক হয়ে যায়।

---

## পথ ২ — নিজের কম্পিউটারে APK

### ক) Expo (EAS) দিয়ে — Android SDK লাগে না

Node.js 20+ লাগবে (https://nodejs.org)।

```bash
npm install
npm run assets
npm install -g eas-cli
eas login          # ফ্রি অ্যাকাউন্ট: https://expo.dev/signup
eas init           # প্রজেক্ট আপনার অ্যাকাউন্টে যুক্ত করুন — Yes দিন
eas build --platform android --profile preview
```

- নতুন Android keystore বানাতে চাইলে **Yes** দিন। Expo এটি সংরক্ষণ করে, তাই পরের বিল্ডগুলো একই
  কী দিয়ে সাইন হয় এবং আপডেট হিসেবে ইনস্টল হয়।
- `eas.json`-এ `preview` প্রোফাইলটি ইতিমধ্যেই **APK** হিসেবে সেট করা আছে (AAB নয়)।
- ফ্রি প্ল্যানে মাসে সীমিত সংখ্যক বিল্ড থাকে (https://expo.dev/pricing)।

### খ) সম্পূর্ণ লোকাল বিল্ড — Android Studio / Android SDK লাগবে

```bash
npm install
npm run assets
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
```

APK তৈরি হবে: `android/app/build/outputs/apk/release/app-release.apk`

---

## iPhone ও Play Store (ঐচ্ছিক)

- **iPhone:** Apple Developer Program সদস্যপদ লাগে (বছরে ৯৯ ডলার)। তারপর
  `eas build --platform ios --profile production` ও `eas submit --platform ios` চালিয়ে
  TestFlight দিয়ে ইনস্টল করুন। বিস্তারিত: https://docs.expo.dev/submit/ios/
- **Google Play:** ডেভেলপার অ্যাকাউন্ট লাগে (একবার ২৫ ডলার)। তারপর
  `eas build --platform android --profile production` ও `eas submit --platform android`।
  বিস্তারিত: https://docs.expo.dev/submit/android/

---

## অ্যাপে যা সেট করতে হবে

অ্যাপ খুলে **Settings → SIP accounts → Add SIP account**-এ আপনার SIP প্রোভাইডারের তথ্য দিন:

| ফিল্ড | উদাহরণ | নোট |
| --- | --- | --- |
| Account name | `Office` | শুধু আপনার জন্য একটি নাম |
| Display name | `Rean` | অন্য পাশে যে নাম দেখাবে |
| Username | `1001` | SIP এক্সটেনশন |
| Password | `••••••` | SIP পাসওয়ার্ড |
| SIP domain | `sip.example.com` | প্রোভাইডারের SIP ডোমেইন |
| WebSocket server | `wss://sip.example.com:7443/ws` | WebSocket এন্ডপয়েন্ট (UDP নয়) |
| Registration expiry | `300` | ডিফল্ট ঠিক আছে |

সংযোগ না হলে অ্যাপের **Diagnostics** স্ক্রিনে SIP trace দেখুন — সার্ভার কী কোডে রিজেক্ট করছে
সেটি সেখানে লেখা থাকে (৪০১ = পাসওয়ার্ড ভুল, ৪০৩ = অনুমতি নেই, ৪০৪ = ভুল ডোমেইন/পাথ)।

---

## অ্যাপে কী কী আছে

- একাধিক SIP অ্যাকাউন্ট সেভ, এক ট্যাপে অ্যাকাউন্ট বদল, চালু/বন্ধ
- SIP over WebSocket (WSS/WS) রেজিস্ট্রেশন, digest authentication, অটো রি-রেজিস্টার ও
  নেটওয়ার্ক ফিরলে অটো রিকানেক্ট
- ডায়ালার (কীপ্যাড, কন্টাক্ট ম্যাচিং, ব্যাকস্পেস), ইনকামিং/আউটগোয়িং কল স্ক্রিন
- কল চলাকালীন মিউট, DTMF কীপ্যাড, স্পিকার, লাইভ টাইমার
- রিংটোন ও ভাইব্রেশন (সেটিংস থেকে বন্ধ করা যায়)
- কল লগ (All / Missed ফিল্টার, এক ট্যাপে কলব্যাক), কন্টাক্ট (ফেভারিট, ব্লক)
- কোডেক পছন্দ (PCMU, PCMA, G.722, Opus), SIP trace সহ Diagnostics
- সব ডেটা শুধু ফোনে থাকে — কোনো সার্ভার, অ্যানালিটিক্স বা ট্র্যাকিং নেই

## সীমাবদ্ধতা

- অ্যাপ চালু থাকলে ইনকামিং কল রিং হয়। অ্যাপ বন্ধ থাকলে রিং করাতে push (VoIP push বা
  push-gateway) দরকার — এই বিল্ডে সেটি নেই।
- অডিও WebRTC দিয়ে যায়, তাই SIP সার্ভারে WebSocket ট্রান্সপোর্ট চালু থাকতে হবে।
- কল রেকর্ডিং এখনো নেই।

## কী যাচাই করা হয়েছে, কী হয়নি

যাচাই করা হয়েছে: কোড টাইপচেক পাস করে (`npm run typecheck`) এবং Android-এর JavaScript বান্ডল
কম্পাইল হয়। যাচাই করা হয়নি: আসল ফোনে চালানো ও আসল SIP সার্ভারে কল — ইনস্টল করার পর নিজে
পরীক্ষা করুন, সমস্যা হলে স্ক্রিনশটসহ জানান।
