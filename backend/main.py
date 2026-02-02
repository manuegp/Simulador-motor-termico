import sys
import json
import numpy as np

# ==========================================
# IMPORTAR MOTOR TÉRMICO
# ==========================================
import motor_termico


def main():
    """
    Uso:
    python simular.py "[1,2,3,4]" 5
    """

    if len(sys.argv) < 2:
        # print(json.dumps({"error": "No se recibió el array de temperaturas"}))
        sys.exit(1)

    # ==========================================
    # LEER ARGUMENTOS
    # ==========================================

    try:
        mis_temperaturas = json.loads(sys.argv[1])
    except Exception:
        # print(json.dumps({"error": "El array de temperaturas no es válido"}))
        sys.exit(1)

    dt_segundos = float(sys.argv[2]) if len(sys.argv) > 2 else 5.0

    # ==========================================
    # EJECUTAR SIMULACIÓN
    # ==========================================

    resultado = motor_termico.simular(
        mis_temperaturas,
        dt_segundos=dt_segundos
    )

    # ==========================================
    # RESPUESTA JSON
    # ==========================================

    salida = {
        "dt_segundos": dt_segundos,
        "n_puntos": len(mis_temperaturas),
        "tiempo": resultado["tiempo"].tolist(),
        "entrada": mis_temperaturas,
        "salida": resultado["salida"].tolist(),
        "temperatura_final": float(resultado["salida"][-1])
    }

    print(json.dumps(salida))


if __name__ == "__main__":
    main()
