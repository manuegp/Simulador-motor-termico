// Implementacion JS de la simulacion del motor termico (antes en Python)
const L_TUBO = 4.0; // Longitud (m)
const RADIO = 0.0035; // Radio (m) - no usado, pero se mantiene por paridad
const VELOCIDAD = 0.5; // Velocidad del fluido (m/s)
const N_SECCIONES = 50; // Precision (numero de celdas)

function simular(temperaturasInput, dtSegundos = 1.0) {
    if (!Array.isArray(temperaturasInput) || temperaturasInput.length === 0) {
        throw new Error("temperaturasInput debe ser un array con al menos un valor");
    }

    const dx = L_TUBO / N_SECCIONES;
    const dtMaxEstabilidad = dx / VELOCIDAD;
    const dtInterno = dtMaxEstabilidad * 0.9;

    const pasosPorDato = Math.floor(dtSegundos / dtInterno) + 1;
    const dtReal = dtSegundos / pasosPorDato;

    let T_tubo = new Array(N_SECCIONES).fill(Number(temperaturasInput[0]));

    const resultados = [];
    const ejeTiempo = [];
    let tiempoActual = 0.0;

    for (let i = 0; i < temperaturasInput.length; i += 1) {
        const targetTemp = Number(temperaturasInput[i]);

        for (let step = 0; step < pasosPorDato; step += 1) {
            const T_new = T_tubo.slice();

            for (let j = 0; j < N_SECCIONES - 1; j += 1) {
                const gradiente = (T_tubo[j] - T_tubo[j + 1]) / dx;
                const cambio = VELOCIDAD * gradiente * dtReal;
                T_new[j + 1] = T_tubo[j + 1] + cambio;
            }

            T_new[0] = targetTemp;
            T_tubo = T_new;
        }

        resultados.push(T_tubo[N_SECCIONES - 1]);
        ejeTiempo.push(tiempoActual);
        tiempoActual += dtSegundos;
    }

    return {
        tiempo: ejeTiempo,
        salida: resultados
    };
}

module.exports = { simular };
