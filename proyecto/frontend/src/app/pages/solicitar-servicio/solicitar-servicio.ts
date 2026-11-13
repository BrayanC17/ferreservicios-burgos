import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SolicitudCreada, SolicitudesService } from '../../services/solicitudes.service';

// El local no atiende los domingos.
function noDomingo(c: AbstractControl): ValidationErrors | null {
  if (!c.value) return null;
  return new Date(`${c.value}T12:00:00`).getDay() === 0 ? { domingo: true } : null;
}

@Component({
  selector: 'app-solicitar-servicio',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './solicitar-servicio.html',
  styleUrl: './solicitar-servicio.css',
})
export class SolicitarServicio {
  private fb = inject(FormBuilder);
  private solicitudes = inject(SolicitudesService);

  tipos = ['Electricidad', 'Plomería', 'Pintura', 'Otros arreglos'];

  hoy = (() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  })();

  enviando = signal(false);
  errorEnvio = signal('');
  creada = signal<SolicitudCreada | null>(null);
  intentoEnvio = false;

  form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    celular: ['', [Validators.required, Validators.pattern(/^3\d{9}$/)]],
    tipo_servicio: ['', Validators.required],
    fecha_visita: ['', [Validators.required, noDomingo]],

    direccion: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
    barrio: ['', Validators.maxLength(100)],
    descripcion: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
  });

  invalido(campo: string) {
    const c = this.form.get(campo);
    return !!c && c.invalid && (c.touched || this.intentoEnvio);
  }

  enviar() {
    this.intentoEnvio = true;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.errorEnvio.set('');

    this.solicitudes.crear(this.form.getRawValue()).subscribe({
      next: (r) => {
        this.creada.set(r);
        this.form.reset();
        this.enviando.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.errorEnvio.set(
          e.error?.error ?? 'No pudimos enviar tu solicitud. Intenta de nuevo en un momento.'
        );
        this.enviando.set(false);
      },
    });
  }
}
