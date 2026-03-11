import { Component, inject, signal, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { CommonModule } from '@angular/common';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SimulacionService } from '../service/Simulacion';
import { FilaResultado } from './models/fila-resultado';
import { TemperaturaRow } from './models/temperatura-row';
import { ConfigFormComponent } from './components/config-form/config-form.component';
import { SimulationHeaderComponent } from './components/simulation-header/simulation-header.component';
import { TemperaturasListComponent } from './components/temperaturas-list/temperaturas-list.component';
import { ResultadosTableComponent } from './components/resultados-table/resultados-table.component';
import { ResultadosChartComponent } from './components/resultados-chart/resultados-chart.component';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    SimulationHeaderComponent,
    ConfigFormComponent,
    TemperaturasListComponent,
    ResultadosChartComponent,
    ResultadosTableComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  providers: [
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { subscriptSizing: 'dynamic' } },
    {
      provide: MatPaginatorIntl,
      useFactory: () => {
        const intl = new MatPaginatorIntl();
        intl.itemsPerPageLabel = 'Filas por página';
        intl.nextPageLabel = 'Página siguiente';
        intl.previousPageLabel = 'Página anterior';
        intl.firstPageLabel = 'Primera página';
        intl.lastPageLabel = 'Última página';
        intl.getRangeLabel = (page, pageSize, length) => {
          if (length === 0 || pageSize === 0) {
            return `0 de ${length}`;
          }
          const startIndex = page * pageSize;
          const endIndex = Math.min(startIndex + pageSize, length);
          return `${startIndex + 1} - ${endIndex} de ${length}`;
        };
        return intl;
      }
    }
  ],
})
export class App {
  private fb = inject(FormBuilder);
  private simulacionService = inject(SimulacionService);

  @ViewChild(ResultadosTableComponent) resultadosTable?: ResultadosTableComponent;

  tempForm = this.fb.group({
    temperaturaEntrada: [null, [Validators.required]],
    temperaturaAmbiente: [null, [Validators.required]],
    irradiancia: [null, [Validators.required]],
    L_TUBO: [1.87],
    RADIO_INT: [0.005],
    ESPESOR_PARED: [0.0014],
    VELOCIDAD: [0.021],
    RHO_F: [997.0],
    CE_F: [4178.0],
    K_F: [0.6]
  });

  temperaturasEntrada = signal<number[]>([]);
  temperaturasAmbiente = signal<number[]>([]);
  irradiancias = signal<number[]>([]);
  dataSourceEntrada = new MatTableDataSource<TemperaturaRow>([]);
  displayedColumnsEntrada = ['index', 'entrada', 'ambiente', 'irradiancia', 'acciones'];

  dataSourceResultados = new MatTableDataSource<FilaResultado>([]);
  displayedColumnsResultados = ['tiempo', 'entrada', 'ambiente', 'salida'];
  isLoading = signal(false);
  hoveredResultadoIndex = signal<number | null>(null);

  addTemperatura() {
    if (this.tempForm.invalid) return;
    const entrada = this.tempForm.value.temperaturaEntrada!;
    const ambiente = this.tempForm.value.temperaturaAmbiente!;
    const irradiancia = this.tempForm.value.irradiancia!;
    this.temperaturasEntrada.update(prev => [...prev, entrada]);
    this.temperaturasAmbiente.update(prev => [...prev, ambiente]);
    this.irradiancias.update(prev => [...prev, irradiancia]);
    this.dataSourceEntrada.data = this.temperaturasEntrada().map((value, index) => ({
      entrada: value,
      ambiente: this.temperaturasAmbiente()[index],
      irradiancia: this.irradiancias()[index]
    }));
    this.tempForm.reset();
  }

  removeTemperatura(index: number) {
    this.temperaturasEntrada.update(prev => prev.filter((_, i) => i !== index));
    this.temperaturasAmbiente.update(prev => prev.filter((_, i) => i !== index));
    this.irradiancias.update(prev => prev.filter((_, i) => i !== index));
    this.dataSourceEntrada.data = this.temperaturasEntrada().map((value, i) => ({
      entrada: value,
      ambiente: this.temperaturasAmbiente()[i],
      irradiancia: this.irradiancias()[i]
    }));
  }

  clearTemperaturas() {
    this.temperaturasEntrada.set([]);
    this.temperaturasAmbiente.set([]);
    this.irradiancias.set([]);
    this.dataSourceEntrada.data = [];
  }

  loadTemperaturas(values: {
    entrada: number[];
    ambiente: number[];
    irradiancia: number[];
  }) {
    if (!values.entrada.length) return;
    const entrada = values.entrada;
    const ambiente =
      values.ambiente.length === values.entrada.length
        ? values.ambiente
        : values.entrada.map(value => value);
    const irradiancia =
      values.irradiancia.length === values.entrada.length
        ? values.irradiancia
        : values.entrada.map(() => 0);

    this.temperaturasEntrada.set(entrada);
    this.temperaturasAmbiente.set(ambiente);
    this.irradiancias.set(irradiancia);
    this.dataSourceEntrada.data = entrada.map((value, index) => ({
      entrada: value,
      ambiente: ambiente[index] ?? value,
      irradiancia: irradiancia[index] ?? 0
    }));
  }

  ejecutar() {
    if (this.temperaturasEntrada().length === 0 || this.isLoading()) return;

    const values = this.tempForm.getRawValue();
    const toOptionalNumber = (value: number | null | undefined) =>
      value === null || value === undefined ? undefined : value;

    const parametros = {
      L_TUBO: toOptionalNumber(values.L_TUBO),
      RADIO_INT: toOptionalNumber(values.RADIO_INT),
      ESPESOR_PARED: toOptionalNumber(values.ESPESOR_PARED),
      VELOCIDAD: toOptionalNumber(values.VELOCIDAD),
      RHO_F: toOptionalNumber(values.RHO_F),
      CE_F: toOptionalNumber(values.CE_F),
      K_F: toOptionalNumber(values.K_F)
    };

    this.isLoading.set(true);
    this.simulacionService
      .startSimulation(
        this.temperaturasEntrada(),
        this.temperaturasAmbiente(),
        this.irradiancias(),
        60,
        parametros
      )
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((res: any) => {
        const ambienteLocal = this.temperaturasAmbiente();
        const filas: FilaResultado[] = res.tiempo.map((t: number, i: number) => ({
          tiempo: t,
          entrada: res.entrada[i],
          ambiente: ambienteLocal[i] ?? res.entrada[i],
          salida: res.salida[i]
        }));

        this.dataSourceResultados.data = filas;

        // Regresamos a la primera página si hay datos nuevos
        this.resultadosTable?.resetPaginator();
      });
  }
}
