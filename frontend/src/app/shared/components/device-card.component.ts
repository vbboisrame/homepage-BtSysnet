import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Device } from '../../core/infrastructure.models';
import { DeviceLabelPipe, LinkLabelPipe, VlanColorPipe } from '../device.pipes';
import { AuthService } from '../../core/auth.service';
import { DrawerService } from '../../core/drawer.service';
import { ApiService } from '../../core/api.service';

@Component({
  selector: 'app-device-card',
  standalone: true,
  imports: [CommonModule, DeviceLabelPipe, LinkLabelPipe, VlanColorPipe],
  template: `
    <div class="device" [ngClass]="'device-' + device.type"
         [class.device-placeholder]="device.status !== 'active'">

      <!-- En-tête : hostname + boutons admin -->
      <div class="device-head">
        <div class="device-title">{{ device.hostname }}</div>
        @if (auth.isLoggedIn()) {
          <div class="admin-btns">
            <button class="btn-edit" (click)="edit()" title="Modifier">✏</button>
            @if (!confirmingDelete) {
              <button class="btn-delete" (click)="confirmingDelete = true" title="Supprimer">🗑</button>
            } @else {
              <button class="btn-delete-confirm" (click)="deleteDevice()">Oui</button>
              <button class="btn-delete-cancel" (click)="confirmingDelete = false">Non</button>
            }
          </div>
        }
      </div>

      <div class="device-model">{{ device.model ?? '—' }}</div>

      @if (device.specs) {
        <div class="device-specs">{{ device.specs }}</div>
      }

      @if (device.link_type) {
        <div class="link" [ngClass]="'link-' + device.link_type">
          <span class="link-dot"></span>
          {{ device.link_type | linkLabel }}
        </div>
      }

      @if (device.services) {
        <div class="service-list">
          @for (svc of serviceList; track svc) {
            <span class="svc" [style.background]="svcColor(svc).bg" [style.color]="svcColor(svc).text">{{ svc }}</span>
          }
        </div>
      }

      @if (device.status === 'planned') {
        <div class="status-badge planned">PLANIFIÉ</div>
      }

      <!-- VMs enfants -->
      @if (device.children && device.children.length > 0) {
        <div class="vms">
          <div class="vms-title">VMs / Conteneurs</div>
          @if (auth.isLoggedIn() && (device.type === 'server' || device.type === 'nas')) {
            <button class="btn-add-vm" (click)="addVm()">+ VM</button>
          }
          <div class="vm-row">
            @for (vm of device.children; track vm.id) {
              <div class="vm" [style.border-left-color]="vm.vlans?.[0] | vlanColor">
                <div class="vm-head">
                  <div class="vm-name" [style.color]="vm.vlans?.[0] | vlanColor">{{ vm.hostname }}</div>
                  @if (auth.isLoggedIn()) {
                    <div class="admin-btns-sm">
                      <button class="btn-edit-sm" (click)="editVm(vm)" title="Modifier">✏</button>
                      @if (confirmingDeleteVmId !== vm.id) {
                        <button class="btn-delete-sm" (click)="confirmingDeleteVmId = vm.id" title="Supprimer">🗑</button>
                      } @else {
                        <button class="btn-delete-confirm-sm" (click)="deleteVm(vm)">Oui</button>
                        <button class="btn-delete-cancel-sm" (click)="confirmingDeleteVmId = null">Non</button>
                      }
                    </div>
                  }
                </div>
                @if (vm.model) { <div class="vm-model">{{ vm.model }}</div> }
                @if (vm.specs) { <div class="vm-specs">{{ vm.specs }}</div> }
                @if (vm.services) {
                  <div class="service-list">
                    @for (s of vmServices(vm); track s) {
                      <span class="svc" [style.background]="svcColor(s).bg" [style.color]="svcColor(s).text">{{ s }}</span>
                    }
                  </div>
                }
                @if (vm.vlans && vm.vlans.length > 0) {
                  <div class="vm-vlans">
                    @for (vlan of vm.vlans; track vlan) {
                      <span class="vm-vlan-badge" [style.background]="vlan | vlanColor">VLAN {{ vlan }}</span>
                    }
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }

      @if (auth.isLoggedIn() && !device.parent_id && (device.type === 'server' || device.type === 'nas') && (!device.children || device.children.length === 0)) {
        <button class="btn-add-vm" (click)="addVm()">+ VM</button>
      }
    </div>
  `,
  styles: [`
    .device {
      background: #111827; border-radius: 6px; padding: 8px 10px;
      flex: 1; border: 1px solid #374151;
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

    /* En-tête avec boutons admin */
    .device-head {
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: 4px; margin-bottom: 2px;
    }
    .admin-btns {
      display: flex; gap: 2px; flex-shrink: 0;
      opacity: 0; transition: opacity 0.15s;
    }
    .device:hover .admin-btns { opacity: 1; }
    .btn-edit, .btn-delete {
      background: none; border: none; cursor: pointer;
      font-size: 10px; padding: 1px 3px; border-radius: 3px; line-height: 1;
    }
    .btn-edit:hover  { background: #1e2d4a; }
    .btn-delete:hover { background: #2d1010; }
    .btn-delete-confirm {
      background: #7f1d1d; border: none; border-radius: 3px;
      color: #fca5a5; font-family: 'JetBrains Mono', monospace; font-size: 8px;
      padding: 1px 5px; cursor: pointer;
    }
    .btn-delete-confirm:hover { background: #991b1b; }
    .btn-delete-cancel {
      background: #1f2937; border: none; border-radius: 3px;
      color: #9ca3af; font-family: 'JetBrains Mono', monospace; font-size: 8px;
      padding: 1px 5px; cursor: pointer;
    }

    .device-title {
      font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700;
      letter-spacing: 0.5px;
    }
    .device-router  .device-title { color: #2dd4bf; }
    .device-switch  .device-title { color: #38bdf8; }
    .device-server  .device-title { color: #a78bfa; }
    .device-nas     .device-title { color: #fbbf24; }
    .device-pbs     .device-title { color: #fb7185; }
    .device-ha      .device-title { color: #22d3ee; }
    .device-gns     .device-title { color: #f87171; }
    .device-ap      .device-title { color: #34d399; }

    .device-model { font-size: 10px; color: #6b7280; margin-bottom: 4px; font-family: 'JetBrains Mono', monospace; }
    .device-specs { font-size: 10px; color: #4b5563; margin-bottom: 6px; line-height: 1.5; }
    .service-list { display: flex; flex-wrap: wrap; gap: 2px; margin-top: 4px; }
    .svc {
      font-size: 9px; padding: 1px 5px; border-radius: 3px;
      font-family: 'JetBrains Mono', monospace;
    }
    .status-badge {
      display: inline-block; margin-top: 4px;
      font-family: 'JetBrains Mono', monospace; font-size: 8px;
      padding: 1px 6px; border-radius: 3px;
    }
    .status-badge.planned { background: #1c2333; color: #60a5fa; border: 1px solid #1e40af; }

    /* VMs */
    .vms { margin-top: 6px; border-top: 1px solid #1e2d4a; padding-top: 6px; }
    .vms-title {
      font-family: 'JetBrains Mono', monospace; font-size: 9px; color: #374151;
      text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;
    }
    .vm-row { display: flex; gap: 4px; flex-wrap: wrap; }
    .vm {
      background: #0f172a; border-radius: 4px; padding: 4px 7px;
      border-left: 2px solid #4b5563; min-width: 120px;
    }
    .vm-head { display: flex; align-items: flex-start; justify-content: space-between; }
    .admin-btns-sm { opacity: 0; transition: opacity 0.15s; }
    .vm:hover .admin-btns-sm { opacity: 1; }
    .btn-edit-sm {
      background: none; border: none; cursor: pointer;
      font-size: 9px; padding: 0 2px; border-radius: 2px;
    }
    .btn-edit-sm:hover { background: #1e2d4a; }
    .vm-name { font-family: 'JetBrains Mono', monospace; font-size: 9px; font-weight: 600; margin-bottom: 3px; }
    .vm-model { font-family: 'JetBrains Mono', monospace; font-size: 8px; color: #4b5563; margin-bottom: 2px; }
    .vm-specs  { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: #6b7280; margin-bottom: 4px; }
    .vm-vlans { display: flex; gap: 3px; flex-wrap: wrap; margin-top: 5px; }
    .vm-vlan-badge {
      font-family: 'JetBrains Mono', monospace; font-size: 8px; font-weight: 700;
      padding: 1px 5px; border-radius: 3px; color: #fff; opacity: 0.85;
    }
    .btn-delete-sm {
      background: none; border: none; cursor: pointer;
      font-size: 9px; padding: 0 2px; border-radius: 2px;
    }
    .btn-delete-sm:hover { background: #2d1010; }
    .btn-delete-confirm-sm {
      background: #7f1d1d; border: none; border-radius: 3px;
      color: #fca5a5; font-family: 'JetBrains Mono', monospace; font-size: 8px;
      padding: 1px 4px; cursor: pointer;
    }
    .btn-delete-confirm-sm:hover { background: #991b1b; }
    .btn-delete-cancel-sm {
      background: #1f2937; border: none; border-radius: 3px;
      color: #9ca3af; font-family: 'JetBrains Mono', monospace; font-size: 8px;
      padding: 1px 4px; cursor: pointer;
    }
    .btn-add-vm {
      background: none; border: 1px dashed #1e3a5f;
      border-radius: 4px; padding: 2px 8px; margin-bottom: 4px;
      color: #4b6a9c; font-family: 'JetBrains Mono', monospace; font-size: 8px;
      cursor: pointer; width: 100%;
    }
    .btn-add-vm:hover { border-color: #3b82f6; color: #60a5fa; background: #0d1e35; }
  `]
})
export class DeviceCardComponent {

  @Input({ required: true }) device!: Device;

  auth    = inject(AuthService);
  private drawer  = inject(DrawerService);
  private api     = inject(ApiService);

  confirmingDelete = false;
  confirmingDeleteVmId: number | null = null;

  get serviceList(): string[] {
    return this.device.services ? this.device.services.split(' · ').map(s => s.trim()) : [];
  }

  vmServices(vm: Device): string[] {
    return vm.services ? vm.services.split(' · ').map(s => s.trim()).slice(0, 3) : [];
  }

  edit(): void {
    this.drawer.open('device', 'edit', this.device);
  }

  editVm(vm: Device): void {
    this.drawer.open('device', 'edit', vm);
  }

  deleteDevice(): void {
    this.api.deleteDevice(this.device.id).subscribe({
      next: () => this.drawer.notifySaved('device'),
      error: () => { this.confirmingDelete = false; }
    });
  }

  deleteVm(vm: Device): void {
    this.api.deleteDevice(vm.id).subscribe({
      next: () => this.drawer.notifySaved('device'),
      error: () => { this.confirmingDeleteVmId = null; }
    });
  }

  addVm(): void {
    this.drawer.open('device', 'create', null, { siteId: this.device.site_id, parentId: this.device.id });
  }

  private static readonly SVC_COLORS: Record<string, { bg: string; text: string }> = {
    'Frigate':                  { bg: '#052e16', text: '#4ade80' },
    'Frigate NVR':              { bg: '#052e16', text: '#4ade80' },
    'Home Assistant OS':        { bg: '#0c1a2e', text: '#22d3ee' },
    'Home Assistant':           { bg: '#0c1a2e', text: '#22d3ee' },
    'Proxmox VE':               { bg: '#1a1a1a', text: '#f97316' },
    'Proxmox Backup Server':    { bg: '#1a1a1a', text: '#fb7185' },
    'Docker':                   { bg: '#0c2233', text: '#38bdf8' },
    'Portainer':                { bg: '#0c1a10', text: '#34d399' },
    'Portainer Agent':          { bg: '#0c1a10', text: '#34d399' },
    'Nginx Proxy Manager':      { bg: '#1a1a1a', text: '#94a3b8' },
    'Authentik':                { bg: '#2d1b69', text: '#c4b5fd' },
    'WireGuard':                { bg: '#1a2233', text: '#60a5fa' },
    'TrueNAS':                  { bg: '#0a2040', text: '#38bdf8' },
    'GNS3':                     { bg: '#2a0a0a', text: '#f87171' },
  };

  svcColor(svc: string): { bg: string; text: string } {
    return DeviceCardComponent.SVC_COLORS[svc] ?? { bg: '#1e293b', text: '#94a3b8' };
  }
}
