import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FilaResultado } from '../../models/fila-resultado';

@Component({
  selector: 'app-resultados-table',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule
  ],
  templateUrl: './resultados-table.component.html',
  styleUrl: './resultados-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResultadosTableComponent implements AfterViewInit {
  @Input({ required: true }) dataSource!: MatTableDataSource<FilaResultado>;
  @Input({ required: true }) displayedColumns: string[] = [];
  @Output() hoverRow = new EventEmitter<number | null>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngAfterViewInit() {
    if (this.dataSource) {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }
  }

  resetPaginator() {
    if (this.paginator) {
      this.paginator.firstPage();
    }
  }

  emitHover(row: FilaResultado | null) {
    if (!row || !this.dataSource) {
      this.hoverRow.emit(null);
      return;
    }

    const index = this.dataSource.data.indexOf(row);
    this.hoverRow.emit(index >= 0 ? index : null);
  }

  exportCsv() {
    if (!this.dataSource?.data?.length) return;

    const headers = ['Tiempo', 'Entrada', 'Ambiente', 'Salida'];
    const rows = this.dataSource.data.map(row => [
      this.formatCsvValue(row.tiempo),
      this.formatCsvValue(row.entrada),
      this.formatCsvValue(row.ambiente),
      this.formatCsvValue(row.salida)
    ]);

    const csv = [headers.join(','), ...rows.map(values => values.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `resultados-${this.getTimestamp()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private formatCsvValue(value: number | string) {
    const text = `${value ?? ''}`;
    if (text.includes('"') || text.includes(',') || text.includes('\n')) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  }

  private getTimestamp() {
    const now = new Date();
    const pad = (value: number) => value.toString().padStart(2, '0');
    return [
      now.getFullYear(),
      pad(now.getMonth() + 1),
      pad(now.getDate())
    ].join('') + '-' + [pad(now.getHours()), pad(now.getMinutes()), pad(now.getSeconds())].join('');
  }
}
