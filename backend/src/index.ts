import express from 'express'
import cors from 'cors'
import { simular, type SimulacionParametros } from './motor_termico.js'

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
  const {
    temperaturas,
    temperaturasAmbiente,
    irradiancias,
    dt,
    L_TUBO,
    RADIO_INT,
    ESPESOR_PARED,
    VELOCIDAD,
    RHO_F,
    CE_F,
    K_F
  } =
    req.body as {
      temperaturas?: unknown
      temperaturasAmbiente?: unknown
      irradiancias?: unknown
      dt?: unknown
      L_TUBO?: unknown
      RADIO_INT?: unknown
      ESPESOR_PARED?: unknown
      VELOCIDAD?: unknown
      RHO_F?: unknown
      CE_F?: unknown
      K_F?: unknown
    }

  if (!Array.isArray(temperaturas)) {
    return res.status(400).json({ error: 'temperaturas debe ser un array' })
  }
  if (!Array.isArray(temperaturasAmbiente)) {
    return res
      .status(400)
      .json({ error: 'temperaturasAmbiente debe ser un array' })
  }
  if (!Array.isArray(irradiancias)) {
    return res.status(400).json({ error: 'irradiancias debe ser un array' })
  }

  const temperaturasArray = temperaturas as number[]
  const temperaturasAmbienteArray = temperaturasAmbiente as number[]
  const irradianciasArray = irradiancias as number[]

  const dtSegundos = dt === undefined || dt === null ? 5 : Number(dt)
  if (!Number.isFinite(dtSegundos) || dtSegundos <= 0) {
    return res.status(400).json({ error: 'dt debe ser un numero mayor a 0' })
  }

  const parseOptionalPositive = (value: unknown, label: string) => {
    if (value === undefined || value === null || value === '') return undefined
    const parsed = Number(value)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw new Error(`${label} debe ser un numero mayor a 0`)
    }
    return parsed
  }

  let parametros: SimulacionParametros = {}
  try {
    parametros = {
      L_TUBO: parseOptionalPositive(L_TUBO, 'L_TUBO'),
      RADIO_INT: parseOptionalPositive(RADIO_INT, 'RADIO_INT'),
      ESPESOR_PARED: parseOptionalPositive(ESPESOR_PARED, 'ESPESOR_PARED'),
      VELOCIDAD: parseOptionalPositive(VELOCIDAD, 'VELOCIDAD'),
      RHO_F: parseOptionalPositive(RHO_F, 'RHO_F'),
      CE_F: parseOptionalPositive(CE_F, 'CE_F'),
      K_F: parseOptionalPositive(K_F, 'K_F')
    }
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message })
  }

  try {
    const resultado = simular(
      temperaturasArray,
      temperaturasAmbienteArray,
      irradianciasArray,
      dtSegundos,
      parametros
    )

    return res.json({
      dt_segundos: dtSegundos,
      n_puntos: temperaturasArray.length,
      tiempo: resultado.tiempo,
      entrada: temperaturasArray,
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
