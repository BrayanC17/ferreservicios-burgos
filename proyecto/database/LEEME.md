# Base de datos

Orden de importación (MySQL 8 / TiDB):

1. `schema.sql`        – crea la BD `ferreservicios_burgos`, categorías y productos (**borra** esas tablas si existen).
2. `schema_extra.sql`  – usuarios, cotizaciones, ítems y solicitudes de servicio (no borra nada).
3. `schema_pagos.sql`  – tabla de pagos con comprobante (no borra nada).

Si ya tienes la base con datos, ejecuta solo el 2 y el 3 (son seguros de repetir).
Crear administrador: `cd backend && node scripts/crear-admin.js "Nombre" correo@ejemplo.com "ContraseñaSegura"`.
