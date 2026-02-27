/* Thin wrapper around fetch – talks to Django backend */
export async function api(url, body = {}) {
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error('API error: ' + resp.status);
  return resp.json();
}
