import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../environments/environment';

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
    dt: number = 5
  ) {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.post(
      `${environment.url}/simular`,
      { temperaturas, temperaturasAmbiente, dt },
      { headers }
    );
  }

}


