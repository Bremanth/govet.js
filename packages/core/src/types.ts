// govet/types.ts
//
// Contrato Universal de Datos.
// Cualquier driver (govet-pe, futuro govet-driver-co, govet-driver-mx...)
// debe producir arreglos de MovimientoSiaf. El core nunca sabe de dónde vino el dato.
//
// Regla de oro: si un campo no se pudo leer o no aplica, va `null`,
// NUNCA `0`. Un 0 falso puede esconder un problema de parseo detrás
// de un semáforo verde.

export type Fase = 'C' | 'D' | 'G' | 'P' | 'R'; // Comprometido, Devengado, Girado, Pagado, Rendido

export interface MovimientoSiaf {
  expediente: string;
  fase: Fase;
  subRegistro: string | null;
  correlativo: string | null;
  secuenciaPadre: string | null;

  certificado: string | null;
  certificadoSecuencia: string | null;

  codDoc: string | null;
  numDoc: string | null;
  fechaDoc: Date | null;
  fechaAprobacion: Date | null;
  fechaProceso: Date | null;

  tipoOperacion: string | null;
  estRegistro: string | null;
  /**
   * "Sec Est" en el Formato A. Confirmado contra el catálogo oficial de
   * "Tipo Registro" (pantalla Formatos SIAF): N=OP.INICIAL (caso normal,
   * >99% de las filas), el resto son reversiones/ajustes (H, I, D, A, e, R).
   */
  tipoRegistro: string | null;

  proveedorRuc: string | null;
  proveedorNombre: string | null;

  clasificador: string | null;
  secFuncional: string | null; // meta
  rubro: string | null;
  rubroNombre: string | null;

  montoSoles: number | null; // siempre neto, con signo si es rebaja/anulación

  // Bloque "B" del Formato A: documento del giro / beneficiario del pago.
  codDocB: string | null;
  numDocB: string | null;
  fechaDocB: Date | null;
  proveedorBeneficiario: string | null;

  // Trazabilidad: de qué fila del archivo original vino este movimiento,
  // para poder señalar un problema de datos hasta la fuente.
  filaOrigen: number;
}

export interface Advertencia {
  fila: number;
  campo: string;
  motivo: string;
}

export interface ResultadoParseo {
  movimientos: MovimientoSiaf[];
  advertencias: Advertencia[];
  columnasNoReconocidas: string[];
  totalDeclarado: number | null; // la fila "TOTAL EN MONEDA NACIONAL" del reporte, si existe
  totalCalculado: number;
  reconciliaOk: boolean; // totalDeclarado ~= totalCalculado, con tolerancia
}

export interface IndicadorPendiente {
  expediente: string;
  montoOrigenFase: number;
  montoDestinoFase: number;
  saldoPendiente: number;
  fechaReferencia: Date | null; // fecha desde la que cuentan los días
  diasTranscurridos: number | null;
  nivelAlerta: 'BAJO' | 'MEDIO' | 'CRITICO';
  certificado: string | null;
  proveedorRuc: string | null;
  proveedorNombre: string | null;
  clasificador: string | null;
  secFuncional: string | null;
  // Documento de la FASE DE ORIGEN del cálculo (ej. en "Pendiente por Girar",
  // el documento del Devengado). Código crudo, sin traducir a nombre: el
  // catálogo de Cod. Doc. todavía no está confirmado contra datos reales.
  codDocOrigen: string | null;
  numDocOrigen: string | null;
  fechaDocOrigen: Date | null;
}

/** Una fila de "Ejecución Detallada" (modelos 659/662): un movimiento tal
 * cual, con su monto en la columna de SU fase, igual que lo muestra Melissa
 * (nunca fusiona fases en una fila, cada movimiento es su propia fila). */
export interface FilaEjecucionDetallada {
  expediente: string;
  fase: Fase;
  subRegistro: string | null; // el "N"/"R"/"C" que acompaña a la fase (ej. "GC N")
  comprometido: number | null;
  devengado: number | null;
  girado: number | null;
  pagado: number | null;
  rendido: number | null;
  fechaDoc: Date | null;
  codDoc: string | null;
  numDoc: string | null;
  proveedorRuc: string | null;
  proveedorNombre: string | null;
  clasificador: string | null;
  secFuncional: string | null;
  certificado: string | null;
  // Bloque "B": documento del giro/beneficiario, cuando aplica.
  fechaDocB: Date | null;
  codDocB: string | null;
  numDocB: string | null;
  proveedorBeneficiario: string | null;
}
