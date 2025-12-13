import axios from "axios";

export const api = axios.create({
  baseURL:
    process.env.EXPO_PUBLIC_BASE_URL, // Fallback to a default value
  timeout: 10000, // 10 seconds timeout
});
