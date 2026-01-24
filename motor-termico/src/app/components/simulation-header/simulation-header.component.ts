import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
@Component({
  selector: 'app-simulation-header',
  standalone: true,
  imports: [],
  templateUrl: './simulation-header.component.html',
  styleUrl: './simulation-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SimulationHeaderComponent {
  @Input({ required: true }) totalPuntos = 0;
}
