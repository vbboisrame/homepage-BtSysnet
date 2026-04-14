import { Routes } from '@angular/router';

// Chaque route = une URL → un composant à afficher.
// On utilise le "lazy loading" : le composant n'est chargé
// que quand l'utilisateur navigue vers cette URL.
export const routes: Routes = [
  {
    path: '',
    redirectTo: 'diagram',
    pathMatch: 'full'
  },
  {
    path: 'diagram',
    loadComponent: () =>
      import('./features/diagram/diagram.component')
        .then(m => m.DiagramComponent),
    title: 'BtSysnet — Diagramme réseau'
  }
];
