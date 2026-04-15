import { Component, OnInit, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { DrawerService } from '../../core/drawer.service';
import { Site } from '../../core/infrastructure.models';

@Component({
  selector: 'app-site-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" class="form">

      <div class="row-2">
        <div class="field">
          <label class="label">Code *</label>
          <input formControlName="code" class="input" placeholder="LIR" maxlength="10"
                 [class.readonly]="mode() === 'edit'" [attr.readonly]="mode() === 'edit' ? true : null" />
          <span class="hint">Ex : LIR, EVR, NS</span>
        </div>
        <div class="field">
          <label class="label">Statut</label>
          <select formControlName="status" class="input">
            <option value="active">Actif</option>
            <option value="placeholder">À venir</option>
          </select>
        </div>
      </div>

      <div class="field">
        <label class="label">Nom du site *</label>
        <input formControlName="name" class="input" placeholder="Liré" />
      </div>

      <div class="field">
        <label class="label">Localisation</label>
        <input formControlName="location" class="input" placeholder="Maine-et-Loire (49)" />
      </div>

      <div class="field">
        <label class="label">IP WireGuard</label>
        <input formControlName="wg_ip" class="input" placeholder="10.255.255.1" />
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
    .hint { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: #374151; }
    .input {
      background: #111827; border: 1px solid #1e2d4a;
      border-radius: 6px; padding: 7px 10px;
      color: #e2e8f0;
      font-family: 'JetBrains Mono', monospace; font-size: 11px;
      outline: none; width: 100%;
    }
    .input:focus { border-color: #3b82f6; }
    .input.readonly { opacity: 0.5; cursor: default; }
    select.input option { background: #111827; }
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
export class SiteFormComponent implements OnInit {

  data = input<Site | null>(null);
  mode = input<'create' | 'edit'>('create');

  private api = inject(ApiService);
  drawer = inject(DrawerService);

  loading = false;
  error   = '';

  form = new FormGroup({
    code:     new FormControl('', [Validators.required, Validators.maxLength(10)]),
    name:     new FormControl('', [Validators.required]),
    location: new FormControl(''),
    status:   new FormControl<'active' | 'placeholder'>('active'),
    wg_ip:    new FormControl(''),
  });

  ngOnInit(): void {
    if (this.data()) {
      const s = this.data()!;
      this.form.patchValue({
        code:     s.code,
        name:     s.name,
        location: s.location ?? '',
        status:   s.status,
        wg_ip:    s.wg_ip ?? '',
      });
    }
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error   = '';

    const val = this.form.value;
    const payload: Partial<Site> = {
      code:     val.code ?? '',
      name:     val.name ?? '',
      location: val.location || null,
      status:   val.status ?? 'active',
      wg_ip:    val.wg_ip || null,
    };

    const req$ = this.mode() === 'edit'
      ? this.api.updateSite(this.data()!.id, payload)
      : this.api.createSite(payload);

    req$.subscribe({
      next: () => {
        this.loading = false;
        this.drawer.notifySaved('site');
      },
      error: (err) => {
        this.loading = false;
        this.error   = err.error?.error ?? 'Erreur lors de l\'enregistrement';
      }
    });
  }
}
