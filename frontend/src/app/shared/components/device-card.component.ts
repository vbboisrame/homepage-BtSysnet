import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Device } from '../../core/models/infrastructure.models';
import { DeviceLabelPipe, LinkLabelPipe } from '../pipes/device.pipes';

@Component({
  selector: 'app-device-card',
  standalone: true,
  imports: [CommonModule, DeviceLabelPipe, LinkLabelPipe],
  template: `
    <div class="device" [ngClass]="'device-' + device.type"
         [class.device-placeholder]="device.status !== 'active'">

      <!-- En-tête : hostname + type -->
      <div class="device-title">{{ device.hostname }}</div>
      <div class="device-model">{{ device.model ?? '—' }}</div>

      @if (device.specs) {
        <div class="device-specs">{{ device.specs }}</div>
      }

      <!-- Liaison physique -->
      @if (device.link_type) {
        <div class="link" [ngClass]="'link-' + device.link_type">
          <span class="link-dot"></span>
          {{ device.link_type | linkLabel }}
        </div>
      }

      <!-- Services -->
      @if (device.services) {
        <div class="service-list">
          @for (svc of serviceList; track svc) {
            <span class="svc">{{ svc }}</span>
          }
        </div>
      }

      <!-- Badge statut "planned" -->
      @if (device.status === 'planned') {
        <div class="status-badge planned">PLANIFIÉ</div>
      }

      <!-- VMs enfants (si cet équipement est un hyperviseur) -->
      @if (device.children && device.children.length > 0) {
        <div class="vms">
          <div class="vms-title">VMs / Conteneurs</div>
          <div class="vm-row">
            @for (vm of device.children; track vm.id) {
              <div class="vm" [ngClass]="'vm-' + vmColor(vm.type)">
                <div class="vm-name">{{ vm.hostname }}</div>
                @if (vm.services) {
                  <div class="service-list">
                    @for (s of vmServices(vm); track s) {
                      <span class="svc">{{ s }}</span>
                    }
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .device {
      background: #111827;
      border-radius: 6px;
      padding: 8px 10px;
      flex: 1;
      border: 1px solid #374151;
    }
    .device-router  { border-color: #0f766e; }
    .device-switch  { border-color: #0369a1; }
    .device-server  { border-color: #6d28d9; }
    .device-nas     { border-color: #b45309; }
    .device-pbs     { border-color: #be123c; }
    .device-ha      { border-color: #0891b2; }
    .device-gns     { border-color: #dc2626; }
    .device-ap      { border-color: #065f46; }
    .device-placeholder { border: 1px dashed #374151; opacity: 0.5; }

    .device-title {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .device-router  .device-title { color: #2dd4bf; }
    .device-switch  .device-title { color: #38bdf8; }
    .device-server  .device-title { color: #a78bfa; }
    .device-nas     .device-title { color: #fbbf24; }
    .device-pbs     .device-title { color: #fb7185; }
    .device-ha      .device-title { color: #22d3ee; }
    .device-gns     .device-title { color: #f87171; }
    .device-ap      .device-title { color: #34d399; }

    .device-model {
      font-size: 10px;
      color: #6b7280;
      margin-bottom: 4px;
      font-family: 'JetBrains Mono', monospace;
    }
    .device-specs {
      font-size: 10px;
      color: #4b5563;
      margin-bottom: 6px;
      line-height: 1.5;
    }
    .service-list {
      display: flex;
      flex-wrap: wrap;
      gap: 2px;
      margin-top: 4px;
    }
    .svc {
      font-size: 9px;
      padding: 1px 5px;
      border-radius: 3px;
      font-family: 'JetBrains Mono', monospace;
      background: #1e293b;
      color: #94a3b8;
    }
    .status-badge {
      display: inline-block;
      margin-top: 4px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 8px;
      padding: 1px 6px;
      border-radius: 3px;
    }
    .status-badge.planned {
      background: #1c2333;
      color: #60a5fa;
      border: 1px solid #1e40af;
    }
    /* VMs */
    .vms {
      margin-top: 6px;
      border-top: 1px solid #1e2d4a;
      padding-top: 6px;
    }
    .vms-title {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9px;
      color: #374151;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 4px;
    }
    .vm-row {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }
    .vm {
      background: #0f172a;
      border-radius: 4px;
      padding: 4px 7px;
      border-left: 2px solid #4b5563;
      min-width: 120px;
    }
    .vm-purple { border-color: #7c3aed; }
    .vm-amber  { border-color: #d97706; }
    .vm-coral  { border-color: #e11d48; }
    .vm-green  { border-color: #059669; }
    .vm-gray   { border-color: #4b5563; }
    .vm-red    { border-color: #dc2626; }
    .vm-name {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9px;
      font-weight: 600;
      color: #94a3b8;
      margin-bottom: 3px;
    }
    .vm-purple .vm-name { color: #a78bfa; }
    .vm-amber  .vm-name { color: #fbbf24; }
    .vm-coral  .vm-name { color: #fb7185; }
    .vm-green  .vm-name { color: #34d399; }
    .vm-red    .vm-name { color: #f87171; }
  `]
})
export class DeviceCardComponent {

  @Input({ required: true }) device!: Device;

  // Découpe la chaîne "Service A · Service B" en tableau
  get serviceList(): string[] {
    return this.device.services
      ? this.device.services.split(' · ').map(s => s.trim())
      : [];
  }

  vmServices(vm: Device): string[] {
    return vm.services
      ? vm.services.split(' · ').map(s => s.trim()).slice(0, 3)
      : [];
  }

  // Couleur de la VM selon son type d'équipement
  vmColor(type: string): string {
    const map: Record<string, string> = {
      server: 'purple',
      nas:    'amber',
      pbs:    'coral',
      ha:     'green',
      gns:    'red',
    };
    return map[type] ?? 'gray';
  }
}
