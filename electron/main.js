const { app, BrowserWindow, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const { startServer } = require("../backend/server");

let server = null;

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            contextIsolation: true
        }
    });

    const indexPath = path.join(
        __dirname,
        "..",
        "motor-termico",
        "dist",
        "motor-termico",
        "browser",
        "index.html"
    );
    if (!fs.existsSync(indexPath)) {
        dialog.showErrorBox(
            "Build no encontrado",
            "No se encontro el build de Angular. Ejecuta: npm run build:ui"
        );
        return;
    }

    win.loadFile(indexPath);
}

app.whenReady().then(() => {
    const port = Number(process.env.BACKEND_PORT) || 3000;
    server = startServer(port);
    createWindow();

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on("window-all-closed", () => {
    if (server) {
        server.close();
    }
    if (process.platform !== "darwin") {
        app.quit();
    }
});
