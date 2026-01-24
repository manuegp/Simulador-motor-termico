import { Component, inject, signal, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { CommonModule } from '@angular/common';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SimulacionService } from '../service/Simulacion';
import { FilaResultado } from './models/fila-resultado';
import { ConfigFormComponent } from './components/config-form/config-form.component';
import { SimulationHeaderComponent } from './components/simulation-header/simulation-header.component';
import { TemperaturasListComponent } from './components/temperaturas-list/temperaturas-list.component';
import { ResultadosTableComponent } from './components/resultados-table/resultados-table.component';
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
    temperatura: [null, [Validators.required]]
  });

  temperaturas = signal<number[]>([]);
  dataSourceEntrada = new MatTableDataSource<number>([]);
  displayedColumnsEntrada = ['index', 'valor', 'acciones'];

  dataSourceResultados = new MatTableDataSource<FilaResultado>([]);
  displayedColumnsResultados = ['tiempo', 'entrada', 'salida'];
  isLoading = signal(false);

  addTemperatura() {
    if (this.tempForm.invalid) return;
    const value = this.tempForm.value.temperatura!;
    this.temperaturas.update(prev => [...prev, value]);
    this.dataSourceEntrada.data = this.temperaturas();
    this.tempForm.reset();
  }

  removeTemperatura(index: number) {
    this.temperaturas.update(prev => prev.filter((_, i) => i !== index));
    this.dataSourceEntrada.data = this.temperaturas();
  }

  loadTemperaturas(values: number[]) {
    if (!values.length) return;
    this.temperaturas.update(prev => [...prev, ...values]);
    this.dataSourceEntrada.data = this.temperaturas();
  }

  ejecutar() {
    if (this.temperaturas().length === 0 || this.isLoading()) return;

    this.isLoading.set(true);
    this.simulacionService.startSimulation(this.temperaturas())
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((res: any) => {
        const filas: FilaResultado[] = res.tiempo.map((t: number, i: number) => ({
          tiempo: t,
          entrada: res.entrada[i],
          salida: res.salida[i]
        }));

        this.dataSourceResultados.data = filas;

        // Regresamos a la primera página si hay datos nuevos
        this.resultadosTable?.resetPaginator();
      });
  }
}
