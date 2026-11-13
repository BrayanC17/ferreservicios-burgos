import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Subject, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Categoria, ProductosService, Sugerencia } from '../../services/productos.service';
import { CarritoService } from '../../services/carrito.service';

@Component({
  imports: [RouterLink, RouterLinkActive],
  selector: 'app-header',
  styleUrl: './header.css',
  templateUrl: './header.html',
})
export class Header implements OnInit {
  private router = inject(Router);
  private api = inject(ProductosService);
  private entrada$ = new Subject<string>();

  categorias = signal<Categoria[]>([]);
  sugerencias = signal<Sugerencia[]>([]);
  abierto = signal(false);
  carrito = inject(CarritoService);

  ngOnInit() {
    this.api.categorias().subscribe({
      next: (c) => this.categorias.set(c),
      error: (e) => console.error('No se pudieron cargar las categorías:', e),
    });

    // Espera 250 ms después de la última tecla antes de consultar.
    this.entrada$
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((q) =>
          q.trim().length < 2
            ? of([] as Sugerencia[])
            : this.api.sugerencias(q.trim()).pipe(catchError(() => of([] as Sugerencia[])))
        )
      )
      .subscribe((lista) => {
        this.sugerencias.set(lista);
        this.abierto.set(lista.length > 0);
      });
  }

  escribir(valor: string) {
    if (valor.trim().length < 2) this.abierto.set(false);
    this.entrada$.next(valor);
  }

  buscar(caja: HTMLInputElement, cat: HTMLSelectElement) {
    const queryParams: Record<string, string> = {};
    if (caja.value.trim()) queryParams['q'] = caja.value.trim();
    if (cat.value) queryParams['categoria'] = cat.value;
    this.ir(queryParams, caja, cat);
  }

  elegir(s: Sugerencia, caja: HTMLInputElement, cat: HTMLSelectElement) {
    this.ir({ q: s.nombre }, caja, cat);
  }

  private ir(queryParams: Record<string, string>, caja: HTMLInputElement, cat: HTMLSelectElement) {
    this.abierto.set(false);
    this.router.navigate(['/catalogo'], { queryParams }).then(() => {
      caja.value = '';
      cat.value = '';
      this.sugerencias.set([]);
    });
  }
}


