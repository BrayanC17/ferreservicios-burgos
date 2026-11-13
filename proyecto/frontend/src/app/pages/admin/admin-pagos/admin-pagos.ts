import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  AdminPagosService,
  CotizacionPago,
  FormPago,
  ListadoPagos,
  MEDIOS_PAGO,
  Pago,
} from '../../../services/admin-pagos.service';
import { Meta } from '../../../services/admin-solicitudes.service';

@Component({
  selector: 'app-admin-pagos',
  imports: [ReactiveFormsModule],
  templateUrl: './admin-pagos.html',
})
export class AdminPagos implements OnInit, OnDestroy {
  private api = inject(AdminPagosService);
  private fb = inject(FormBuilder);

  medios = MEDIOS_PAGO;
  pagos = signal<Pago[]>([]);
  meta = signal<Meta>({ total: 0, page: 1, limit: 15, totalPages: 1 });
  resumen = signal<ListadoPagos['resumen']>({ suma: 0, porMedio: [] });
  cotizaciones = signal<CotizacionPago[]>([]);

  q = signal('');
  medio = signal('');
  mes = signal('');
  pagina = signal(1);

  cargando = signal(true);
  error = signal('');
  aviso = signal('');

  modal = signal(false);
  guardando = signal(false);
  errorForm = signal('');
  archivo = signal<File | null>(null);

  recibo = signal<Pago | null>(null);
  soporteUrl = signal<string | null>(null);

  hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });

  form = this.fb.nonNullable.group({
    cotizacion_id: [0],
    cliente: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    concepto: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
    monto: [0, [Validators.required, Validators.min(1)]],
    medio_pago: ['Efectivo', Validators.required],
    referencia: ['', Validators.maxLength(60)],
    fecha_pago: [this.hoy, Validators.required],
  });

  ngOnInit() {
    this.cargar();
  }

  ngOnDestroy() {
    this.liberarSoporte();
  }

  cargar() {
    this.cargando.set(true);
    this.error.set('');
    this.api
      .listar({ q: this.q(), medio: this.medio(), mes: this.mes(), page: this.pagina() })
      .subscribe({
        next: (r) => {
          this.pagos.set(r.data);
          this.meta.set(r.meta);
          this.resumen.set(r.resumen);
          this.cargando.set(false);
        },
        error: (e) => {
          console.error(e);
          this.error.set('No se pudieron cargar los pagos. Revisa que el servidor esté encendido.');
          this.cargando.set(false);
        },
      });
  }

  filtrarMedio(m: string) {
    this.medio.set(m);
    this.pagina.set(1);
    this.cargar();
  }

  filtrarMes(valor: string) {
    this.mes.set(valor);
    this.pagina.set(1);
    this.cargar();
  }

  buscar(valor: string) {
    this.q.set(valor.trim());
    this.pagina.set(1);
    this.cargar();
  }

  irAPagina(n: number) {
    this.pagina.set(n);
    this.cargar();
  }

  // ---- Registrar ----
  nuevo() {
    this.form.reset({
      cotizacion_id: 0, cliente: '', concepto: '', monto: 0,
      medio_pago: 'Efectivo', referencia: '', fecha_pago: this.hoy,
    });
    this.archivo.set(null);
    this.errorForm.set('');
    this.api.cotizaciones().subscribe({
      next: (c) => this.cotizaciones.set(c),
      error: (e) => console.error(e),
    });
    this.modal.set(true);
  }

  cerrar() {
    this.modal.set(false);
  }

  elegirCotizacion(valor: string) {
    const id = Number(valor);
    const c = this.cotizaciones().find((x) => x.id === id);
    if (!c) {
      this.form.patchValue({ cotizacion_id: 0 });
      return;
    }
    this.form.patchValue({
      cotizacion_id: c.id,
      cliente: c.nombre,
      concepto: `Pago cotización ${c.codigo}`,
      monto: Math.max(c.total - c.pagado, 0),
    });
  }

  elegirArchivo(input: HTMLInputElement) {
    const f = input.files?.[0] ?? null;
    if (!f) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(f.type)) {
      this.errorForm.set('El soporte debe ser una imagen PNG, JPG o WEBP.');
      input.value = '';
      return;
    }
    if (f.size > 3 * 1024 * 1024) {
      this.errorForm.set('La imagen no puede pesar más de 3 MB.');
      input.value = '';
      return;
    }
    this.errorForm.set('');
    this.archivo.set(f);
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorForm.set('Revisa los campos marcados.');
      return;
    }
    this.guardando.set(true);
    this.errorForm.set('');
    const v = this.form.getRawValue();
    const datos: FormPago = { ...v, cotizacion_id: v.cotizacion_id || null };

    this.api.registrar(datos).subscribe({
      next: (pago) => {
        const f = this.archivo();
        if (!f) return this.terminar(pago);
        this.api.subirSoporte(pago.id, f).subscribe({
          next: (conSoporte) => this.terminar(conSoporte),
          error: () => {
            // El pago ya quedó guardado; solo falló la foto.
            this.aviso.set('El pago se registró, pero el soporte no se pudo subir.');
            this.terminar(pago);
          },
        });
      },
      error: (e) => {
        this.guardando.set(false);
        this.errorForm.set(e.error?.error ?? 'No se pudo registrar el pago.');
      },
    });
  }

  private terminar(pago: Pago) {
    this.guardando.set(false);
    this.modal.set(false);
    this.cargar();
    this.verRecibo(pago);
  }

  // ---- Comprobante ----
  verRecibo(p: Pago) {
    this.liberarSoporte();
    this.recibo.set(p);
    if (p.soporte_url) {
      this.api.soporte(p.id).subscribe({
        next: (blob) => this.soporteUrl.set(URL.createObjectURL(blob)),
        error: (e) => console.error(e),
      });
    }
  }

  cerrarRecibo() {
    this.liberarSoporte();
    this.recibo.set(null);
  }

  private liberarSoporte() {
    const u = this.soporteUrl();
    if (u) URL.revokeObjectURL(u);
    this.soporteUrl.set(null);
  }

  imprimir() {
    window.print();
  }

  eliminar(p: Pago) {
    if (!window.confirm(`¿Eliminar el pago ${p.numero} de ${p.cliente}? Esta acción no se puede deshacer.`)) return;
    this.api.eliminar(p.id).subscribe({
      next: () => {
        this.aviso.set(`Pago ${p.numero} eliminado.`);
        this.cargar();
      },
      error: (e) => this.error.set(e.error?.error ?? 'No se pudo eliminar el pago.'),
    });
  }

  // ---- Utilidades ----
  moneda(valor: string | number) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', maximumFractionDigits: 0,
    }).format(Number(valor));
  }

  fecha(iso: string) {
    const [a, m, d] = iso.split('-');
    return `${d}/${m}/${a}`;
  }

  invalido(campo: string) {
    const c = this.form.get(campo);
    return !!c && c.invalid && c.touched;
  }
}
