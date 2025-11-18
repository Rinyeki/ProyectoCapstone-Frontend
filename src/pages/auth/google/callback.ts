export async function GET({ request }: { request: Request }) {
  const url = new URL(request.url)
  const search = url.search || ''
  const backendUrl = `http://localhost:3000/auth/google/callback${search}`
  try {
    const res = await fetch(backendUrl, { headers: { Accept: 'application/json' } })
    const data = await res.json()
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Google Login</title></head><body>
<script>
  (function(){
    try {
      var data = ${JSON.stringify(data)};
      if (data && data.token) localStorage.setItem('token', data.token);
      if (data && data.requiresRut) localStorage.setItem('requiresRut', String(data.requiresRut));
      if (window.opener) {
        try { window.opener.postMessage({ type: 'auth', token: data.token, requiresRut: data.requiresRut }, window.location.origin); } catch(e) {}
        try { window.opener.location.href = '/'; } catch(e) {}
      }
    } catch (e) {}
    try { window.close(); } catch(e) { window.location.href = '/'; }
  })();
</script>
</body></html>`
    return new Response(html, { headers: { 'Content-Type': 'text/html' } })
  } catch (e) {
    const msg = `<!doctype html><html><head><meta charset="utf-8"><title>Error</title></head><body>
<div style="font-family:sans-serif;padding:20px;">Error al completar login con Google.</div>
</body></html>`
    return new Response(msg, { status: 500, headers: { 'Content-Type': 'text/html' } })
  }
}
