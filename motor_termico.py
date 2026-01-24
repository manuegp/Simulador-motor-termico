import numpy as np

# ==========================================
# CONFIGURACIÓN FÍSICA (Valores por defecto)
# ==========================================
L_TUBO = 4.0 # Longitud (m)
RADIO = 0.0035 # Radio (m)
VELOCIDAD = 0.5 # Velocidad del fluido (m/s)
N_SECCIONES = 50 # Precisión (número de celdas)

def simular(temperaturas_input, dt_segundos=1.0):
    """
    Simula la transferencia de calor en el tubo.
    
    Args:
        temperaturas_input (list o array): Array con las temperaturas de entrada paso a paso.
        dt_segundos (float): Cuántos segundos pasan entre cada dato del array.
                             Por defecto asume 1 segundo entre datos.
                             
    Returns:
        dict: Diccionario con {'tiempo': array, 'salida': array}
    """
    
    # Convertir entrada a array numpy para velocidad
    T_input_array = np.array(temperaturas_input)
    
    # print(f"--- Iniciando Motor Térmico ---")
    # print(f" -> Procesando {len(T_input_array)} puntos de entrada")
    # print(f" -> Intervalo de tiempo (dt): {dt_segundos} s")
    
    # 1. Configuración de la Malla Espacial
    dx = L_TUBO / N_SECCIONES
    
    # 2. Configuración Temporal Interna (Estabilidad)
    # El simulador necesita pasos de tiempo muy pequeños para ser preciso
    # aunque tus datos vengan cada 1 segundo.
    dt_max_estabilidad = dx / VELOCIDAD
    dt_interno = dt_max_estabilidad * 0.9 # Factor de seguridad 0.9
    
    # Cuántos pasos internos de simulación hay por cada dato de tu array
    pasos_por_dato = int(dt_segundos / dt_interno) + 1
    dt_real = dt_segundos / pasos_por_dato # Ajuste fino del dt
    
    # 3. Inicialización del Tubo
    # Asumimos que el tubo empieza a la temperatura del primer dato
    T_tubo = np.ones(N_SECCIONES) * T_input_array[0]
    
    # Array para guardar resultados
    resultados = []
    eje_tiempo = []
    tiempo_actual = 0.0
    
    # 4. BUCLE PRINCIPAL
    for i, temp_entrada_actual in enumerate(T_input_array):
        
        # Objetivo: Avanzar la física hasta el siguiente punto de tus datos
        target_temp = temp_entrada_actual
        
        # Sub-bucle de física (pasos pequeños)
        for _ in range(pasos_por_dato):
            T_new = T_tubo.copy()
            
            # Cálculo de Advección (Transporte)
            # T[i] depende de T[i-1]
            gradiente = (T_tubo[:-1] - T_tubo[1:]) / dx
            cambio = VELOCIDAD * gradiente * dt_real
            
            # Aplicar cambios
            T_new[1:] = T_tubo[1:] + cambio
            
            # Condición de frontera (Entrada)
            # Interpolamos suavemente hacia el nuevo valor de entrada
            T_new[0] = target_temp 
            
            T_tubo = T_new
            
        # Guardamos el resultado al final de este intervalo
        resultados.append(T_tubo[-1]) # Temperatura al final del tubo
        eje_tiempo.append(tiempo_actual)
        tiempo_actual += dt_segundos

    return {
        "tiempo": np.array(eje_tiempo),
        "salida": np.array(resultados)
    }