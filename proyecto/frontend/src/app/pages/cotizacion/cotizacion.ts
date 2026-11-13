import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IMAGENES_URL } from '../../api.config';
import { CarritoService, ItemCotizacion } from '../../services/carrito.service';
import { HttpErrorResponse } from '@angular/common/http';
import { CotizacionesService, CotizacionCreada } from '../../services/cotizaciones.service';

@Component({
  selector: 'app-cotizacion',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './cotizacion.html',
  styleUrl: './cotizacion.css',
})
export class Cotizacion {
  carrito = inject(CarritoService);
  private fb = inject(FormBuilder);
  private cotizaciones = inject(CotizacionesService);
  enviando = signal(false);
  errorEnvio = signal('');
  creada = signal<CotizacionCreada | null>(null);
  mediosPago = ['Efectivo', 'Transferencia', 'Nequi', 'Daviplata', 'Tarjeta'];

  // Fecha mínima: hoy, en hora local (formato yyyy-mm-dd).
  hoy = (() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  })();

  form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    celular: ['', [Validators.required, Validators.pattern(/^3\d{9}$/)]],
    dia_recogida: ['', Validators.required],
    medio_pago: ['', Validators.required],
    observaciones: ['', Validators.maxLength(500)],
  });

  intentoEnvio = false;

  imagen(i: ItemCotizacion) {
    return i.imagen_url ? `${IMAGENES_URL}/${i.imagen_url}` : null;
  }

  formato(valor: number) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(valor);
  }

  cambiar(i: ItemCotizacion, valor: number) {
    this.carrito.cambiarCantidad(i.id, Number.isFinite(valor) ? Math.trunc(valor) : 1);
  }

  invalido(campo: string) {
    const c = this.form.get(campo);
    return !!c && c.invalid && (c.touched || this.intentoEnvio);
  }

    enviar() {
    this.intentoEnvio = true;
    if (this.form.invalid || this.carrito.items().length === 0) {
      this.form.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.errorEnvio.set('');

    this.cotizaciones
      .crear({
        ...this.form.getRawValue(),
        items: this.carrito.items().map((i) => ({ producto_id: i.id, cantidad: i.cantidad })),
      })
      .subscribe({
        next: (r) => {
          this.creada.set(r);
          this.carrito.vaciar();
          this.form.reset();
          this.enviando.set(false);
        },
        error: (e: HttpErrorResponse) => {
          this.errorEnvio.set(
            e.error?.error ?? 'No pudimos enviar tu cotización. Intenta de nuevo en un momento.'
          );
          this.enviando.set(false);
        },
      });
  }
}
