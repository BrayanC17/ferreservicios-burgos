import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { API_URL } from '../api.config';

export interface UsuarioAdmin {
  id: number;
  nombre: string;
  correo?: string;
  rol: string;
}

interface RespuestaLogin {
  token: string;
  usuario: UsuarioAdmin;
}

const CLAVE_TOKEN = 'fsb_token';
const CLAVE_USUARIO = 'fsb_usuario';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private _token = signal<string | null>(this.leer(CLAVE_TOKEN));
  private _usuario = signal<UsuarioAdmin | null>(this.leerUsuario());

  usuario = this._usuario.asReadonly();
  autenticado = computed(() => {
    const t = this._token();
    return !!t && !this.expirado(t);
  });

  token() {
    return this._token();
  }

  login(correo: string, password: string): Observable<RespuestaLogin> {
    return this.http.post<RespuestaLogin>(`${API_URL}/auth/login`, { correo, password }).pipe(
      tap((r) => {
        this._token.set(r.token);
        this._usuario.set(r.usuario);
        this.guardar(CLAVE_TOKEN, r.token);
        this.guardar(CLAVE_USUARIO, JSON.stringify(r.usuario));
      })
    );
  }

  logout() {
    this._token.set(null);
    this._usuario.set(null);
    try {
      localStorage.removeItem(CLAVE_TOKEN);
      localStorage.removeItem(CLAVE_USUARIO);
    } catch {
      /* sin almacenamiento disponible */
    }
    this.router.navigate(['/admin/login']);
  }

  // Lee la fecha de vencimiento que trae el propio token.
  private expirado(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return !payload.exp || payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  private guardar(clave: string, valor: string) {
    try {
      localStorage.setItem(clave, valor);
    } catch {
      /* si el navegador lo bloquea, la sesión dura mientras no recargues */
    }
  }

  private leer(clave: string): string | null {
    try {
      return localStorage.getItem(clave);
    } catch {
      return null;
    }
  }

  private leerUsuario(): UsuarioAdmin | null {
    try {
      return JSON.parse(this.leer(CLAVE_USUARIO) ?? 'null');
    } catch {
      return null;
    }
  }
}
