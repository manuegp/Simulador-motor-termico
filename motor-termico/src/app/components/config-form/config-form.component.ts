import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-config-form',
  standalone: true,
  imports: [
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule
  ],
  templateUrl: './config-form.component.html',
  styleUrl: './config-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfigFormComponent {
  @Input({ required: true }) formGroup!: FormGroup;
  @Output() add = new EventEmitter<void>();
  @Output() load = new EventEmitter<{ entrada: number[]; ambiente: number[] }>();

  isDragOver = false;
  fileError = '';

  onAdd() {
    this.add.emit();
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
  }

  async onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      await this.handleFile(file);
    }
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) {
      await this.handleFile(file);
    }
  }

  async handleFile(file: File) {
    this.fileError = '';
    const extension = file.name.split('.').pop()?.toLowerCase();
    try {
      if (extension === 'csv' || extension === 'txt') {
        const text = await file.text();
        const values = this.parseNumbers(text);
        this.emitValues(values);
        return;
      }

      if (extension === 'xlsx') {
        await this.parseXlsx(file);
        return;
      }

      this.fileError = 'Formato no soportado. Usa .csv o .xlsx.';
    } catch (error) {
      this.fileError = 'No se pudo leer el archivo. Verifica el formato.';
    }
  }

  parseNumbers(raw: string) {
    const lines = raw
      .split(/\r?\n/g)
      .map(line => line.trim())
      .filter(Boolean);

    const rows = lines.map(line => {
      const separator = line.includes(';') ? ';' : ',';
      return line
        .split(separator)
        .map(value => value.trim())
        .filter(Boolean);
    });

    return this.parseRows(rows);
  }

  emitValues(values: { entrada: number[]; ambiente: number[] }) {
    if (values.entrada.length === 0) {
      this.fileError = 'No se encontraron números válidos en el archivo.';
      return;
    }
    this.load.emit(values);
  }

  async parseXlsx(file: File) {
    try {
      const xlsx = await import('xlsx');
      const data = await file.arrayBuffer();
      const workbook = xlsx.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows: unknown[][] = xlsx.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
      const values = this.parseRows(rows);
      this.emitValues(values);
    } catch (error) {
      this.fileError =
        'Para leer .xlsx instala la librería "xlsx". Si no, usa un .csv.';
    }
  }

  private parseRows(rows: unknown[][]) {
    const parsedRows = rows.map(row =>
      row
        .map(value =>
          typeof value === 'string' ? value.replace(',', '.').trim() : value
        )
        .filter(value => value !== null && value !== undefined && value !== '')
        .map(value => Number(value))
        .filter(value => Number.isFinite(value))
    );

    const hasTwoColumns = parsedRows.some(row => row.length >= 2);
    const entrada: number[] = [];
    const ambiente: number[] = [];

    parsedRows.forEach(row => {
      if (row.length === 0) return;
      if (hasTwoColumns) {
        if (row.length >= 2) {
          entrada.push(row[0]);
          ambiente.push(row[1]);
        }
        return;
      }
      entrada.push(row[0]);
      ambiente.push(row[0]);
    });

    return { entrada, ambiente };
  }

}
