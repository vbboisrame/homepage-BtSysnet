import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Site, Device, Vlan } from '../../core/infrastructure.models';
import { ApiService } from '../../core/api.service';
import { DeviceCardComponent } from './device-card.component';
import { VlanCardComponent } from './vlan-card.component';

@Component({
  selector: 'app-site-panel',
  standalone: true,
  imports: [CommonModule, DeviceCardComponent, VlanCardComponent],
  template: `
    <!-- Panneau d'un site -->
    <div class="site" [ngClass]="siteClass">

      <!-- En-tête du site -->
      <div class="site-header">
        <span class="site-badge">{{ site.code }}</span>
        <span class="site-name">{{ site.name }}</span>
        @if (site.location) {
          <span class="site-location">— {{ site.location }}</span>
        }
      </div>

      <!-- État de chargement -->
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

      <!-- Équipements -->
      @if (!loading && !error) {

        <!-- Routeur + Switch côte à côte -->
        @if (networkDevices.length > 0) {
          <div class="device-row">
            @for (device of networkDevices; track device.id) {
              <app-device-card [device]="device" />
            }
          </div>
        }

        <!-- Bornes Wi-Fi -->
        @if (apDevices.length > 0) {
          <div class="device-row">
            @for (device of apDevices; track device.id) {
              <app-device-card [device]="device" />
            }
          </div>
        }

        <!-- Hyperviseur (avec ses VMs en enfants) -->
        @if (serverDevices.length > 0) {
          <div class="device-row">
            @for (device of serverDevices; track device.id) {
              <app-device-card [device]="device" />
            }
          </div>
        }

        <!-- PBS + NAS + HA -->
        @if (storageDevices.length > 0) {
          <div class="device-row">
            @for (device of storageDevices; track device.id) {
              <app-device-card [device]="device" />
            }
          </div>
        }

        <!-- Plan d'adressage VLAN -->
        @if (vlans.length > 0) {
          <div class="vlan-section">
            <div class="section-title">Plan d'adressage VLAN {{ site.name }}</div>
            <div class="vlan-grid">
              @for (vlan of vlans; track vlan.id) {
                <app-vlan-card [vlan]="vlan" />
              }
            </div>
          </div>
        }

      }
    </div>
  `,
  styles: [`
    .site {
      background: #0d1525;
      border-radius: 10px;
      padding: 14px;
      margin-bottom: 16px;
    }
    .site-lire    { border: 1.5px solid #1d4ed8; }
    .site-evr     { border: 1.5px solid #4b5563; }
    .site-ns      { border: 1.5px dashed #374151; opacity: 0.6; }

    .site-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #1e2d4a;
    }
    .site-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 4px;
      letter-spacing: 1px;
    }
    .site-lire .site-badge { background: #1d3a7a; color: #93c5fd; border: 1px solid #1d4ed8; }
    .site-evr  .site-badge { background: #1f2937; color: #9ca3af; border: 1px solid #374151; }
    .site-ns   .site-badge { background: #1a2535; color: #9ca3af; border: 1px solid #374151; }

    .site-name     { font-size: 13px; font-weight: 600; color: #bfdbfe; }
    .site-lire .site-name { color: #bfdbfe; }
    .site-evr  .site-name { color: #6b7280; }
    .site-location { font-size: 11px; color: #4b5563; }

    .device-row {
      display: flex;
      align-items: stretch;
      gap: 8px;
      margin-bottom: 8px;
    }

    .vlan-section { margin-top: 12px; }
    .vlan-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 6px;
    }

    /* Chargement */
    .loading {
      display: flex;
      gap: 6px;
      padding: 20px;
      justify-content: center;
    }
    .loading-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: #1d4ed8;
      animation: pulse 1.2s infinite ease-in-out;
    }
    .loading-dot:nth-child(2) { animation-delay: 0.2s; }
    .loading-dot:nth-child(3) { animation-delay: 0.4s; }
    @keyframes pulse {
      0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
      40% { opacity: 1; transform: scale(1); }
    }

    .error-msg {
      color: #fb7185;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      padding: 12px;
    }
  `]
})
export class SitePanelComponent implements OnInit {

  @Input({ required: true }) site!: Site;

  private api = inject(ApiService);

  devices: Device[] = [];
  vlans: Vlan[]     = [];
  loading = true;
  error: string | null = null;

  // Filtre les équipements par catégorie pour l'affichage
  get networkDevices(): Device[] {
    return this.devices.filter(d => ['router', 'switch'].includes(d.type));
  }
  get apDevices(): Device[] {
    return this.devices.filter(d => d.type === 'ap');
  }
  get serverDevices(): Device[] {
    // Seulement les équipements racines de type server (hyperviseurs)
    return this.devices.filter(d => d.type === 'server' && !d.parent_id);
  }
  get storageDevices(): Device[] {
    return this.devices.filter(d => ['nas', 'pbs', 'ha', 'gns'].includes(d.type));
  }

  // Classe CSS selon le code du site
  get siteClass(): string {
    return 'site-' + this.site.code.toLowerCase().substring(0, 3);
  }

  ngOnInit(): void {
    // ngOnInit est appelé une fois que le composant est initialisé.
    // C'est ici qu'on charge les données depuis l'API.
    this.api.getSiteDiagram(this.site.id).subscribe({
      next: ({ devices, vlans }) => {
        this.devices = devices;
        this.vlans   = vlans;
        this.loading = false;
      },
      error: (err) => {
        this.error   = err.message ?? 'Erreur inconnue';
        this.loading = false;
      }
    });
  }
}
