import { Component, OnInit, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { DrawerService } from '../../core/drawer.service';
import { Device, DeviceType, LinkType, Site } from '../../core/infrastructure.models';

@Component({
  selector: 'app-device-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" class="form">

      <!-- Hostname -->
      <div class="field">
        <label class="label">Hostname *</label>
        <input formControlName="hostname" class="input" placeholder="LIR-SW-002" />
        @if (form.get('hostname')?.invalid && form.get('hostname')?.touched) {
          <span class="field-error">Obligatoire</span>
        }
      </div>

      <!-- Type -->
      <div class="field">
        <label class="label">Type *</label>
        <select formControlName="type" class="input">
          <option value="router">Routeur</option>
          <option value="switch">Switch</option>
          <option value="server">Serveur / VM</option>
          <option value="hypervisor">Hyperviseur (Proxmox…)</option>
          <option value="nas">NAS / Stockage</option>
          <option value="pbs">Backup Server</option>
          <option value="ha">Domotique (HA)</option>
          <option value="gns">LAB réseau (GNS3)</option>
          <option value="ap">Borne Wi-Fi</option>
          <option value="placeholder">À venir</option>
        </select>
      </div>

      <!-- Modèle -->
      <div class="field">
        <label class="label">Modèle</label>
        <input formControlName="model" class="input" placeholder="MikroTik RB4011..." />
      </div>

      <!-- Specs -->
      <div class="field">
        <label class="label">Spécifications</label>
        <textarea formControlName="specs" class="input textarea" rows="2"
          placeholder="2 vCPU · 8 Go RAM · SSD 256 Go"></textarea>
      </div>

      <!-- Liaison physique -->
      <div class="field">
        <label class="label">Liaison physique</label>
        <select formControlName="link_type" class="input">
          <option value="fiber">Fibre OM4 SFP+ 10G</option>
          <option value="sfp">SFP+ 10G</option>
          <option value="rj45">RJ45 1G</option>
          <option value="rj45-4x">4× RJ45 1G LACP</option>
        </select>
      </div>

      <!-- Services -->
      <div class="field">
        <label class="label">Services <span class="hint">(séparés par " · ")</span></label>
        <input formControlName="services" class="input" placeholder="Docker · Portainer · Nginx Proxy Manager" />
      </div>

      <!-- Site -->
      <div class="field">
        <label class="label">Site *</label>
        <select formControlName="site_id" class="input">
          @for (site of sites; track site.id) {
            <option [value]="site.id">{{ site.code }} — {{ site.name }}</option>
          }
        </select>
      </div>

      <!-- Parent (VM) -->
      <div class="field">
        <label class="label">Hébergé sur (hyperviseur)</label>
        <select formControlName="parent_id" class="input">
          <option [value]="null">— Aucun (équipement physique) —</option>
          @for (d of serverDevices; track d.id) {
            <option [value]="d.id">{{ d.hostname }}</option>
          }
        </select>
      </div>

      <!-- Statut -->
      <div class="field">
        <label class="label">Statut</label>
        <select formControlName="status" class="input">
          <option value="active">Actif</option>
          <option value="planned">Planifié</option>
          <option value="placeholder">À venir</option>
        </select>
      </div>

      @if (error) {
        <div class="form-error">{{ error }}</div>
      }

      <div class="form-actions">
        <button type="button" class="btn-cancel" (click)="drawer.close()">Annuler</button>
        <button type="submit" class="btn-save" [disabled]="form.invalid || loading">
          {{ loading ? 'Enregistrement...' : (mode() === 'edit' ? 'Modifier' : 'Créer') }}
        </button>
      </div>
    </form>
  `,
  styles: [`
    .form { display: flex; flex-direction: column; gap: 14px; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .label {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px; color: #4b6a9c;
      text-transform: uppercase; letter-spacing: 1px;
    }
    .hint { color: #374151; font-size: 9px; text-transform: none; letter-spacing: 0; }
    .input {
      background: #111827; border: 1px solid #1e2d4a;
      border-radius: 6px; padding: 7px 10px;
      color: #e2e8f0;
      font-family: 'JetBrains Mono', monospace; font-size: 11px;
      outline: none; width: 100%;
    }
    .input:focus { border-color: #3b82f6; }
    .textarea { resize: vertical; min-height: 56px; }
    select.input { cursor: pointer; }
    select.input option { background: #111827; }
    .field-error { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: #fb7185; }
    .form-error {
      background: #1a0a0a; border: 1px solid #7f1d1d;
      border-radius: 6px; padding: 8px 12px;
      font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #fca5a5;
    }
    .form-actions {
      display: flex; justify-content: flex-end; gap: 8px;
      margin-top: 4px; padding-top: 14px;
      border-top: 1px solid #1e2d4a;
    }
    .btn-cancel {
      background: #1f2937; border: 1px solid #374151;
      border-radius: 6px; padding: 7px 16px;
      color: #9ca3af; font-family: 'JetBrains Mono', monospace; font-size: 11px;
      cursor: pointer;
    }
    .btn-cancel:hover { background: #374151; }
    .btn-save {
      background: #1d4ed8; border: 1px solid #2563eb;
      border-radius: 6px; padding: 7px 16px;
      color: #fff; font-family: 'JetBrains Mono', monospace; font-size: 11px;
      cursor: pointer;
    }
    .btn-save:hover:not(:disabled) { background: #2563eb; }
    .btn-save:disabled { opacity: 0.4; cursor: default; }
  `]
})
export class DeviceFormComponent implements OnInit {

  data    = input<Device | null>(null);
  mode    = input<'create' | 'edit'>('create');
  context = input<{ siteId?: number; parentId?: number }>({});

  private api = inject(ApiService);
  drawer = inject(DrawerService);

  sites: Site[]   = [];
  serverDevices: Device[] = [];
  loading = false;
  error   = '';

  form = new FormGroup({
    hostname:  new FormControl('',       [Validators.required]),
    type:      new FormControl<DeviceType>('server', [Validators.required]),
    model:     new FormControl(''),
    specs:     new FormControl(''),
    link_type: new FormControl<LinkType>('rj45'),
    services:  new FormControl(''),
    site_id:   new FormControl<number | null>(null, [Validators.required]),
    parent_id: new FormControl<number | null>(null),
    status:    new FormControl<'active' | 'planned' | 'placeholder'>('active'),
  });

  ngOnInit(): void {
    this.api.getSites().subscribe(sites => {
      this.sites = sites;
      const siteId = this.data()?.site_id ?? this.context().siteId ?? sites[0]?.id ?? null;
      const parentId = this.data()?.parent_id ?? this.context().parentId ?? null;
      this.form.patchValue({ site_id: siteId, parent_id: parentId });
      if (siteId) this.loadServers(siteId);
    });

    if (this.data()) {
      const d = this.data()!;
      this.form.patchValue({
        hostname:  d.hostname,
        type:      d.type,
        model:     d.model ?? '',
        specs:     d.specs ?? '',
        link_type: d.link_type,
        services:  d.services ?? '',
        site_id:   d.site_id,
        parent_id: d.parent_id,
        status:    d.status,
      });
    }

    this.form.get('site_id')!.valueChanges.subscribe(id => {
      if (id) this.loadServers(id);
    });
  }

  private loadServers(siteId: number): void {
    this.api.getDevicesBySite(siteId).subscribe(devices => {
      this.serverDevices = devices.filter(d => d.type === 'server' || d.type === 'hypervisor');
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error   = '';

    const val = this.form.value;
    const payload: Partial<Device> = {
      hostname:  val.hostname ?? '',
      type:      val.type ?? 'server',
      model:     val.model || null,
      specs:     val.specs || null,
      link_type: val.link_type ?? 'rj45',
      services:  val.services || null,
      site_id:   val.site_id!,
      parent_id: val.parent_id || null,
      status:    val.status ?? 'active',
    };

    const req$ = this.mode() === 'edit'
      ? this.api.updateDevice(this.data()!.id, payload)
      : this.api.createDevice(payload);

    req$.subscribe({
      next: () => {
        this.loading = false;
        this.drawer.notifySaved('device');
      },
      error: (err) => {
        this.loading = false;
        this.error   = err.error?.error ?? 'Erreur lors de l\'enregistrement';
      }
    });
  }
}
