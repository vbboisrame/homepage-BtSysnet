import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

export type DrawerEntity = 'device' | 'vlan' | 'site';
export type DrawerMode   = 'create' | 'edit';

export interface DrawerState {
  open:     boolean;
  entity?:  DrawerEntity;
  mode?:    DrawerMode;
  data?:    any;
  context?: { siteId?: number; parentId?: number };
}

@Injectable({ providedIn: 'root' })
export class DrawerService {

  readonly state = signal<DrawerState>({ open: false });

  // Émis après chaque sauvegarde réussie — les composants s'y abonnent pour recharger
  readonly saved$ = new Subject<DrawerEntity>();

  open(entity: DrawerEntity, mode: DrawerMode, data?: any, context?: { siteId?: number; parentId?: number }): void {
    this.state.set({ open: true, entity, mode, data, context });
  }

  close(): void {
    this.state.set({ open: false });
  }

  notifySaved(entity: DrawerEntity): void {
    this.saved$.next(entity);
    this.close();
  }
}
