const API_URL = import.meta.env.VITE_API_URL;

export async function apiGet(path) {
  const url = `${API_URL}${path}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function apiPost(path, body) {
  const url = `${API_URL}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} - ${text}`);
  }

  return res.json();
}
