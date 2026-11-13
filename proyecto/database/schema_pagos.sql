-- =====================================================================
-- Módulo de Pagos con comprobante.  Ejecutar DESPUÉS de schema_extra.sql.
-- =====================================================================
USE ferreservicios_burgos;

CREATE TABLE IF NOT EXISTS pagos (
  id              INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  numero          VARCHAR(20)   NULL,                 -- PAG-000001
  cotizacion_id   INT UNSIGNED  NULL,                 -- opcional: pago de una cotización
  cliente         VARCHAR(100)  NOT NULL,
  concepto        VARCHAR(200)  NOT NULL,
  monto           DECIMAL(12,2) NOT NULL,
  medio_pago      VARCHAR(20)   NOT NULL,
  referencia      VARCHAR(60)   NULL,                 -- N.º de transferencia / transacción
  soporte_url     VARCHAR(255)  NULL,                 -- foto del comprobante (comprobantes/xxx.jpg)
  fecha_pago      DATE          NOT NULL,
  registrado_por  VARCHAR(100)  NULL,
  creado_en       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pagos_numero (numero),
  KEY idx_pagos_fecha (fecha_pago),
  KEY idx_pagos_cotizacion (cotizacion_id),
  CONSTRAINT chk_pagos_monto CHECK (monto > 0),
  CONSTRAINT fk_pagos_cotizacion FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones (id) ON DELETE SET NULL
) ENGINE=InnoDB;
