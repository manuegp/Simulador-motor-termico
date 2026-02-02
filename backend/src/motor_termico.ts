// ==========================================
// CONFIGURACIÓN FÍSICA (Modelo 1D + Pared + Ambiente Dinámico)
// ==========================================
const L_TUBO = 1.87;         // Longitud (m)
const RADIO_INT = 0.005;   // Radio interno (m)
const ESPESOR_PARED = 0.0014;// Espesor del tubo (m)
const VELOCIDAD = 0.5;      // Velocidad del fluido (m/s) (variable necesaria de modificar en cada experimento)
const N_SECCIONES = 50;     // Resolución espacial

// Propiedades del FLUIDO (Agua)
const RHO_F = 997.0;  // Densidad (kg/m3) (variable necesaria de modificar en cada experimento)
const CE_F  = 4178.0; // Calor Específico (J/kg*K) (variable necesaria de modificar en cada experimento)
const K_F   = 0.6;    // Conductividad Térmica (W/m*K) (variable necesaria de modificar en cada experimento)

// Propiedades del SÓLIDO (Material del Tubo, ej. Cobre)
const RHO_S = 8960.0; 
const CE_S  = 385.0;  
// const K_S = 400.0; (No usada en modelo de parámetros concentrados radial)

// Coeficientes de Convección
const H_CONV_INT = 500.0; // Agua -> Pared
const H_CONV_EXT = 15.0;  // Pared -> Aire (Ambiente)

type ResultadoSimulacion = {
    tiempo: number[];
    salida: number[];
    pared_final: number[];
};

/**
 * Simula el transporte térmico con temperatura ambiente variable.
 * @param {Array<number>} temperaturasInput - Array con la temperatura del fluido a la entrada.
 * @param {Array<number>} temperaturasAmbiente - Array con la temperatura exterior en cada instante.
 * @param {number} dtSegundos - Tiempo que pasa entre cada dato de los arrays (ej. 1s).
 */
export function simular(temperaturasInput: number[], temperaturasAmbiente: number[], dtSegundos?: number): ResultadoSimulacion;
export function simular(temperaturasInput: number[], dtSegundos?: number): ResultadoSimulacion;
export function simular(temperaturasInput: number[], temperaturasAmbienteOrDt?: number[] | number, dtSegundos: number = 1.0): ResultadoSimulacion {
    // 1. Validaciones básicas
    if (!Array.isArray(temperaturasInput)) {
        throw new Error("Los inputs de temperatura deben ser arrays.");
    }
    let temperaturasAmbiente: number[] = [];
    if (Array.isArray(temperaturasAmbienteOrDt)) {
        temperaturasAmbiente = temperaturasAmbienteOrDt;
    } else {
        if (typeof temperaturasAmbienteOrDt === "number") {
            dtSegundos = temperaturasAmbienteOrDt;
        }
        const fallback = Number(temperaturasInput[0] ?? 0);
        temperaturasAmbiente = new Array(temperaturasInput.length).fill(fallback);
    }
    if (!Array.isArray(temperaturasAmbiente)) {
        throw new Error("Los inputs de temperatura deben ser arrays.");
    }
    if (temperaturasInput.length === 0 || temperaturasAmbiente.length === 0) {
        return { tiempo: [], salida: [], pared_final: [] };
    }
    if (temperaturasInput.length !== temperaturasAmbiente.length) {
        console.warn("ADVERTENCIA: Los arrays de entrada y ambiente tienen distinta longitud. Se simulará hasta el final del más corto.");
    }
    const longitudSimulacion = Math.min(temperaturasInput.length, temperaturasAmbiente.length);

    // 2. Pre-cálculo de geometría y masas térmicas
    const dx = L_TUBO / N_SECCIONES;
    
    const Radio_Ext = RADIO_INT + ESPESOR_PARED;
    const Area_Flujo = Math.PI * (RADIO_INT ** 2);
    
    // Perímetros para intercambio de calor
    const Perimetro_Int = 2 * Math.PI * RADIO_INT;
    const Perimetro_Ext = 2 * Math.PI * Radio_Ext;
    
    // Volúmenes por celda
    const Vol_Agua_Celda = Area_Flujo * dx;
    const Area_Seccion_Pared = Math.PI * (Radio_Ext**2 - RADIO_INT**2);
    const Vol_Pared_Celda = Area_Seccion_Pared * dx;

    // Capacidades Térmicas (Inercia)
    // Cuántos Julios cuesta subir 1 grado la celda
    const Cap_Termica_Agua = Vol_Agua_Celda * RHO_F * CE_F; 
    const Cap_Termica_Pared = Vol_Pared_Celda * RHO_S * CE_S; 

    // Áreas superficiales de cada "rodaja"
    const Area_Intercambio_Int = Perimetro_Int * dx;
    const Area_Intercambio_Ext = Perimetro_Ext * dx;

    // 3. Estabilidad Numérica (CFL)
    const dtMaxEstabilidad = dx / VELOCIDAD; 
    const dtInterno = dtMaxEstabilidad * 0.5; // Factor seguridad
    const pasosPorDato = Math.ceil(dtSegundos / dtInterno);
    const dtReal = dtSegundos / pasosPorDato;

    // 4. Inicialización
    // Asumimos que el tubo empieza en equilibrio con el PRIMER dato de ambiente
    const T_amb_inicial = Number(temperaturasAmbiente[0]);
    const T_fluido_inicial = Number(temperaturasInput[0]);

    let T_fluido = new Array(N_SECCIONES).fill(T_fluido_inicial);
    let T_pared  = new Array(N_SECCIONES).fill(T_amb_inicial); 

    const resultados = [];
    const ejeTiempo = [];
    let tiempoGlobal = 0.0;

    // ==========================================
    // 5. BUCLE PRINCIPAL (Time Stepping)
    // ==========================================
    for (let i = 0; i < longitudSimulacion; i++) {
        
        // Leemos los datos de entrada para este instante 'i'
        const T_entrada_actual = Number(temperaturasInput[i]);
        const T_ambiente_actual = Number(temperaturasAmbiente[i]); // <--- DATO DINÁMICO

        // Sub-stepping (cálculo fino de física)
        for (let step = 0; step < pasosPorDato; step++) {
            
            const next_T_fluido = [...T_fluido];
            const next_T_pared  = [...T_pared];

            // Condición de frontera: Entrada del tubo
            next_T_fluido[0] = T_entrada_actual;

            // Barrido espacial (celda a celda)
            for (let j = 1; j < N_SECCIONES; j++) {
                
                // --- AGUA ---
                // Advección (transporte por velocidad)
                const adveccion = VELOCIDAD * (T_fluido[j-1] - T_fluido[j]) / dx;
                
                // Intercambio con Pared (h_int)
                // Q positivo = Agua gana calor de la pared
                // Q negativo = Agua pierde calor hacia la pared
                const Q_agua_pared = H_CONV_INT * Area_Intercambio_Int * (T_pared[j] - T_fluido[j]);
                
                // Actualizar Agua
                // dT/dt = Advección + (Q / Capacidad)
                const dT_fluido = adveccion + (Q_agua_pared / Cap_Termica_Agua);
                next_T_fluido[j] = T_fluido[j] + dT_fluido * dtReal;

                // --- PARED ---
                // Balance de energía en la pared:
                // 1. Gana/Pierde del agua (opuesto a Q_agua_pared)
                const Q_recibido_agua = -Q_agua_pared;
                
                // 2. Gana/Pierde del AMBIENTE EXTERIOR (Aquí usamos el array dinámico)
                // Q = h_ext * A * (T_ambiente_actual - T_pared)
                const Q_intercambio_amb = H_CONV_EXT * Area_Intercambio_Ext * (T_ambiente_actual - T_pared[j]);

                // Actualizar Pared
                const dT_pared = (Q_recibido_agua + Q_intercambio_amb) / Cap_Termica_Pared;
                next_T_pared[j] = T_pared[j] + dT_pared * dtReal;
            }

            // Actualizar estado global
            T_fluido = next_T_fluido;
            T_pared  = next_T_pared;
        }

        // Guardar la temperatura de salida (última celda)
        resultados.push(T_fluido[N_SECCIONES - 1]);
        ejeTiempo.push(tiempoGlobal);
        tiempoGlobal += dtSegundos;
    }

    return {
        tiempo: ejeTiempo,
        salida: resultados,
        // Opcional: devolvemos también cómo quedó la pared al final
        pared_final: T_pared 
    };
}

// ==========================================
// EJEMPLO DE USO
// ==========================================
/*
try {
    // Caso: Entra agua caliente constante, pero el día se va enfriando fuera
    const inputAgua = [80, 80, 80, 80, 80, 80, 80, 80, 80, 80];
    const inputAmbiente = [20, 19, 18, 15, 10, 5, 0, -5, -10, -15]; // Cae la helada
    
    const resultado = simular(inputAgua, inputAmbiente, 1.0);
    
    console.log("Tiempo (s) | Temp Salida (°C) | Ambiente (°C)");
    for(let k=0; k<resultado.salida.length; k++){
        console.log(`${resultado.tiempo[k].toFixed(1)}s      | ${resultado.salida[k].toFixed(2)}          | ${inputAmbiente[k]}`);
    }
} catch (e) {
    console.error(e);
}
*/
