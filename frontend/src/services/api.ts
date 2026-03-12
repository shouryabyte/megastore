import axios, { AxiosError } from "axios";
import { useAuthStore } from "@/store/auth";

const rawBaseURL = import.meta.env.VITE_API_URL as string;
const normalizedBaseURL = String(rawBaseURL || "").replace(/\/+$/, "");
const apiBaseURL = normalizedBaseURL.endsWith("/api") ? normalizedBaseURL : `${normalizedBaseURL}/api`;

export const api = axios.create({
  baseURL: apiBaseURL,
  withCredentials: true,
  timeout: 25_000
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string> | null = null;

async function refreshToken() {
  const res = await api.post("/auth/refresh");
  const accessToken = (res.data?.accessToken as string) || null;
  const user = res.data?.user as any;
  if (!accessToken || !user) throw new Error("Refresh failed");
  useAuthStore.getState().setSession(user, accessToken);
  return accessToken;
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const original = error.config as any;
    if (status === 401 && !original?._retry) {
      original._retry = true;
      try {
        refreshing = refreshing ?? refreshToken();
        const token = await refreshing;
        refreshing = null;
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${token}`;
        return api.request(original);
      } catch {
        refreshing = null;
        useAuthStore.getState().clear();
      }
    }
    return Promise.reject(error);
  }
);
