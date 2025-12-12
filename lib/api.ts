import axios from "axios";

export const api = axios.create({
    baseURL: process.env.BASE_URL || "http://192.168.1.8:8081", // Fallback to a default value
    timeout: 10000, // 10 seconds timeout
});

