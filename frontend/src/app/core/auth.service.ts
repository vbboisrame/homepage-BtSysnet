import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

const TOKEN_KEY = 'btsysnet_token';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private http = inject(HttpClient);

  private _token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  readonly isLoggedIn = computed(() => !!this._token());

  login(password: string): Observable<{ token: string }> {
    return this.http.post<{ token: string }>('/api/auth/login', { password }).pipe(
      tap(({ token }) => {
        this._token.set(token);
        localStorage.setItem(TOKEN_KEY, token);
      })
    );
  }

  logout(): void {
    this._token.set(null);
    localStorage.removeItem(TOKEN_KEY);
  }

  getToken(): string | null {
    return this._token();
  }
}
