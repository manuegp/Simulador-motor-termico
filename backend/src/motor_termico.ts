// ==========================================
// MODELO 1D CON RADIACIÓN SOLAR Y TÉRMICA
// ==========================================

export type SimulacionParametros = Partial<{
    L_TUBO: number;
    RADIO_INT: number;
    ESPESOR_PARED: number;
    VELOCIDAD: number;
    RHO_F: number;
    CE_F: number;
    K_F: number;
}>;

// Geometría (defaults)
const DEFAULT_L_TUBO = 1.87;
const DEFAULT_RADIO_INT = 0.005;
const DEFAULT_ESPESOR_PARED = 0.0014;
const DEFAULT_VELOCIDAD = 0.021; // CORREGIDO
const N_SECCIONES = 100;

// Propiedades agua (defaults)
const DEFAULT_RHO_F = 997.0;
const DEFAULT_CE_F  = 4178.0;
const DEFAULT_K_F   = 0.6;

// Propiedades cobre
const RHO_S = 8960.0;
const CE_S  = 385.0;

// Intercambio
const H_CONV_INT = 800.0;     // Más realista a baja velocidad
const H_CONV_EXT = 10.0;      // Convección natural aire

// Radiación
const EMISIVIDAD = 0.8;       // Tubo oscuro/cobre oxidado
const ABSORTIVIDAD = 0.8;     // Para radiación solar
const SIGMA = 5.67e-8;        // Stefan-Boltzmann

const FRACCION_SOL = 1.0;     // 1.0 = todo el tubo al sol

const T_PARED_INICIAL = 35.0;

export function simular(
    temperaturasInput: number[],
    temperaturasAmbiente: number[],
    irradiancias: number[],
    dtSegundos = 60.0,
    parametros: SimulacionParametros = {}
) {
    const L_TUBO = parametros.L_TUBO ?? DEFAULT_L_TUBO;
    const RADIO_INT = parametros.RADIO_INT ?? DEFAULT_RADIO_INT;
    const ESPESOR_PARED = parametros.ESPESOR_PARED ?? DEFAULT_ESPESOR_PARED;
    const VELOCIDAD = parametros.VELOCIDAD ?? DEFAULT_VELOCIDAD;

    const RHO_F = parametros.RHO_F ?? DEFAULT_RHO_F;
    const CE_F = parametros.CE_F ?? DEFAULT_CE_F;
    const K_F = parametros.K_F ?? DEFAULT_K_F;
    const ALFA_F = K_F / (RHO_F * CE_F);

    const longitudSimulacion = Math.min(
        temperaturasInput.length,
        temperaturasAmbiente.length,
        irradiancias.length
    );

    const dx = L_TUBO / N_SECCIONES;
    const Radio_Ext = RADIO_INT + ESPESOR_PARED;

    const Area_Flujo = Math.PI * RADIO_INT**2;
    const Perimetro_Int = 2 * Math.PI * RADIO_INT;
    const Perimetro_Ext = 2 * Math.PI * Radio_Ext;

    const Vol_Agua = Area_Flujo * dx;
    const Area_Pared = Math.PI * (Radio_Ext**2 - RADIO_INT**2);
    const Vol_Pared = Area_Pared * dx;

    const Cap_Agua = Vol_Agua * RHO_F * CE_F;
    const Cap_Pared = Vol_Pared * RHO_S * CE_S;

    const Area_Int = Perimetro_Int * dx;
    const Area_Ext = Perimetro_Ext * dx;
    // CORRECCIÓN 1: El sol solo impacta en la cara visible del tubo (Rectángulo proyectado)
    const Area_Proyectada_Sol = (2 * Radio_Ext) * dx;

    // Estabilidad
    const dtMaxAdv = dx / VELOCIDAD;
    const dtMaxDif = (dx * dx) / (2 * ALFA_F);
    const dtInterno = Math.min(dtMaxAdv, dtMaxDif) * 0.5;
    const pasosPorDato = Math.ceil(dtSegundos / dtInterno);
    const dtReal = dtSegundos / pasosPorDato;

    let T_fluido = new Array(N_SECCIONES).fill(temperaturasInput[0]);
    let T_pared  = new Array(N_SECCIONES).fill(T_PARED_INICIAL);

    const resultados = [];
    const ejeTiempo = [];
    let tiempoGlobal = 0;

    for (let i = 0; i < longitudSimulacion; i++) {

        const Tin = temperaturasInput[i];
        const Tamb = temperaturasAmbiente[i];
        const G = irradiancias[i]; // W/m²

        for (let step = 0; step < pasosPorDato; step++) {

            const next_Tf = [...T_fluido];
            const next_Tp = [...T_pared];

            next_Tf[0] = Tin;

            for (let j = 1; j < N_SECCIONES; j++) {

                // ---- AGUA ----
                const adveccion = VELOCIDAD * (T_fluido[j-1] - T_fluido[j]) / dx;

                let difusion = 0.0;
                if (j < N_SECCIONES - 1) {
                    difusion = ALFA_F * (T_fluido[j+1] - 2*T_fluido[j] + T_fluido[j-1]) / (dx*dx);
                } else {
                    // CORRECCIÓN 3: Condición adiabática en la salida (gradiente térmico nulo hacia adelante)
                    difusion = ALFA_F * (T_fluido[j-1] - T_fluido[j]) / (dx*dx);
                }

                const Q_agua_pared = H_CONV_INT * Area_Int * (T_pared[j] - T_fluido[j]);

                const dT_f = adveccion + difusion + (Q_agua_pared / Cap_Agua);
                next_Tf[j] = T_fluido[j] + dT_f * dtReal;

                // ---- PARED ----

                const Q_conv = H_CONV_EXT * Area_Ext * (Tamb - T_pared[j]);

                // CORRECCIÓN 2: Radiación térmica hacia la bóveda celeste (Kelvin)
                const TparedK = T_pared[j] + 273.15;
                const TambK = Tamb + 273.15;
                const TcieloK = TambK - 12.0; // El cielo está aprox. 12 grados más frío que el aire
                const Q_rad = EMISIVIDAD * SIGMA * Area_Ext *
                              (Math.pow(TcieloK,4) - Math.pow(TparedK,4));

                // Radiación solar (Usa el Área Proyectada, NO la exterior)
                const Q_solar = G * ABSORTIVIDAD * Area_Proyectada_Sol * FRACCION_SOL;

                const Q_total_pared =
                    (-Q_agua_pared) +
                    Q_conv +
                    Q_rad +
                    Q_solar;

                const dT_p = Q_total_pared / Cap_Pared;
                next_Tp[j] = T_pared[j] + dT_p * dtReal;
            }

            T_fluido = next_Tf;
            T_pared = next_Tp;
        }

        resultados.push(T_fluido[N_SECCIONES - 1]);
        ejeTiempo.push(tiempoGlobal);
        tiempoGlobal += dtSegundos;
    }

    return {
        tiempo: ejeTiempo,
        salida: resultados,
        pared_final: T_pared
    };
}
