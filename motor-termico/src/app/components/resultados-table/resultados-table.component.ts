import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  Input,
  ViewChild
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
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
}
