const API_URL = import.meta.env.VITE_API_URL;

export async function apiGet(path) {
  const url = `${API_URL}${path}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

