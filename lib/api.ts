import axios from 'axios';
import { getAuthToken } from './authStore';

export const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api', withCredentials: true });

api.interceptors.request.use(cfg => {
  let token = getAuthToken();
  if (!token) {
    try { token = localStorage.getItem('auth_token') || undefined; } catch {}
  }
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});
