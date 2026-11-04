import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../../../api.config';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-resumen',
  imports: [],
  templateUrl: './admin-resumen.html',
  styleUrl: './admin-resumen.css',
})
export class AdminResumen implements OnInit {
  private http = inject(HttpClient);
  auth = inject(AuthService);
  datos = signal<{ productos: number; categorias: number } | null>(null);

  ngOnInit() {
    this.http
      .get<{ productos: number; categorias: number }>(`${API_URL}/estadisticas`)
      .subscribe({ next: (d) => this.datos.set(d), error: (e) => console.error(e) });
  }
}
