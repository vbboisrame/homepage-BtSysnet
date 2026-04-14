import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Vlan } from '../../core/models/infrastructure.models';

@Component({
  selector: 'app-vlan-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="vlan-card" [ngClass]="'v' + vlan.number">

      <!-- En-tête coloré selon le numéro de VLAN -->
      <div class="vlan-header">
        <span>VLAN {{ vlan.number }}</span>
        <div class="badges">
          @if (vlan.type === 'intersite') {
            <span class="vlan-badge tag-intersite">inter-sites</span>
          }
          @if (vlan.type === 'local') {
            <span class="vlan-badge tag-local">local</span>
          }
          @if (vlan.type === 'isolated') {
            <span class="vlan-badge tag-local">isolé</span>
          }
          @if (vlan.mtu === 9000) {
            <span class="vlan-badge tag-mtu">MTU 9000</span>
          }
        </div>
      </div>

      <!-- Corps -->
      <div class="vlan-body">
        <div class="vlan-ip">Range : <span>{{ vlan.ip_range }}</span></div>
        <div class="vlan-ip">GW : <span>{{ vlan.gateway }}</span></div>

        @if (vlan.services && vlan.services.length > 0) {
          <div class="vlan-services">
            @for (svc of vlan.services; track svc.id) {
              <div class="vlan-svc-row">
                <div class="vlan-svc-icon" [style.background]="svc.color ?? '#1a1a1a'">
                  {{ svc.icon }}
                </div>
                <span class="vlan-svc-name">{{ svc.name }}</span>
              </div>
            }
          </div>
        }
      </div>

    </div>
  `,
  styles: [`
    .vlan-card {
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid #374151;
    }
    .v10 { border-color: #4c1d95; }
    .v20 { border-color: #78350f; }
    .v30 { border-color: #7f1d1d; }
    .v40 { border-color: #14532d; }
    .v50 { border-color: #134e4a; }
    .v60 { border-color: #374151; }

    .vlan-header {
      padding: 5px 8px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.5px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 2px;
    }
    .v10 .vlan-header { background: #1e0a4a; color: #a78bfa; }
    .v20 .vlan-header { background: #2d1500; color: #fbbf24; }
    .v30 .vlan-header { background: #2d0a0a; color: #fca5a5; }
    .v40 .vlan-header { background: #0a2a15; color: #4ade80; }
    .v50 .vlan-header { background: #0a2525; color: #2dd4bf; }
    .v60 .vlan-header { background: #1a1f2e; color: #9ca3af; }

    .badges { display: flex; gap: 3px; flex-wrap: wrap; }

    .vlan-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 8px;
      padding: 1px 4px;
      border-radius: 2px;
    }

    .vlan-body {
      padding: 6px 8px;
      background: #0a0e1a;
    }
    .vlan-ip {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9px;
      color: #6b7280;
      margin-bottom: 4px;
    }
    .vlan-ip span { color: #94a3b8; }

    .vlan-services {
      display: flex;
      flex-direction: column;
      gap: 2px;
      margin-top: 4px;
    }
    .vlan-svc-row {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 9px;
      padding: 1px 0;
    }
    .vlan-svc-icon {
      width: 14px;
      height: 14px;
      border-radius: 2px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8px;
      font-weight: 700;
      flex-shrink: 0;
      color: white;
    }
    .vlan-svc-name {
      color: #94a3b8;
      font-family: 'JetBrains Mono', monospace;
      font-size: 9px;
    }
  `]
})
export class VlanCardComponent {
  @Input({ required: true }) vlan!: Vlan;
}
