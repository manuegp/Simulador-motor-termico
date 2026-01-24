const express = require("express");
const cors = require("cors");
const { simular } = require("./motor_termico");

function createApp() {
    const app = express();

    app.use(cors());
    app.use(express.json());

    app.get("/api/simular", (req, res) => {
        res.json({ test: true });
    });

    app.post("/api/simular", (req, res) => {
        const { temperaturas, dt } = req.body;

        if (!Array.isArray(temperaturas)) {
            return res.status(400).json({ error: "temperaturas debe ser un array" });
        }

        const dtSegundos = dt === undefined || dt === null ? 5 : Number(dt);
        if (!Number.isFinite(dtSegundos) || dtSegundos <= 0) {
            return res.status(400).json({ error: "dt debe ser un numero mayor a 0" });
        }

        try {
            const resultado = simular(temperaturas, dtSegundos);

            res.json({
                dt_segundos: dtSegundos,
                n_puntos: temperaturas.length,
                tiempo: resultado.tiempo,
                entrada: temperaturas,
                salida: resultado.salida,
                temperatura_final: resultado.salida[resultado.salida.length - 1]
            });
        } catch (e) {
            res.status(500).json({ error: "Error en simulacion", detalle: String(e) });
        }
    });

    return app;
}

function startServer(port = Number(process.env.PORT) || 3000) {
    const app = createApp();
    const server = app.listen(port, () => {
        console.log(`Servidor escuchando en http://localhost:${port}`);
    });
    return server;
}

if (require.main === module) {
    startServer();
}

module.exports = { startServer };
