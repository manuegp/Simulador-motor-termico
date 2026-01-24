# Electron (Windows)

Este proyecto empaqueta el frontend Angular y el backend Express en una app Electron,
generando un **.exe portable** para Windows (sin instalador).

## Requisitos
- Windows 10/11
- Node.js LTS (incluye npm)
- Git (opcional, solo para clonar)

## Estructura
- `motor-termico/` -> Angular (frontend)
- `backend/` -> Express (API)
- `electron/main.js` -> proceso principal de Electron
- `dist-electron/` -> salida del build del .exe portable

## Instalacion de dependencias
Desde la raiz (`c:\dev\chechu_script`):
```
npm install
npm run install:all
```

## Ejecutar en modo app (local)
Construye el frontend y abre la ventana Electron:
```
npm run start
```

## Compilar el .exe portable
Genera el ejecutable en `dist-electron\`:
```
npm run dist
```

## Solucion de problemas
- **Build no encontrado**: ejecuta `npm run build:ui` y revisa que exista
  `motor-termico\dist\motor-termico\browser\index.html`.
- **No cargan JS/CSS en Electron**: ya se usa `baseHref: "./"`. Rebuild:
  `npm run build:ui`.
- **Error de permisos con winCodeSign**:
  - Activa Developer Mode en Windows (Settings → Privacy & Security → For Developers).
  - Borra cache: `rmdir /s /q "%LOCALAPPDATA%\electron-builder\Cache\winCodeSign"`.
  - Reintenta `npm run dist`.

## Notas
- El backend levanta por defecto en `http://localhost:3000`.
- El frontend se carga desde archivos estaticos (build de Angular).
