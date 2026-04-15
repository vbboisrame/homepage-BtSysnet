import { Component, OnInit, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { DrawerService } from '../../core/drawer.service';
import { Vlan, VlanType, Site } from '../../core/infrastructure.models';

@Component({
  selector: 'app-vlan-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" class="form">

      <div class="row-2">
        <div class="field">
          <label class="label">N° VLAN *</label>
          <input formControlName="number" class="input" type="number" min="1" max="4094" placeholder="10" />
          @if (form.get('number')?.invalid && form.get('number')?.touched) {
            <span class="field-error">1 – 4094</span>
          }
        </div>
        <div class="field">
          <label class="label">Nom *</label>
          <input formControlName="name" class="input" placeholder="Serveurs" />
        </div>
      </div>

      <div class="row-2">
        <div class="field">
          <label class="label">Plage IP *</label>
          <input formControlName="ip_range" class="input" placeholder="10.1.10.0/24" />
        </div>
        <div class="field">
          <label class="label">Passerelle *</label>
          <input formControlName="gateway" class="input" placeholder="10.1.10.254" />
        </div>
      </div>

      <div class="row-2">
        <div class="field">
          <label class="label">Type</label>
          <select formControlName="type" class="input">
            <option value="intersite">Inter-sites (WireGuard)</option>
            <option value="local">Local (isolation par site)</option>
            <option value="isolated">Isolé (pas de routage)</option>
          </select>
        </div>
        <div class="field">
          <label class="label">MTU</label>
          <select formControlName="mtu" class="input">
            <option [value]="1500">1500 (standard)</option>
            <option [value]="9000">9000 (jumbo frames)</option>
          </select>
        </div>
      </div>

      <div class="field">
        <label class="label">Site *</label>
        <select formControlName="site_id" class="input">
          @for (site of sites; track site.id) {
            <option [value]="site.id">{{ site.code }} — {{ site.name }}</option>
          }
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
    .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .label {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px; color: #4b6a9c;
      text-transform: uppercase; letter-spacing: 1px;
    }
    .input {
      background: #111827; border: 1px solid #1e2d4a;
      border-radius: 6px; padding: 7px 10px;
      color: #e2e8f0;
      font-family: 'JetBrains Mono', monospace; font-size: 11px;
      outline: none; width: 100%;
    }
    .input:focus { border-color: #3b82f6; }
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
export class VlanFormComponent implements OnInit {

  data    = input<Vlan | null>(null);
  mode    = input<'create' | 'edit'>('create');
  context = input<{ siteId?: number }>({});

  private api = inject(ApiService);
  drawer = inject(DrawerService);

  sites: Site[] = [];
  loading = false;
  error   = '';

  form = new FormGroup({
    number:   new FormControl<number | null>(null, [Validators.required, Validators.min(1), Validators.max(4094)]),
    name:     new FormControl('',      [Validators.required]),
    ip_range: new FormControl('',      [Validators.required]),
    gateway:  new FormControl('',      [Validators.required]),
    type:     new FormControl<VlanType>('local'),
    mtu:      new FormControl<number>(1500),
    site_id:  new FormControl<number | null>(null, [Validators.required]),
  });

  ngOnInit(): void {
    this.api.getSites().subscribe(sites => {
      this.sites = sites;
      const siteId = this.data()?.site_id ?? this.context().siteId ?? sites[0]?.id ?? null;
      if (!this.data()) this.form.patchValue({ site_id: siteId });
    });

    if (this.data()) {
      const v = this.data()!;
      this.form.patchValue({
        number:   v.number,
        name:     v.name,
        ip_range: v.ip_range,
        gateway:  v.gateway,
        type:     v.type,
        mtu:      v.mtu,
        site_id:  v.site_id,
      });
    }
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error   = '';

    const val = this.form.value;
    const payload: Partial<Vlan> = {
      number:   val.number!,
      name:     val.name!,
      ip_range: val.ip_range!,
      gateway:  val.gateway!,
      type:     val.type ?? 'local',
      mtu:      val.mtu ?? 1500,
      site_id:  val.site_id!,
    };

    const req$ = this.mode() === 'edit'
      ? this.api.updateVlan(this.data()!.id, payload)
      : this.api.createVlan(payload);

    req$.subscribe({
      next: () => {
        this.loading = false;
        this.drawer.notifySaved('vlan');
      },
      error: (err) => {
        this.loading = false;
        this.error   = err.error?.error ?? 'Erreur lors de l\'enregistrement';
      }
    });
  }
}
