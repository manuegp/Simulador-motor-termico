import express from 'express'
import cors from 'cors'
import { simular } from './motor_termico.js'

const app = express()

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

const corsOptions: cors.CorsOptions = {
  origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}

app.use(cors(corsOptions))
app.use(express.json())

app.get('/api/simular', (_req, res) => {
  res.json({ test: true })
})

app.post('/api/simular', (req, res) => {
  const { temperaturas, temperaturasAmbiente, dt } = req.body as {
    temperaturas?: unknown
    temperaturasAmbiente?: unknown
    dt?: unknown
  }

  if (!Array.isArray(temperaturas)) {
    return res.status(400).json({ error: 'temperaturas debe ser un array' })
  }
  if (
    temperaturasAmbiente !== undefined &&
    !Array.isArray(temperaturasAmbiente)
  ) {
    return res
      .status(400)
      .json({ error: 'temperaturasAmbiente debe ser un array' })
  }

  const dtSegundos = dt === undefined || dt === null ? 5 : Number(dt)
  if (!Number.isFinite(dtSegundos) || dtSegundos <= 0) {
    return res.status(400).json({ error: 'dt debe ser un numero mayor a 0' })
  }

  try {
    const resultado = Array.isArray(temperaturasAmbiente)
      ? simular(temperaturas, temperaturasAmbiente, dtSegundos)
      : simular(temperaturas, dtSegundos)

    return res.json({
      dt_segundos: dtSegundos,
      n_puntos: temperaturas.length,
      tiempo: resultado.tiempo,
      entrada: temperaturas,
      salida: resultado.salida,
      temperatura_final: resultado.salida[resultado.salida.length - 1]
    })
  } catch (error) {
    return res
      .status(500)
      .json({ error: 'Error en simulacion', detalle: String(error) })
  }
})

export default app
