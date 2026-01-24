import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-temperaturas-list',
  standalone: true,
  imports: [CommonModule, ScrollingModule, MatCardModule, MatIconModule, MatButtonModule, MatTableModule],
  templateUrl: './temperaturas-list.component.html',
  styleUrl: './temperaturas-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TemperaturasListComponent {
  @Input({ required: true }) dataSource!: MatTableDataSource<number>;
  @Input({ required: true }) displayedColumns: string[] = [];
  @Input({ required: true }) totalPuntos = 0;
  @Output() remove = new EventEmitter<number>();
  @Output() clearAll = new EventEmitter<void>();
  @Output() ejecutar = new EventEmitter<void>();

  onRemove(index: number) {
    this.remove.emit(index);
  }

  onEjecutar() {
    this.ejecutar.emit();
  }

  onClearAll() {
    this.clearAll.emit();
  }
}
