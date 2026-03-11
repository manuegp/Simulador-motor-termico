import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../environments/environment';

export type ParametrosSimulacion = Partial<{
  L_TUBO: number;
  RADIO_INT: number;
  ESPESOR_PARED: number;
  VELOCIDAD: number;
  RHO_F: number;
  CE_F: number;
  K_F: number;
}>;

@Injectable({
  providedIn: 'root',
})
export class SimulacionService {
  private http = inject(HttpClient);

  /**
   * Inicia la simulación enviando temperaturas de entrada y ambiente
   */
  startSimulation(
    temperaturas: number[],
    temperaturasAmbiente: number[],
    irradiancias: number[],
    dt: number = 60,
    parametros?: ParametrosSimulacion
  ) {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    const payload = {
      temperaturas,
      temperaturasAmbiente,
      irradiancias,
      dt,
      ...(parametros ?? {})
    };
    return this.http.post(
      `${environment.url}/simular`,
      payload,
      { headers }
    );
  }

}

