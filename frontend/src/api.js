import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

// helper to unwrap envelope and throw on error codes if you want
export async function request(method, url, data) {
  const res = await api.request({ method, url, data });
  const env = res.data;
  // 如果你想自動把錯誤視作 exception，可以根據 code 判斷
  // 例如：if (env.code !== 'OK') throw new Error(env.message)
  return env;
}

export default api;