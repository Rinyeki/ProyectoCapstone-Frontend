export async function GET() {
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Google Login</title></head><body>
<script>
  (async function(){
    try {
      var search = window.location.search || '';
      var fetchUrl = '/auth/google/callback' + (search ? (search + '&exchange=1') : '?exchange=1');
      var res = await fetch(fetchUrl, { headers: { Accept: 'application/json' } });
      var data = await res.json();
      if (data && data.token) localStorage.setItem('token', data.token);
      if (data && data.requiresRut != null) localStorage.setItem('requiresRut', String(data.requiresRut));
      if (window.opener) {
        try {
          if (data && data.token) window.opener.localStorage.setItem('token', data.token);
          if (data && data.requiresRut != null) window.opener.localStorage.setItem('requiresRut', String(data.requiresRut));
        } catch(e) {}
        try { window.opener.postMessage({ type: 'auth', token: data && data.token, requiresRut: data && data.requiresRut }, '*'); } catch(e) {}
        try {
          var href = '/';
          if (data && data.requiresRut === true) href = '/?rut=1';
          window.opener.location.href = href;
        } catch(e) {}
      }
    } catch (e) {
      try { document.body.innerText = 'Error al completar login con Google.'; } catch (_) {}
    }
    try { window.close(); } catch(e) { window.location.href = '/'; }
  })();
</script>
</body></html>`
  return new Response(html, { headers: { 'Content-Type': 'text/html' } })
}
