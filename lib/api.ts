import axios from "axios";

export const api = axios.create({
  baseURL:
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    "https://9lcex5k-matteo92-8081.exp.direct", // Fallback to a default value
  timeout: 10000, // 10 seconds timeout
});
