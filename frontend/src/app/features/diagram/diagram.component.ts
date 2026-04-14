import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { Site, Device, Vlan } from '../../core/infrastructure.models';
import { SitePanelComponent } from '../../shared/components/site-panel.component';
import { RecapTableComponent } from '../../shared/components/recap-table.component';
import { VlanCardComponent } from '../../shared/components/vlan-card.component';

@Component({
  selector: 'app-diagram',
  standalone: true,
  imports: [CommonModule, SitePanelComponent, RecapTableComponent, VlanCardComponent],
  template: `
    <!-- WireGuard bridge inter-sites -->
    @if (activeSites.length >= 2) {
      <div class="wg-bridge">
        @for (site of activeSites; track site.id; let last = $last) {
          <div class="wg-box">
            <div class="wg-box-title">{{ site.code }}-RTR-001</div>
            <div class="wg-box-sub">WireGuard · {{ site.wg_ip ?? '—' }}</div>
          </div>
          @if (!last) {
            <div class="wg-separator">
              <div class="wg-line"></div>
              <span class="wg-ip">VPN WireGuard · AES-256</span>
              <div class="wg-line"></div>
            </div>
          }
        }
      </div>
    }

    <!-- Grille des sites -->
    @if (loading) {
      <div class="global-loading">
        <div class="spinner"></div>
        <span>Chargement de l'infrastructure...</span>
      </div>
    }

    @if (error) {
      <div class="global-error">
        <span>⚠</span>
        <div>
          <strong>Impossible de contacter l'API</strong><br>
          {{ error }}<br>
          <small>Vérifiez que le backend tourne sur le port 3000</small>
        </div>
      </div>
    }

    @if (!loading && !error) {
      <div class="main-grid">
        @for (site of activeSites; track site.id) {
          <app-site-panel [site]="site" (vlansLoaded)="onVlansLoaded($event)" />
        }
      </div>

      <!-- Plans d'adressage VLAN -->
      @if (vlansData.length > 0) {
        <div class="vlan-section-global">
          @for (entry of vlansData; track entry.site.id) {
            <div class="vlan-site-block">
              <div class="vlan-site-title">
                <span class="vlan-site-badge site-badge-{{ entry.site.code.toLowerCase() }}">{{ entry.site.code }}</span>
                Plan d'adressage VLAN — {{ entry.site.name }}
              </div>
              <div class="vlan-grid">
                @for (vlan of entry.vlans; track vlan.id) {
                  <app-vlan-card [vlan]="vlan" />
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- Tableau récapitulatif -->
      <app-recap-table [devices]="allDevices" />

      <!-- Légende -->
      <footer class="diagram-footer">
        <div class="legend-group">
          <div class="legend-title">Liaisons physiques</div>
          <div class="legend-items">
            <span class="legend-item">
              <span class="legend-dot" style="background:#4ade80"></span>
              Fibre OM4 10G SFP+
            </span>
            <span class="legend-item">
              <span class="legend-dot" style="background:#c084fc"></span>
              RJ45 1G × 4 LACP
            </span>
            <span class="legend-item">
              <span class="legend-dot" style="background:#a78bfa"></span>
              RJ45 1G
            </span>
          </div>
        </div>
        <div class="legend-group">
          <div class="legend-title">Types de VLANs</div>
          <div class="legend-items">
            <span class="tag tag-intersite">inter-sites</span> routé via WireGuard &nbsp;
            <span class="tag tag-local">local</span> isolation par site &nbsp;
            <span class="tag tag-mtu">MTU 9000</span> jumbo frames
          </div>
        </div>
        <div class="legend-group">
          <div class="legend-title">Technologies</div>
          <div class="legend-items">
            <span class="legend-item">
              <span class="legend-dot" style="background:#60a5fa"></span>Proxmox VE
            </span>
            <span class="legend-item">
              <span class="legend-dot" style="background:#2496ed"></span>Docker
            </span>
            <span class="legend-item">
              <span class="legend-dot" style="background:#1d4ed8"></span>WireGuard VPN
            </span>
          </div>
        </div>
      </footer>
    }
  `,
  styles: [`
    /* WireGuard bridge */
    .wg-bridge {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0;
      padding: 10px 20px;
      background: #0d1525;
      border: 1px dashed #1e3a5f;
      border-radius: 8px;
      margin-bottom: 16px;
    }
    .wg-box {
      background: #111827;
      border: 1px solid #1d4ed8;
      border-radius: 6px;
      padding: 6px 14px;
      text-align: center;
    }
    .wg-box-title {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 700;
      color: #60a5fa;
      letter-spacing: 1px;
    }
    .wg-box-sub {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9px;
      color: #4b6a9c;
      margin-top: 2px;
    }
    .wg-separator {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 8px;
    }
    .wg-line {
      width: 60px;
      height: 1px;
      background: repeating-linear-gradient(
        90deg, #1d4ed8 0px, #1d4ed8 6px, transparent 6px, transparent 12px
      );
    }
    .wg-ip {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9px;
      color: #4b6a9c;
      white-space: nowrap;
    }

    /* Grille sites */
    .main-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }

    /* Plans d'adressage VLAN */
    .vlan-section-global {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 16px;
    }
    .vlan-site-block {
      background: #0d1525;
      border-radius: 10px;
      padding: 14px;
      border: 1px solid #1e2d4a;
    }
    .vlan-site-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 10px;
      padding-bottom: 8px;
      border-bottom: 1px solid #1e2d4a;
    }
    .vlan-site-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 4px;
      letter-spacing: 1px;
    }
    .site-badge-lir { background: #1d3a7a; color: #93c5fd; border: 1px solid #1d4ed8; }
    .site-badge-evr { background: #1f2937; color: #9ca3af; border: 1px solid #374151; }
    .vlan-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 6px;
    }

    /* États globaux */
    .global-loading {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 40px;
      justify-content: center;
      color: #60a5fa;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
    }
    .spinner {
      width: 20px; height: 20px;
      border: 2px solid #1e2d4a;
      border-top-color: #60a5fa;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .global-error {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px 20px;
      background: #1a0a0a;
      border: 1px solid #7f1d1d;
      border-radius: 8px;
      color: #fca5a5;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      margin-bottom: 16px;
    }
    .global-error span { font-size: 20px; }
    .global-error small { color: #6b7280; }

    /* Légende footer */
    .diagram-footer {
      display: flex;
      gap: 32px;
      padding: 12px 16px;
      background: #0d1525;
      border: 1px solid #1e2d4a;
      border-radius: 8px;
      margin-top: 8px;
      flex-wrap: wrap;
    }
    .legend-title {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9px;
      color: #4b6a9c;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 6px;
    }
    .legend-items {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      color: #6b7280;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .legend-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      display: inline-block;
      flex-shrink: 0;
    }
  `]
})
export class DiagramComponent implements OnInit {

  private api = inject(ApiService);

  sites: Site[]     = [];
  allDevices: Device[] = [];
  vlansData: { site: Site; vlans: Vlan[] }[] = [];
  loading = true;
  error: string | null = null;

  get activeSites(): Site[] {
    return this.sites.filter(s => s.status === 'active');
  }

  onVlansLoaded(event: { site: Site; vlans: Vlan[] }): void {
    // Remplace l'entrée si elle existe déjà (rechargement), sinon ajoute
    const idx = this.vlansData.findIndex(e => e.site.id === event.site.id);
    if (idx >= 0) {
      this.vlansData[idx] = event;
    } else {
      this.vlansData.push(event);
    }
    // Trie dans le même ordre que les sites actifs
    this.vlansData.sort((a, b) =>
      this.activeSites.findIndex(s => s.id === a.site.id) -
      this.activeSites.findIndex(s => s.id === b.site.id)
    );
  }

  ngOnInit(): void {
    // On charge d'abord la liste des sites,
    // puis on charge tous les équipements pour le tableau récap
    forkJoin({
      sites:   this.api.getSites(),
      devices: this.api.getAllDevices()
    }).subscribe({
      next: ({ sites, devices }) => {
        this.sites      = sites;
        this.allDevices = devices;
        this.loading    = false;
      },
      error: (err) => {
        this.error   = err.message ?? 'Erreur de connexion à l\'API';
        this.loading = false;
      }
    });
  }
}
