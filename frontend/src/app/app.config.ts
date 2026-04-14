import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';

// Ce fichier configure les "providers" globaux de l'application.
// Un provider = un service ou une fonctionnalité disponible partout.
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),       // Active le routeur Angular
    provideHttpClient(),         // Active HttpClient pour appeler l'API REST
  ]
};
