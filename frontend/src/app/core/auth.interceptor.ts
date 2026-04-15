import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

// Attache le token JWT à toutes les requêtes de mutation (POST/PUT/DELETE)
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();

  const isMutation = ['POST', 'PUT', 'DELETE'].includes(req.method);
  if (token && isMutation) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }
  return next(req);
};
