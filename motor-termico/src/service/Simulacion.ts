import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SimulacionService {
  private http = inject(HttpClient);

  /**
   * Inicia la simulación enviando temperaturas y opcional dt
   */
  startSimulation(temperaturas: number[], dt: number = 5) {
    return this.http.post(`${environment.url}/simular`, { temperaturas, dt });
  }

}
