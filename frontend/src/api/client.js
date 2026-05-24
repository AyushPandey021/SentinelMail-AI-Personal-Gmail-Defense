import axios from "axios";
import { useAuthStore } from "../store/authStore.js";

export const api = axios.create({ baseURL: "/api", withCredentials: true });

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const refreshed = await useAuthStore.getState().refresh();
      if (refreshed) return api(error.config);
    }
    return Promise.reject(error);
  }
);
