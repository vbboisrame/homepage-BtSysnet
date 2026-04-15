import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Overlay -->
    <div class="overlay" (click)="cancel.emit()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <span class="modal-title">Accès administration</span>
          <button class="close-btn" (click)="cancel.emit()">✕</button>
        </div>

        <div class="modal-body">
          <label class="field-label">Mot de passe</label>
          <input
            class="field-input"
            type="password"
            [(ngModel)]="password"
            placeholder="••••••••"
            (keyup.enter)="submit()"
            autofocus
          />
          @if (error) {
            <div class="error-msg">{{ error }}</div>
          }
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" (click)="cancel.emit()">Annuler</button>
          <button class="btn-confirm" (click)="submit()" [disabled]="loading">
            {{ loading ? 'Connexion...' : 'Se connecter' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.7);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000;
    }
    .modal {
      background: #0d1525;
      border: 1px solid #1e3a5f;
      border-radius: 10px;
      width: 360px;
      overflow: hidden;
    }
    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 16px;
      border-bottom: 1px solid #1e2d4a;
    }
    .modal-title {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px; font-weight: 700;
      color: #60a5fa; letter-spacing: 1px;
    }
    .close-btn {
      background: none; border: none; color: #4b5563;
      font-size: 14px; cursor: pointer; padding: 2px 6px;
    }
    .close-btn:hover { color: #9ca3af; }

    .modal-body { padding: 20px 16px; }
    .field-label {
      display: block;
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px; color: #4b6a9c;
      text-transform: uppercase; letter-spacing: 1px;
      margin-bottom: 6px;
    }
    .field-input {
      width: 100%;
      background: #111827; border: 1px solid #1e2d4a;
      border-radius: 6px; padding: 8px 10px;
      color: #e2e8f0;
      font-family: 'JetBrains Mono', monospace; font-size: 12px;
      outline: none;
    }
    .field-input:focus { border-color: #3b82f6; }
    .error-msg {
      margin-top: 8px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px; color: #fb7185;
    }

    .modal-footer {
      display: flex; justify-content: flex-end; gap: 8px;
      padding: 12px 16px;
      border-top: 1px solid #1e2d4a;
    }
    .btn-cancel {
      background: #1f2937; border: 1px solid #374151;
      border-radius: 6px; padding: 6px 14px;
      color: #9ca3af; font-family: 'JetBrains Mono', monospace; font-size: 11px;
      cursor: pointer;
    }
    .btn-cancel:hover { background: #374151; }
    .btn-confirm {
      background: #1d4ed8; border: 1px solid #2563eb;
      border-radius: 6px; padding: 6px 14px;
      color: #fff; font-family: 'JetBrains Mono', monospace; font-size: 11px;
      cursor: pointer;
    }
    .btn-confirm:hover:not(:disabled) { background: #2563eb; }
    .btn-confirm:disabled { opacity: 0.5; cursor: default; }
  `]
})
export class LoginModalComponent {

  cancel  = output<void>();
  success = output<void>();

  private auth = inject(AuthService);

  password = '';
  error    = '';
  loading  = false;

  submit(): void {
    if (!this.password) return;
    this.loading = true;
    this.error   = '';

    this.auth.login(this.password).subscribe({
      next: () => {
        this.loading = false;
        this.success.emit();
      },
      error: () => {
        this.loading  = false;
        this.error    = 'Mot de passe incorrect';
        this.password = '';
      }
    });
  }
}
