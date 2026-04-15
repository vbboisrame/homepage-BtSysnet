import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/auth.service';
import { DrawerService } from './core/drawer.service';
import { LoginModalComponent } from './shared/components/login-modal.component';
import { DrawerComponent } from './shared/components/drawer.component';
import { DeviceFormComponent } from './shared/components/device-form.component';
import { VlanFormComponent } from './shared/components/vlan-form.component';
import { SiteFormComponent } from './shared/components/site-form.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, CommonModule,
    LoginModalComponent, DrawerComponent,
    DeviceFormComponent, VlanFormComponent, SiteFormComponent,
  ],
  template: `
    <div class="app-wrapper">

      <!-- Header -->
      <header class="app-header">
        <div class="header-left">
          <span class="header-title">BtSysnet</span>
          <span class="header-sub">Infrastructure Réseau</span>
        </div>
        <div class="header-right">
          <span class="header-meta"><span>v2.0</span> · Angular + MariaDB</span>
          @if (auth.isLoggedIn()) {
            <div class="admin-indicator">
              <span class="admin-dot"></span>
              Admin
            </div>
            <button class="btn-logout" (click)="auth.logout()">Déconnexion</button>
          } @else {
            <button class="btn-admin" (click)="showLogin = true">Admin</button>
          }
        </div>
      </header>

      <!-- Contenu -->
      <main class="app-content">
        <router-outlet />
      </main>
    </div>

    <!-- Modale login -->
    @if (showLogin) {
      <app-login-modal
        (cancel)="showLogin = false"
        (success)="showLogin = false"
      />
    }

    <!-- Drawer global -->
    @if (drawer.state().open) {
      <app-drawer [title]="drawerTitle" (close)="drawer.close()">
        @switch (drawer.state().entity) {
          @case ('device') {
            <app-device-form
              [data]="drawer.state().data"
              [mode]="drawer.state().mode ?? 'create'"
              [context]="drawer.state().context ?? {}"
            />
          }
          @case ('vlan') {
            <app-vlan-form
              [data]="drawer.state().data"
              [mode]="drawer.state().mode ?? 'create'"
              [context]="drawer.state().context ?? {}"
            />
          }
          @case ('site') {
            <app-site-form
              [data]="drawer.state().data"
              [mode]="drawer.state().mode ?? 'create'"
            />
          }
        }
      </app-drawer>
    }
  `,
  styles: [`
    .app-wrapper { min-height: 100vh; background: #0a0e1a; }

    .app-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 20px;
      background: linear-gradient(135deg, #0f1729 0%, #141e36 100%);
      border-bottom: 1px solid #1e3a5f;
    }
    .header-left { display: flex; flex-direction: column; }
    .header-title {
      font-family: 'JetBrains Mono', monospace;
      font-size: 20px; font-weight: 700; color: #60a5fa; letter-spacing: 2px;
    }
    .header-sub {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px; color: #4b6a9c; letter-spacing: 1px; margin-top: 2px;
    }
    .header-right { display: flex; align-items: center; gap: 12px; }
    .header-meta { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #4b6a9c; }
    .header-meta span { color: #60a5fa; }

    /* Indicateur admin connecté */
    .admin-indicator {
      display: flex; align-items: center; gap: 5px;
      font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #4ade80;
    }
    .admin-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: #4ade80;
      box-shadow: 0 0 6px #4ade80;
    }

    /* Boutons header */
    .btn-admin {
      background: #0d1e35; border: 1px solid #3b82f6;
      border-radius: 5px; padding: 5px 14px;
      color: #60a5fa; font-family: 'JetBrains Mono', monospace; font-size: 10px;
      cursor: pointer; letter-spacing: 1px;
    }
    .btn-admin:hover { background: #1e3a5f; color: #93c5fd; }

    .btn-logout {
      background: none; border: 1px solid #374151;
      border-radius: 5px; padding: 5px 12px;
      color: #6b7280; font-family: 'JetBrains Mono', monospace; font-size: 10px;
      cursor: pointer;
    }
    .btn-logout:hover { border-color: #7f1d1d; color: #fb7185; }

    .app-content { padding: 20px; }
  `]
})
export class AppComponent {

  auth   = inject(AuthService);
  drawer = inject(DrawerService);

  showLogin = false;

  get drawerTitle(): string {
    const state = this.drawer.state();
    const labels: Record<string, string> = {
      device: state.mode === 'edit' ? 'Modifier l\'équipement' : 'Nouvel équipement',
      vlan:   state.mode === 'edit' ? 'Modifier le VLAN'       : 'Nouveau VLAN',
      site:   state.mode === 'edit' ? 'Modifier le site'        : 'Nouveau site',
    };
    return labels[state.entity ?? ''] ?? '';
  }
}
