import fs from 'fs/promises';

export async function loadConfigFromPath(configPath) {
  const raw = await fs.readFile(configPath, 'utf-8');
  const obj = JSON.parse(raw);
  return validateAndNormalizeConfig(obj);
}

export async function loadConfigFromObject(obj) {
  return validateAndNormalizeConfig(obj);
}

function validateAndNormalizeConfig(obj) {
  if (!obj || typeof obj !== 'object') {
    throw new Error('Config must be a JSON object');
  }
  const base = obj.basePath || '';
  const routes = Array.isArray(obj.routes) ? obj.routes : [];
  // Normalize
  const normRoutes = routes.map((r, idx) => {
    const method = String(r.method || 'GET').toUpperCase();
    const path = String(r.path || '/');
    const status = Number(r.status || 200);
    const delay = Number(r.delay || 0);
    const response = r.response ?? {};
    if (!['GET', 'POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      throw new Error(`routes[${idx}]: unsupported method ${method}`);
    }
    return { method, path: withLeadingSlash(path), status, response, delay };
  });

  return { basePath: withLeadingSlash(base, true), routes: normRoutes };
}

function withLeadingSlash(p, allowEmpty = false) {
  if (!p && allowEmpty) return '';
  if (!p) return '/';
  return p.startsWith('/') ? p : `/${p}`;
}
