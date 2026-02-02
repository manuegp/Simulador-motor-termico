# Motor Termico (Web)

Simulador termico con frontend Angular y backend Express (Vercel).

## Estructura
- `motor-termico/` -> Angular (frontend)
- `backend/` -> Express + API serverless (Vercel)

## Requisitos
- Node.js LTS (incluye npm)
- Vercel CLI (opcional, para desarrollo local del backend)

## Desarrollo local
### Backend (API)
En una terminal:
```
cd backend
npm install
npx vercel dev
```
Por defecto escucha en `http://localhost:3000`.

### Frontend (Angular)
En otra terminal:
```
cd motor-termico
npm install
npm run dev
```
Abre `http://localhost:4200`.

El frontend en modo desarrollo usa `proxy.conf.json` para redirigir `/api` al backend local.

## Endpoints principales
### POST /api/simular
Body (JSON):
```
{
  "temperaturas": [number, ...],
  "temperaturasAmbiente": [number, ...], // opcional
  "dt": 5 // opcional, en segundos
}
```

Respuesta (JSON):
```
{
  "dt_segundos": number,
  "n_puntos": number,
  "tiempo": number[],
  "entrada": number[],
  "salida": number[],
  "temperatura_final": number
}
```

## Configuracion
Backend:
- `ALLOWED_ORIGINS` (opcional): lista separada por comas para CORS. Si no se define, permite cualquier origen.

Frontend:
- `motor-termico/src/environments/environment.development.ts` -> base URL `/api` (proxy).
- `motor-termico/src/environments/environment.ts` -> URL de produccion.

## Build
Frontend:
```
cd motor-termico
npm run build
```

Backend (compila TypeScript):
```
cd backend
npm run build
```

## Notas
- El backend exporta la app de Express para Vercel (`backend/api/index.ts`).
- Hay scripts Python en `backend/` que no se usan en la API actual.
