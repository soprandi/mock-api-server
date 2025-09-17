import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadConfigFromPath, loadConfigFromObject } from './lib/configLoader.js';
import { buildRouterFromConfig, listRegisteredRoutes } from './lib/routeFactory.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, '..', 'public')));
// Also serve the config folder to load the example from the UI
app.use('/config', express.static(path.join(__dirname, '..', 'config')));

let dynamicRouter = express.Router();
app.use(dynamicRouter);

function reloadRoutesFromConfig(config) {
  const newRouter = buildRouterFromConfig(config);
  // swap routers: remove old, add new
  app._router.stack = app._router.stack.filter(
    (layer) => !(layer && layer.handle === dynamicRouter)
  );
  dynamicRouter = newRouter;
  app.use(dynamicRouter);
}

// Admin endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/admin/routes', (req, res) => {
  res.json({ routes: listRegisteredRoutes(app) });
});

// Load config from disk path
app.post('/admin/load-config', async (req, res) => {
  try {
    const { path: configPath, config } = req.body || {};
    let loaded;
    if (config) {
      loaded = await loadConfigFromObject(config);
    } else if (configPath) {
      loaded = await loadConfigFromPath(configPath);
    } else {
      return res.status(400).json({ error: 'Missing "path" or "config" in body' });
    }

    reloadRoutesFromConfig(loaded);
    return res.json({ loaded: true, routes: listRegisteredRoutes(app) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Failed to load config' });
  }
});

// Boot: load example config on start
import fs from 'fs/promises';
const defaultConfigPath = path.join(__dirname, '..', 'config', 'example.json');
(async () => {
  try {
    const exists = await fs.stat(defaultConfigPath).then(() => true).catch(() => false);
    if (exists) {
      const cfg = await loadConfigFromPath(defaultConfigPath);
      reloadRoutesFromConfig(cfg);
      console.log(`[mock-api] Loaded example config from ${defaultConfigPath}`);
    } else {
      console.log('[mock-api] No default config found, start without dynamic routes');
    }
  } catch (e) {
    console.warn('[mock-api] Failed to load default config:', e.message);
  }
})();

app.listen(PORT, () => {
  console.log(`Mock API server listening on http://localhost:${PORT}`);
});
