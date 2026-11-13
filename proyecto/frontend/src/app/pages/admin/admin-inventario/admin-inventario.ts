import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IMAGENES_URL } from '../../../api.config';
import {
  AdminInventarioService,
  CategoriaAdmin,
  FormProducto,
  ProductoAdmin,
  ResumenInventario,
} from '../../../services/admin-inventario.service';
import { Meta } from '../../../services/admin-solicitudes.service';

@Component({
  selector: 'app-admin-inventario',
  imports: [ReactiveFormsModule],
  templateUrl: './admin-inventario.html',
})
export class AdminInventario implements OnInit {
  private api = inject(AdminInventarioService);
  private fb = inject(FormBuilder);

  productos = signal<ProductoAdmin[]>([]);
  categorias = signal<CategoriaAdmin[]>([]);
  meta = signal<Meta>({ total: 0, page: 1, limit: 15, totalPages: 1 });
  resumen = signal<ResumenInventario>({ total: 0, bajo: 0, agotado: 0, inactivo: 0, valor: 0 });

  q = signal('');
  categoria = signal('');
  filtro = signal('');
  pagina = signal(1);

  cargando = signal(true);
  error = signal('');
  aviso = signal('');

  // Modal de crear / editar
  modal = signal(false);
  editando = signal<ProductoAdmin | null>(null);
  guardando = signal(false);
  errorForm = signal('');
  archivo = signal<File | null>(null);
  vistaPrevia = signal<string | null>(null);

  filtros = [
    { id: '', texto: 'Todos' },
    { id: 'bajo', texto: 'Stock bajo' },
    { id: 'agotado', texto: 'Agotados' },
    { id: 'inactivo', texto: 'Ocultos' },
    { id: 'destacado', texto: 'Destacados' },
  ];

  form = this.fb.nonNullable.group({
    categoria_id: [0, [Validators.required, Validators.min(1)]],
    sku: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(40)]],
    nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
    descripcion: [''],
    marca: [''],
    unidad: ['unidad', [Validators.required, Validators.maxLength(20)]],
    precio: [0, [Validators.required, Validators.min(0)]],
    stock: [0, [Validators.required, Validators.min(0)]],
    destacado: [false],
    activo: [true],
  });

  ngOnInit() {
    this.api.categorias().subscribe({ next: (c) => this.categorias.set(c), error: (e) => console.error(e) });
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    this.error.set('');
    this.api
      .listar({ q: this.q(), categoria: this.categoria(), filtro: this.filtro(), page: this.pagina() })
      .subscribe({
        next: (r) => {
          this.productos.set(r.data);
          this.meta.set(r.meta);
          this.resumen.set(r.resumen);
          this.cargando.set(false);
        },
        error: (e) => {
          console.error(e);
          this.error.set('No se pudo cargar el inventario. Revisa que el servidor esté encendido.');
          this.cargando.set(false);
        },
      });
  }

  filtrar(id: string) {
    this.filtro.set(id);
    this.pagina.set(1);
    this.cargar();
  }

  buscar(valor: string) {
    this.q.set(valor.trim());
    this.pagina.set(1);
    this.cargar();
  }

  porCategoria(valor: string) {
    this.categoria.set(valor);
    this.pagina.set(1);
    this.cargar();
  }

  irAPagina(n: number) {
    this.pagina.set(n);
    this.cargar();
  }

  // ---- Acciones rápidas ----
  ajustar(p: ProductoAdmin, delta: number) {
    this.aviso.set('');
    this.api.ajustarStock(p.id, delta).subscribe({
      next: () => this.cargar(),
      error: (e) => this.error.set(e.error?.error ?? 'No se pudo ajustar el stock.'),
    });
  }

  pedirAjuste(p: ProductoAdmin) {
    const txt = window.prompt(`Ajuste de stock para "${p.nombre}".\nEscribe un número (ej. 10 para sumar, -3 para restar):`);
    if (txt === null) return;
    const n = Number(txt.replace(',', '.'));
    if (!Number.isInteger(n) || n === 0) {
      this.error.set('Escribe un número entero distinto de cero.');
      return;
    }
    this.ajustar(p, n);
  }

  alternarActivo(p: ProductoAdmin) {
    this.api.actualizar(p.id, { activo: !p.activo }).subscribe({
      next: () => this.cargar(),
      error: (e) => this.error.set(e.error?.error ?? 'No se pudo actualizar el producto.'),
    });
  }

  alternarDestacado(p: ProductoAdmin) {
    this.api.actualizar(p.id, { destacado: !p.destacado }).subscribe({
      next: () => this.cargar(),
      error: (e) => this.error.set(e.error?.error ?? 'No se pudo actualizar el producto.'),
    });
  }

  // ---- Modal ----
  nuevo() {
    this.editando.set(null);
    this.form.reset({
      categoria_id: this.categorias()[0]?.id ?? 0,
      sku: '', nombre: '', descripcion: '', marca: '', unidad: 'unidad',
      precio: 0, stock: 0, destacado: false, activo: true,
    });
    this.abrirModal(null);
  }

  editar(p: ProductoAdmin) {
    this.editando.set(p);
    this.form.reset({
      categoria_id: p.categoria_id,
      sku: p.sku,
      nombre: p.nombre,
      descripcion: p.descripcion ?? '',
      marca: p.marca ?? '',
      unidad: p.unidad,
      precio: Number(p.precio),
      stock: p.stock,
      destacado: !!p.destacado,
      activo: !!p.activo,
    });
    this.abrirModal(p);
  }

  private abrirModal(p: ProductoAdmin | null) {
    this.errorForm.set('');
    this.archivo.set(null);
    this.vistaPrevia.set(p ? this.urlImagen(p) : null);
    this.modal.set(true);
  }

  cerrar() {
    this.modal.set(false);
  }

  elegirArchivo(input: HTMLInputElement) {
    const f = input.files?.[0] ?? null;
    if (!f) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(f.type)) {
      this.errorForm.set('La imagen debe ser PNG, JPG o WEBP.');
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
    this.vistaPrevia.set(URL.createObjectURL(f));
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorForm.set('Revisa los campos marcados.');
      return;
    }
    this.guardando.set(true);
    this.errorForm.set('');
    const datos = this.form.getRawValue() as FormProducto;
    const previo = this.editando();

    const peticion = previo ? this.api.actualizar(previo.id, datos) : this.api.crear(datos);
    peticion.subscribe({
      next: (p) => {
        const f = this.archivo();
        if (!f) return this.terminar(previo ? 'Producto actualizado.' : 'Producto creado.');
        this.api.subirImagen(p.id, f).subscribe({
          next: () => this.terminar('Producto guardado con su imagen.'),
          error: (e) => {
            this.guardando.set(false);
            this.errorForm.set(e.error?.error ?? 'El producto se guardó, pero la imagen no se pudo subir.');
            this.cargar();
          },
        });
      },
      error: (e) => {
        this.guardando.set(false);
        this.errorForm.set(e.error?.error ?? 'No se pudo guardar el producto.');
      },
    });
  }

  quitarImagen() {
    const p = this.editando();
    if (!p || !p.imagen_url) return;
    this.api.quitarImagen(p.id).subscribe({
      next: (r) => {
        this.editando.set(r);
        this.vistaPrevia.set(null);
        this.archivo.set(null);
        this.cargar();
      },
      error: (e) => this.errorForm.set(e.error?.error ?? 'No se pudo quitar la imagen.'),
    });
  }

  private terminar(mensaje: string) {
    this.guardando.set(false);
    this.modal.set(false);
    this.aviso.set(mensaje);
    this.cargar();
  }

  // ---- Utilidades ----
  urlImagen(p: ProductoAdmin) {
    return p.imagen_url ? `${IMAGENES_URL}/${p.imagen_url}` : null;
  }

  estadoStock(p: ProductoAdmin) {
    if (!p.activo) return 'oculto';
    if (p.stock === 0) return 'agotado';
    if (p.stock <= 5) return 'bajo'; // 5 unidades o menos
    return 'ok';
  }

  moneda(valor: string | number) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', maximumFractionDigits: 0,
    }).format(Number(valor));
  }

  invalido(campo: string) {
    const c = this.form.get(campo);
    return !!c && c.invalid && c.touched;
  }
}
