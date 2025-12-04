import "dotenv/config";
export default {
  expo: {
    name: "naivoo",
    slug: "naivoo",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "naivoo",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    runtimeVersion: { policy: "sdkVersion" },
    updates: {
      fallbackToCacheTimeout: 0,
      url: `https://u.expo.dev/${process.env.EXPO_PUBLIC_EAS_PROJECT_ID}`,
      assetBundlePatterns: ["**/*"],
    },
    ios: {
      supportsTablet: true,
      config: {
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_IOS_API_KEY,
      },
    },
    android: {
      package: "com.matteo92.naivoo",
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_API_KEY,
        },
      },
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    web: {
      bundler: "metro",
      output: "server",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      [
        "expo-router",
        {
          origin: "https://dummy-host-theta.vercel.app/",
        },
      ],
        [
            "expo-location",
            {
                "locationAlwaysAndWhenInUsePermission": "Allow $(PRODUCT_NAME) to use your location.",
                "isAndroidForegroundServiceEnabled": true,
            }
        ],
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000",
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      eas: {
        projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
      },
    },
  },
};
