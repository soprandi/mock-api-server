import express from 'express';

export function buildRouterFromConfig(config) {
  const router = express.Router();
  const base = config.basePath || '';

  for (const r of config.routes) {
    const fullPath = `${base}${r.path}`;
    const handler = async (req, res) => {
      try {
        if (r.delay && r.delay > 0) {
          await new Promise((resolve) => setTimeout(resolve, r.delay));
        }
        return res.status(r.status || 200).json(r.response);
      } catch (e) {
        return res.status(500).json({ error: e.message || 'Mock handler error' });
      }
    };

    switch (r.method) {
      case 'GET':
        router.get(fullPath, handler);
        break;
      case 'POST':
        router.post(fullPath, handler);
        break;
      case 'PATCH':
        router.patch(fullPath, handler);
        break;
      case 'PUT':
        router.put(fullPath, handler);
        break;
      case 'DELETE':
        router.delete(fullPath, handler);
        break;
      default:
        // should be validated earlier
        break;
    }
  }

  return router;
}

export function listRegisteredRoutes(appOrRouter) {
  const stack = appOrRouter._router ? appOrRouter._router.stack : appOrRouter.stack;
  const routes = [];

  for (const layer of stack) {
    if (layer.route && layer.route.path) {
      const methods = Object.keys(layer.route.methods)
        .filter((m) => layer.route.methods[m])
        .map((m) => m.toUpperCase());
      routes.push({ path: layer.route.path, methods });
    } else if (layer.name === 'router' && layer.handle.stack) {
      for (const h of layer.handle.stack) {
        if (h.route && h.route.path) {
          const methods = Object.keys(h.route.methods)
            .filter((m) => h.route.methods[m])
            .map((m) => m.toUpperCase());
          routes.push({ path: h.route.path, methods });
        }
      }
    }
  }

  // Deduplicate
  const unique = [];
  const set = new Set();
  for (const r of routes) {
    const key = `${r.methods.join(',')} ${r.path}`;
    if (!set.has(key)) {
      set.add(key);
      unique.push(r);
    }
  }
  return unique;
}
