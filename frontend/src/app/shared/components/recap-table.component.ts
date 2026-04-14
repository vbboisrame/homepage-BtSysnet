import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Device } from '../../core/models/infrastructure.models';
import { DeviceLabelPipe, LinkLabelPipe, VlanColorPipe } from '../pipes/device.pipes';

@Component({
  selector: 'app-recap-table',
  standalone: true,
  imports: [CommonModule, DeviceLabelPipe, LinkLabelPipe],
  template: `
    <div class="recap-section">
      <div class="section-title">Tableau récapitulatif des équipements</div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Hostname</th>
              <th>Site</th>
              <th>Rôle</th>
              <th>Matériel</th>
              <th>Liaison</th>
              <th>Services</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            @for (device of allDevices; track device.id) {
              <tr [class.row-planned]="device.status === 'planned'">
                <td [ngClass]="'color-' + device.type" class="hostname-cell">
                  {{ device.parent_id ? '↳ ' : '' }}{{ device.hostname }}
                </td>
                <td>{{ device.site_code }}</td>
                <td>{{ device.type | deviceLabel }}</td>
                <td class="model-cell">{{ device.model ?? '—' }}</td>
                <td>
                  @if (device.link_type) {
                    <span class="link" [ngClass]="'link-' + device.link_type">
                      <span class="link-dot"></span>
                      {{ device.link_type | linkLabel }}
                    </span>
                  }
                </td>
                <td class="services-cell">{{ device.services ?? '—' }}</td>
                <td>
                  <span class="status-tag" [ngClass]="'status-' + device.status">
                    {{ device.status }}
                  </span>
                </td>
              </tr>
              <!-- Lignes enfants (VMs) -->
              @if (device.children && device.children.length > 0) {
                @for (vm of device.children; track vm.id) {
                  <tr class="row-vm">
                    <td [ngClass]="'color-' + vm.type" class="hostname-cell">
                      &nbsp;&nbsp;↳ {{ vm.hostname }}
                    </td>
                    <td>{{ vm.site_code }}</td>
                    <td>{{ vm.type | deviceLabel }}</td>
                    <td class="model-cell">{{ vm.model ?? '—' }}</td>
                    <td><span class="via-pve">via PVE</span></td>
                    <td class="services-cell">{{ vm.services ?? '—' }}</td>
                    <td>
                      <span class="status-tag" [ngClass]="'status-' + vm.status">
                        {{ vm.status }}
                      </span>
                    </td>
                  </tr>
                }
              }
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .recap-section { margin-bottom: 16px; }
    .table-wrapper { overflow-x: auto; }

    table {
      width: 100%;
      border-collapse: collapse;
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
    }
    th {
      background: #0f172a;
      color: #60a5fa;
      padding: 6px 10px;
      text-align: left;
      border: 1px solid #1e2d4a;
      font-size: 9px;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    td {
      padding: 5px 10px;
      border: 1px solid #111827;
      color: #94a3b8;
      vertical-align: top;
    }
    tr:nth-child(even) td { background: #0a0e1a; }
    tr:nth-child(odd)  td { background: #0d1220; }
    tr.row-vm td { background: #080c16; opacity: 0.9; }
    tr.row-planned td { opacity: 0.5; }

    .hostname-cell { font-weight: 600; }
    .model-cell    { color: #6b7280; max-width: 200px; }
    .services-cell { color: #6b7280; max-width: 250px; }

    /* Couleurs par type */
    .color-router  { color: #2dd4bf; }
    .color-switch  { color: #38bdf8; }
    .color-server  { color: #a78bfa; }
    .color-nas     { color: #fbbf24; }
    .color-pbs     { color: #fb7185; }
    .color-ha      { color: #22d3ee; }
    .color-gns     { color: #f87171; }
    .color-ap      { color: #34d399; }

    .via-pve {
      font-size: 9px;
      color: #4b5563;
      font-style: italic;
    }

    .status-tag {
      padding: 1px 5px;
      border-radius: 3px;
      font-size: 9px;
    }
    .status-active  { background: #0a2515; color: #4ade80; border: 1px solid #14532d; }
    .status-planned { background: #1c2333; color: #60a5fa; border: 1px solid #1e40af; }
  `]
})
export class RecapTableComponent {

  // On reçoit la liste complète depuis le composant parent
  @Input() devices: Device[] = [];

  // Aplatit l'arbre pour n'avoir que les équipements racines
  // (les VMs sont affichées via device.children dans le template)
  get allDevices(): Device[] {
    return this.devices.filter(d => !d.parent_id);
  }
}
