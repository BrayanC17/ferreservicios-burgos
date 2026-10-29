import { Component } from '@angular/core';

@Component({
  selector: 'app-servicios',
  imports: [],
  templateUrl: './servicios.html',
  styleUrl: './servicios.css',
})
export class Servicios {
  servicios = [
    {
      nombre: 'Electricidad',
      detalle: 'Tomas, interruptores, iluminación y revisiones.',
      icono: 'M13 2L4 14h7l-1 8 9-12h-7z',
    },
    {
      nombre: 'Plomería',
      detalle: 'Fugas, llaves, tuberías y accesorios.',
      icono: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z',
    },
    {
      nombre: 'Otros arreglos',
      detalle: 'Cuéntanos qué necesitas y lo coordinamos.',
      icono:
        'M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z',
    },
  ];
}
