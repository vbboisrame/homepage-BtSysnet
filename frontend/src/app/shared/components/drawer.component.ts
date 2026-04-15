import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-drawer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Backdrop -->
    <div class="backdrop" (click)="close.emit()"></div>

    <!-- Panneau latéral -->
    <div class="drawer">
      <div class="drawer-header">
        <span class="drawer-title">{{ title() }}</span>
        <button class="close-btn" (click)="close.emit()">✕</button>
      </div>
      <div class="drawer-body">
        <ng-content />
      </div>
    </div>
  `,
  styles: [`
    :host {
      position: fixed; inset: 0;
      z-index: 900;
      display: flex;
    }
    .backdrop {
      flex: 1;
      background: rgba(0,0,0,0.6);
    }
    .drawer {
      width: 480px;
      background: #0d1525;
      border-left: 1px solid #1e3a5f;
      display: flex; flex-direction: column;
      overflow: hidden;
      animation: slideIn 0.2s ease-out;
    }
    @keyframes slideIn {
      from { transform: translateX(100%); }
      to   { transform: translateX(0); }
    }
    .drawer-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 18px;
      border-bottom: 1px solid #1e2d4a;
      flex-shrink: 0;
    }
    .drawer-title {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px; font-weight: 700;
      color: #60a5fa; letter-spacing: 1px;
      text-transform: uppercase;
    }
    .close-btn {
      background: none; border: none; color: #4b5563;
      font-size: 16px; cursor: pointer; padding: 2px 6px;
      line-height: 1;
    }
    .close-btn:hover { color: #9ca3af; }
    .drawer-body {
      flex: 1; overflow-y: auto;
      padding: 20px 18px;
    }
    /* Scrollbar */
    .drawer-body::-webkit-scrollbar { width: 4px; }
    .drawer-body::-webkit-scrollbar-thumb { background: #1e2d4a; border-radius: 2px; }
  `]
})
export class DrawerComponent {
  title = input<string>('');
  close = output<void>();
}
