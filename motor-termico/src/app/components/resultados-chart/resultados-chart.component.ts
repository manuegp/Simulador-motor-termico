import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { Chart } from 'chart.js/auto';
import { FilaResultado } from '../../models/fila-resultado';

@Component({
  selector: 'app-resultados-chart',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './resultados-chart.component.html',
  styleUrl: './resultados-chart.component.scss'
})
export class ResultadosChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) data: FilaResultado[] = [];
  @Input() hoveredIndex: number | null = null;
  @ViewChild('chartCanvas') chartCanvas?: ElementRef<HTMLCanvasElement>;

  private chart?: Chart;

  ngAfterViewInit() {
    this.renderChart();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data']) {
      this.updateChart();
    }
    if (changes['hoveredIndex']) {
      this.updateHover();
    }
  }

  ngOnDestroy() {
    this.chart?.destroy();
  }

  private renderChart() {
    const canvas = this.chartCanvas?.nativeElement;
    if (!canvas) return;

    this.chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: this.data.map(item => item.tiempo),
        datasets: [
          {
            label: 'Entrada',
            data: this.data.map(item => item.entrada),
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.18)',
            borderWidth: 2,
            tension: 0.35,
            pointRadius: 2,
            pointHoverRadius: 4,
            fill: true
          },
          {
            label: 'Salida',
            data: this.data.map(item => item.salida),
            borderColor: '#14b8a6',
            backgroundColor: 'rgba(20, 184, 166, 0.18)',
            borderWidth: 2,
            tension: 0.35,
            pointRadius: 2,
            pointHoverRadius: 4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true
            }
          },
          tooltip: {
            callbacks: {
              label: context => {
                const value = context.parsed.y ?? 0;
                return `${context.dataset.label}: ${value.toFixed(2)}`;
              }
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Tiempo'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Temperatura'
            }
          }
        }
      }
    });
  }

  private updateChart() {
    if (!this.chart) {
      this.renderChart();
      return;
    }

    this.chart.data.labels = this.data.map(item => item.tiempo);
    if (this.chart.data.datasets[0]) {
      this.chart.data.datasets[0].data = this.data.map(item => item.entrada);
    }
    if (this.chart.data.datasets[1]) {
      this.chart.data.datasets[1].data = this.data.map(item => item.salida);
    }
    this.chart.update();
  }

  private updateHover() {
    if (!this.chart) return;

    const index = this.hoveredIndex;
    const hasValidIndex = index !== null && index >= 0 && index < this.data.length;

    if (!hasValidIndex) {
      this.chart.setActiveElements([]);
      this.chart.tooltip?.setActiveElements([], { x: 0, y: 0 });
      this.chart.update('none');
      return;
    }

    const active = [
      { datasetIndex: 0, index },
      { datasetIndex: 1, index }
    ];

    const meta = this.chart.getDatasetMeta(0);
    const element = meta?.data?.[index];
    const props = element?.getProps?.(['x', 'y'], true);
    const position = props ? { x: props['x'] ?? 0, y: props['y'] ?? 0 } : { x: 0, y: 0 };

    this.chart.setActiveElements(active);
    this.chart.tooltip?.setActiveElements(active, position);
    this.chart.update('none');
  }
}
