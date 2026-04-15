import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { Site, Device, Vlan } from '../../core/infrastructure.models';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { DrawerService } from '../../core/drawer.service';
import { DeviceCardComponent } from './device-card.component';

@Component({
  selector: 'app-site-panel',
  standalone: true,
  imports: [CommonModule, DeviceCardComponent],
  template: `
    <div class="site" [ngClass]="siteClass">

      <!-- En-tête -->
      <div class="site-header">
        <span class="site-badge">{{ site.code }}</span>
        <span class="site-name">{{ site.name }}</span>
        @if (site.location) { <span class="site-location">— {{ site.location }}</span> }
        @if (auth.isLoggedIn()) {
          <div class="site-admin-btns">
            <button class="btn-site-edit" (click)="editSite()" title="Modifier le site">✏ Site</button>
          </div>
        }
      </div>

      @if (loading) {
        <div class="loading">
          <span class="loading-dot"></span>
          <span class="loading-dot"></span>
          <span class="loading-dot"></span>
        </div>
      }

      @if (error) {
        <div class="error-msg">⚠ Erreur de chargement : {{ error }}</div>
      }

      @if (!loading && !error) {

        @if (networkDevices.length > 0) {
          <div class="device-row">
            @for (device of networkDevices; track device.id) {
              <app-device-card [device]="device" />
            }
          </div>
        }

        @if (apDevices.length > 0) {
          <div class="device-row">
            @for (device of apDevices; track device.id) {
              <app-device-card [device]="device" />
            }
          </div>
        }

        @if (serverDevices.length > 0) {
          <div class="device-row">
            @for (device of serverDevices; track device.id) {
              <app-device-card [device]="device" />
            }
          </div>
        }

        @if (storageDevices.length > 0) {
          <div class="device-row">
            @for (device of storageDevices; track device.id) {
              <app-device-card [device]="device" />
            }
          </div>
        }

        <!-- Boutons admin -->
        @if (auth.isLoggedIn()) {
          <div class="add-btns">
            <button class="btn-add" (click)="addDevice()">+ Équipement</button>
            <button class="btn-add" (click)="addVlan()">+ VLAN</button>
          </div>
        }

      }
    </div>
  `,
  styles: [`
    .site { background: #0d1525; border-radius: 10px; padding: 14px; margin-bottom: 16px; }
    .site-lir { border: 1.5px solid #1d4ed8; }
    .site-evr { border: 1.5px solid #4b5563; }
    .site-ns  { border: 1.5px dashed #374151; opacity: 0.6; }

    .site-header {
      display: flex; align-items: center; gap: 8px;
      margin-bottom: 12px; padding-bottom: 8px;
      border-bottom: 1px solid #1e2d4a;
    }
    .site-badge {
      font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700;
      padding: 3px 10px; border-radius: 4px; letter-spacing: 1px;
    }
    .site-lir .site-badge { background: #1d3a7a; color: #93c5fd; border: 1px solid #1d4ed8; }
    .site-evr .site-badge { background: #1f2937; color: #9ca3af; border: 1px solid #374151; }
    .site-ns  .site-badge { background: #1a2535; color: #9ca3af; border: 1px solid #374151; }

    .site-name     { font-size: 13px; font-weight: 600; }
    .site-lir .site-name { color: #bfdbfe; }
    .site-evr .site-name { color: #6b7280; }
    .site-location { font-size: 11px; color: #4b5563; }

    .site-admin-btns { margin-left: auto; }
    .btn-site-edit {
      background: none; border: 1px solid #1e2d4a; border-radius: 4px;
      color: #4b6a9c; font-family: 'JetBrains Mono', monospace; font-size: 9px;
      padding: 2px 8px; cursor: pointer;
    }
    .btn-site-edit:hover { background: #1e2d4a; color: #60a5fa; }

    .device-row { display: flex; align-items: stretch; gap: 8px; margin-bottom: 8px; }

    /* Boutons ajouter */
    .add-btns { display: flex; gap: 6px; margin-top: 10px; padding-top: 10px; border-top: 1px dashed #1e2d4a; }
    .btn-add {
      background: none; border: 1px dashed #1e3a5f;
      border-radius: 5px; padding: 5px 12px;
      color: #4b6a9c; font-family: 'JetBrains Mono', monospace; font-size: 10px;
      cursor: pointer; transition: all 0.15s;
    }
    .btn-add:hover { background: #0d1e35; color: #60a5fa; border-color: #3b82f6; }

    /* Chargement */
    .loading { display: flex; gap: 6px; padding: 20px; justify-content: center; }
    .loading-dot {
      width: 8px; height: 8px; border-radius: 50%; background: #1d4ed8;
      animation: pulse 1.2s infinite ease-in-out;
    }
    .loading-dot:nth-child(2) { animation-delay: 0.2s; }
    .loading-dot:nth-child(3) { animation-delay: 0.4s; }
    @keyframes pulse {
      0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
      40% { opacity: 1; transform: scale(1); }
    }
    .error-msg { color: #fb7185; font-family: 'JetBrains Mono', monospace; font-size: 11px; padding: 12px; }
  `]
})
export class SitePanelComponent implements OnInit, OnDestroy {

  @Input({ required: true }) site!: Site;
  @Output() vlansLoaded = new EventEmitter<{ site: Site; vlans: Vlan[] }>();

  private api    = inject(ApiService);
  auth           = inject(AuthService);
  private drawer = inject(DrawerService);

  devices: Device[] = [];
  loading = true;
  error: string | null = null;

  private sub?: Subscription;

  get networkDevices(): Device[] { return this.devices.filter(d => ['router', 'switch'].includes(d.type)); }
  get apDevices():      Device[] { return this.devices.filter(d => d.type === 'ap'); }
  get serverDevices():  Device[] { return this.devices.filter(d => (d.type === 'server' || d.type === 'hypervisor') && !d.parent_id); }
  get storageDevices(): Device[] { return this.devices.filter(d => ['nas', 'pbs', 'ha', 'gns'].includes(d.type)); }

  get siteClass(): string { return 'site-' + this.site.code.toLowerCase().substring(0, 3); }

  ngOnInit(): void {
    this.load();
    // Rechargement après toute sauvegarde de device ou vlan
    this.sub = this.drawer.saved$.subscribe((entity: string) => {
      if (entity === 'device' || entity === 'vlan') this.load();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private load(): void {
    this.api.getSiteDiagram(this.site.id).subscribe({
      next: ({ devices, vlans }: { devices: Device[]; vlans: Vlan[] }) => {
        this.devices = devices;
        this.vlansLoaded.emit({ site: this.site, vlans });
        this.loading = false;
      },
      error: (err: Error) => {
        this.error   = err.message ?? 'Erreur inconnue';
        this.loading = false;
      }
    });
  }

  addDevice(): void { this.drawer.open('device', 'create', null, { siteId: this.site.id }); }
  addVlan():   void { this.drawer.open('vlan',   'create', null, { siteId: this.site.id }); }
  editSite():  void { this.drawer.open('site',   'edit',   this.site); }
}
