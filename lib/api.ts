import axios from "axios";

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_BASE_URL,
  // Bumped from 10s -> 25s. A 10s timeout was too tight for a Neon
  // cold-start plus a multi-row insert, especially routed through a dev
  // tunnel (ngrok / exp.direct). If you're still hitting timeouts under
  // normal conditions, that's a stronger signal the tunnel itself is
  // unstable rather than the query being slow.
  timeout: 25000,
});

// Lightweight logging so timeout errors are unmistakable in the RN logs,
// instead of surfacing only as a generic "Network Error".
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ECONNABORTED") {
      console.error(
        `[api] Request to ${error?.config?.url} timed out after ${error?.config?.timeout}ms`,
      );
    } else if (!error.response) {
      console.error(
        `[api] No response received for ${error?.config?.url} (baseURL: ${error?.config?.baseURL})`,
      );
    }
    return Promise.reject(error);
  },
);
