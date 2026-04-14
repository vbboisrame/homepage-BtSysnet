import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

// Le composant racine est le "squelette" de l'application.
// Il contient le header commun + <router-outlet> qui affiche
// le composant correspondant à l'URL courante.
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="app-wrapper">
      <!-- Header global -->
      <header class="app-header">
        <div class="header-left">
          <span class="header-title">BtSysnet</span>
          <span class="header-sub">BtSysnet — Infrastructure Réseau</span>
        </div>
        <div class="header-meta">
          <span>v2.0</span> · Angular + MariaDB
        </div>
      </header>

      <!-- Zone de contenu : le router injecte ici le bon composant -->
      <main class="app-content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .app-wrapper {
      min-height: 100vh;
      background: #0a0e1a;
    }
    .app-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 20px;
      background: linear-gradient(135deg, #0f1729 0%, #141e36 100%);
      border-bottom: 1px solid #1e3a5f;
    }
    .header-left {
      display: flex;
      flex-direction: column;
    }
    .header-title {
      font-family: 'JetBrains Mono', monospace;
      font-size: 20px;
      font-weight: 700;
      color: #60a5fa;
      letter-spacing: 2px;
    }
    .header-sub {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      color: #4b6a9c;
      letter-spacing: 1px;
      margin-top: 2px;
    }
    .header-meta {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      color: #4b6a9c;
    }
    .header-meta span {
      color: #60a5fa;
    }
    .app-content {
      padding: 20px;
    }
  `]
})
export class AppComponent {}
