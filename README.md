# Mock API (configurable via JSON)

A Node.js/Express service that generates mock endpoints by reading a JSON configuration. It includes a simple UI to load the config and view available routes.

## Requirements
- Node.js 18+

## Installation
```bash
npm install
```

## Run
```bash
npm run start
```
The server starts at http://localhost:3000 and serves the UI from `public/`.

On startup it tries to load `config/example.json` if present.

## Admin API
- `GET /health`: server status
- `GET /admin/routes`: list of registered routes
- `POST /admin/load-config`: load configuration
  - JSON body: `{ "path": "<file path>" }` or `{ "config": { ... } }`

## Config format
```json
{
  "basePath": "/api",
  "routes": [
    { "method": "GET", "path": "/users", "status": 200, "response": [{"id":1}] },
    { "method": "POST", "path": "/users", "status": 201, "response": {"ok":true} },
    { "method": "PATCH", "path": "/users/1", "status": 200, "response": {"id":1} }
  ]
}
```
- `method`: one of `GET`, `POST`, `PATCH`, `PUT`, `DELETE`
- `path`: path relative to `basePath`
- `status`: HTTP status code to return (default 200)
- `response`: returned JSON payload
- `delay`: (optional) delay in ms before responding

## UI
Open `http://localhost:3000/`:
- paste a JSON into the textarea and click "Load from JSON"
- click "Load example" to load `config/example.json`
- see current routes and ping `/health`

## Notes
- If by mistake you wrote "PATH" as the verb, use "PATCH". The server also supports `PUT` and `DELETE`.

## Full configuration example (config/example.json)
```json
{
  "basePath": "/api",
  "routes": [
    { "method": "GET", "path": "/users", "status": 200, "response": [{"id":1,"name":"Alice"},{"id":2,"name":"Bob"}] },
    { "method": "POST", "path": "/users", "status": 201, "response": {"id":3,"name":"Carol"} },
    { "method": "PATCH", "path": "/users/1", "status": 200, "response": {"id":1,"name":"Alice Updated"}, "delay": 300 },
    { "method": "PUT", "path": "/users/2", "status": 200, "response": {"id":2,"name":"Bob Updated"} },
    { "method": "DELETE", "path": "/users/3", "status": 204, "response": {} }
  ]
}
```

## curl examples
Note (Windows/PowerShell): use double quotes in the JSON of `-d` and `^` for line continuation.

- GET `/api/users`
```bash
curl "http://localhost:3000/api/users"
```

- POST `/api/users`
```bash
curl -X POST "http://localhost:3000/api/users" ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Carol\"}"
```

- PATCH `/api/users/1`
```bash
curl -X PATCH "http://localhost:3000/api/users/1" ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Alice Updated\"}"
```

- PUT `/api/users/2`
```bash
curl -X PUT "http://localhost:3000/api/users/2" ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Bob Updated\"}"
```

- DELETE `/api/users/3`
```bash
curl -X DELETE "http://localhost:3000/api/users/3"
```

- Admin: list routes
```bash
curl "http://localhost:3000/admin/routes"
```

- Admin: reload example config from file
```bash
curl -X POST "http://localhost:3000/admin/load-config" ^
  -H "Content-Type: application/json" ^
  -d "{\"path\":\"c:\\repositories\\esperimenti\\mock-api\\config\\example.json\"}"
```

- Health check
```bash
curl "http://localhost:3000/health"
```
