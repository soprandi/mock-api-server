const BASE = '';
let shouldShowExamples = false; // show cURL examples only after user loads a config

function setCurlStatus(text) {
  const container = document.getElementById('curlExamples');
  if (container) container.textContent = text;
}

async function applyConfigObject(obj) {
  try { setCurlStatus('Applying configuration...'); } catch (_) {}
  const res = await fetch(`${BASE}/admin/load-config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config: obj })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  shouldShowExamples = true;
  await loadRoutes();
}

async function loadRoutes() {
  setCurlStatus(shouldShowExamples ? 'Refreshing cURL examples...' : 'Load a configuration (JSON or example) to see cURL examples.');
  const res = await fetch(`${BASE}/admin/routes`);
  const data = await res.json();
  if (shouldShowExamples) {
    renderCurlExamples(data.routes);
  }
}

function renderCurlExamples(routes) {
  const container = document.getElementById('curlExamples');
  if (!container) return;
  container.innerHTML = '';
  if (!routes || routes.length === 0) {
    container.textContent = 'No routes loaded.';
    return;
  }
  // Build blocks
  for (const r of routes) {
    const filteredMethods = (r.methods || []).filter((m) => {
      return !(
        (r.path === '/health' && m.toUpperCase() === 'GET') ||
        (r.path === '/admin/load-config' && m.toUpperCase() === 'POST')
      );
    });
    if (!filteredMethods.length) continue;

    for (const m of filteredMethods) {
      const block = document.createElement('div');
      block.className = 'curl-block';

      const title = document.createElement('div');
      title.className = 'curl-title';
      title.textContent = `# ${m} ${r.path}`;
      block.appendChild(title);

      const code = document.createElement('pre');
      code.className = 'curl-code';
      const cmd = buildCurlCommand(m, r.path);
      code.textContent = cmd;
      block.appendChild(code);

      const btn = document.createElement('button');
      btn.className = 'curl-copy';
      btn.title = 'Copy cURL to clipboard';
      btn.textContent = '📋';
      btn.addEventListener('click', async () => {
        const ok = await copyToClipboard(cmd);
        if (ok) {
          const old = btn.textContent;
          btn.textContent = '✅';
          setTimeout(() => (btn.textContent = old), 900);
        }
      });
      block.appendChild(btn);

      container.appendChild(block);
    }
  }
}

function buildCurlCommand(method, path) {
  const origin = window.location.origin;
  const url = `${origin}${path}`;
  const m = method.toUpperCase();
  if (m === 'GET' || m === 'DELETE') {
    return `curl -X ${m} "${url}" | jq 2>$null`;
  }
  const sample = m === 'POST' ? '{"example":"value"}' : '{"example":"updated"}';
  return [
    `curl -X ${m} "${url}" ^`,
    `  -H "Content-Type: application/json" ^`,
    `  -d "${sample.replace(/\"/g, '\\\"')}" | jq 2>$null`
  ].join('\n');
}

async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (_) {}
  // Fallback
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch (_) {
    return false;
  }
}

async function loadFromTextarea() {
  const txt = document.getElementById('configInput').value;
  try {
    const obj = JSON.parse(txt);
    await applyConfigObject(obj);
    alert('Configuration loaded!');
  } catch (e) {
    alert('Error: ' + e.message);
  }
}

async function loadExample() {
  try {
    const res = await fetch('/config/example.json');
    const ex = await res.json();
    document.getElementById('configInput').value = JSON.stringify(ex, null, 2);
    await applyConfigObject(ex);
  } catch (e) {
    alert('Unable to load example: ' + e.message);
  }
}

async function pingHealth() {
  const el = document.getElementById('healthStatus');
  el.textContent = '...';
  try {
    const res = await fetch(`${BASE}/health`);
    const data = await res.json();
    el.textContent = `OK (${data.time})`;
  } catch (e) {
    el.textContent = 'Error';
  }
}

function init() {
  document.getElementById('btnLoadFromTextarea').addEventListener('click', loadFromTextarea);
  document.getElementById('btnLoadExample').addEventListener('click', loadExample);
  document.getElementById('btnHealth').addEventListener('click', pingHealth);
  document.getElementById('serverUrl').textContent = window.location.origin;
  document.getElementById('serverUrl').href = window.location.origin;
  loadRoutes();
}

document.addEventListener('DOMContentLoaded', init);
