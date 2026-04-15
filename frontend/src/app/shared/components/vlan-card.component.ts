import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Vlan } from '../../core/infrastructure.models';
import { AuthService } from '../../core/auth.service';
import { DrawerService } from '../../core/drawer.service';
import { ApiService } from '../../core/api.service';

@Component({
  selector: 'app-vlan-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="vlan-card" [ngClass]="'v' + vlan.number">

      <div class="vlan-header">
        <span>VLAN {{ vlan.number }}</span>
        <div class="header-right">
          <div class="badges">
            @if (vlan.type === 'intersite') { <span class="vlan-badge tag-intersite">inter-sites</span> }
            @if (vlan.type === 'local')     { <span class="vlan-badge tag-local">local</span> }
            @if (vlan.type === 'isolated')  { <span class="vlan-badge tag-local">isolé</span> }
            @if (vlan.mtu === 9000)         { <span class="vlan-badge tag-mtu">MTU 9000</span> }
          </div>
          @if (auth.isLoggedIn()) {
            <div class="admin-btns">
              <button class="btn-edit" (click)="edit()" title="Modifier">✏</button>
              @if (!confirmingDelete) {
                <button class="btn-delete" (click)="confirmingDelete = true" title="Supprimer">🗑</button>
              } @else {
                <button class="btn-delete-confirm" (click)="deleteVlan()">Oui</button>
                <button class="btn-delete-cancel" (click)="confirmingDelete = false">Non</button>
              }
            </div>
          }
        </div>
      </div>

      <div class="vlan-body">
        <div class="vlan-ip">Range : <span>{{ vlan.ip_range }}</span></div>
        <div class="vlan-ip">GW : <span>{{ vlan.gateway }}</span></div>

        @if (vlan.services && vlan.services.length > 0) {
          <div class="vlan-services">
            @for (svc of vlan.services; track svc.id) {
              <div class="vlan-svc-row">
                <div class="vlan-svc-icon" [style.background]="svc.color ?? '#1a1a1a'">{{ svc.icon }}</div>
                <span class="vlan-svc-name">{{ svc.name }}</span>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .vlan-card { border-radius: 6px; overflow: hidden; border: 1px solid #374151; }
    .v10 { border-color: #4c1d95; }
    .v20 { border-color: #78350f; }
    .v30 { border-color: #7f1d1d; }
    .v40 { border-color: #14532d; }
    .v50 { border-color: #134e4a; }
    .v60 { border-color: #374151; }

    .vlan-header {
      padding: 5px 8px;
      font-family: 'JetBrains Mono', monospace; font-size: 9px; font-weight: 700;
      letter-spacing: 0.5px;
      display: flex; justify-content: space-between; align-items: center;
      flex-wrap: wrap; gap: 2px;
    }
    .v10 .vlan-header { background: #1e0a4a; color: #a78bfa; }
    .v20 .vlan-header { background: #2d1500; color: #fbbf24; }
    .v30 .vlan-header { background: #2d0a0a; color: #fca5a5; }
    .v40 .vlan-header { background: #0a2a15; color: #4ade80; }
    .v50 .vlan-header { background: #0a2525; color: #2dd4bf; }
    .v60 .vlan-header { background: #1a1f2e; color: #9ca3af; }

    .header-right { display: flex; align-items: center; gap: 4px; }
    .badges { display: flex; gap: 3px; flex-wrap: wrap; }

    /* Boutons admin (visibles au hover) */
    .admin-btns { display: flex; gap: 2px; opacity: 0; transition: opacity 0.15s; }
    .vlan-card:hover .admin-btns { opacity: 1; }
    .btn-edit, .btn-delete {
      background: none; border: none; cursor: pointer;
      font-size: 9px; padding: 1px 2px; border-radius: 2px; line-height: 1;
    }
    .btn-edit:hover  { background: rgba(255,255,255,0.1); }
    .btn-delete:hover { background: rgba(255,0,0,0.2); }
    .btn-delete-confirm {
      background: #7f1d1d; border: none; border-radius: 2px;
      color: #fca5a5; font-family: 'JetBrains Mono', monospace; font-size: 7px;
      padding: 1px 4px; cursor: pointer;
    }
    .btn-delete-cancel {
      background: rgba(255,255,255,0.1); border: none; border-radius: 2px;
      color: #9ca3af; font-family: 'JetBrains Mono', monospace; font-size: 7px;
      padding: 1px 4px; cursor: pointer;
    }

    .vlan-badge { font-family: 'JetBrains Mono', monospace; font-size: 8px; padding: 1px 4px; border-radius: 2px; }

    .vlan-body { padding: 6px 8px; background: #0a0e1a; }
    .vlan-ip { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: #6b7280; margin-bottom: 4px; }
    .vlan-ip span { color: #94a3b8; }

    .vlan-services { display: flex; flex-direction: column; gap: 2px; margin-top: 4px; }
    .vlan-svc-row { display: flex; align-items: center; gap: 4px; font-size: 9px; padding: 1px 0; }
    .vlan-svc-icon {
      width: 14px; height: 14px; border-radius: 2px;
      display: flex; align-items: center; justify-content: center;
      font-size: 8px; font-weight: 700; flex-shrink: 0; color: white;
    }
    .vlan-svc-name { color: #94a3b8; font-family: 'JetBrains Mono', monospace; font-size: 9px; }
  `]
})
export class VlanCardComponent {

  @Input({ required: true }) vlan!: Vlan;

  auth    = inject(AuthService);
  private drawer = inject(DrawerService);
  private api    = inject(ApiService);

  confirmingDelete = false;

  edit(): void {
    this.drawer.open('vlan', 'edit', this.vlan);
  }

  deleteVlan(): void {
    this.api.deleteVlan(this.vlan.id).subscribe({
      next: () => this.drawer.notifySaved('vlan'),
      error: () => { this.confirmingDelete = false; }
    });
  }
}
