// govet-pe/mapper.ts

/**
 * Limpia una cabecera para comparar sin depender de tildes, puntos,
 * saltos de línea internos ("Expediente\nSIAF") o mayúsculas.
 */
export function normalizarCabecera(h: string): string {
  return h
    .replace(/[\r\n]+/g, ' ')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita tildes
    .replace(/[."]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/** Alias -> campo canónico de MovimientoSiaf. Cubre las 67 columnas del Formato A completo. */
export const ALIAS_FORMATO_A: Record<string, string> = {
  'expediente siaf': 'expediente',
  fase: 'fase',
  'sub reg': 'subRegistro',
  corr: 'correlativo',
  'secuencia padre': 'secuenciaPadre',
  certificado: 'certificado',
  'certificado secuencia': 'certificadoSecuencia',
  'cod doc': 'codDoc',
  'num doc': 'numDoc',
  'fecha doc': 'fechaDoc',
  'fecha aprobacion': 'fechaAprobacion',
  'fecha proceso': 'fechaProceso',
  'tipo op': 'tipoOperacion',
  'est registro': 'estRegistro',
  'sec est': 'tipoRegistro',
  proveedor: 'proveedorRuc',
  'nombre proveedor': 'proveedorNombre',
  clasificacion: 'clasificador',
  'sec func': 'secFuncional',
  rb: 'rubro',
  nombre: 'rubroNombre',
  mon: 'moneda',
  'monto s/': 'montoSoles',
  'cod doc b': 'codDocB',
  'num doc b': 'numDocB',
  'fecha doc b': 'fechaDocB',
  'nombre proveedor/beneficiari': 'proveedorBeneficiario',
  // Resto del Formato A completo (67 columnas)
  'ano ejec': 'anioEjec',
  'mes ejec': 'mesEjec',
  'sec ejec': 'secEjec',
  'sec ejec 2': 'secEjec2',
  'nombre ejec 2': 'nombreEjec2',
  'mod compra': 'modCompra',
  'tipo proc': 'tipoProc',
  area: 'area',
  ciclo: 'ciclo',
  origen: 'origen',
  'tipo financ': 'tipoFinanc',
  tp: 'tp',
  tr: 'tipoRecurso',
  tc: 'tc',
  ano: 'anioCta',
  bnc: 'banco',
  cta: 'cuenta',
  'tipo prov': 'tipoProv',
  proy: 'proy',
  'tipo giro': 'tipoGiro',
  'monto origen': 'montoOrigen',
  'ano ctb': 'anioCtb',
  'mes ctb': 'mesCtb',
  'dia ctb': 'diaCtb',
  'prod pry': 'prodPry',
  'act ai obra': 'actAiObra',
  prg: 'programa',
  funcion: 'funcion',
  'division func': 'divisionFunc',
  'grupo func': 'grupoFunc',
  meta: 'meta',
  monto: 'monto',
  'ano proceso': 'anioProceso',
  'mes proceso': 'mesProceso',
  'dia proceso': 'diaProceso',
  'fecha db oracle': 'fechaDbOracle',
  'estado envio': 'estadoEnvio',
  edicion: 'edicion',
};

/**
 * "T.C." (tipo de cambio) y "TC" quedan iguales al normalizar: se distinguen
 * por los puntos. Clave: la cabecera cruda sin espacios y en minúsculas.
 */
export const ALIAS_CRUDO: Record<string, string> = { 't.c.': 'tipoCambio' };

/** Texto recortado, o null si la celda falta o está vacía. */
export function txt(v: string | undefined | null): string | null {
  if (v === undefined || v === null) return null;
  const t = v.trim();
  return t === '' ? null : t;
}

/**
 * Convierte "9,837.41" -> 9837.41 y "960.00-" -> -960 (el SIAF pone el
 * signo negativo AL FINAL, no al inicio). Devuelve null si no es número:
 * un campo vacío o corrupto se marca como "no se pudo leer", nunca 0.
 */
export function parseMonto(texto: string | undefined | null): number | null {
  if (texto === undefined || texto === null) return null;
  const t = texto.trim();
  if (t === '') return null;

  const negativo = t.endsWith('-');
  const limpio = (negativo ? t.slice(0, -1) : t).replace(/,/g, '').trim();
  if (limpio === '') return null;

  const n = Number(limpio);
  if (Number.isNaN(n)) return null;
  return negativo ? -n : n;
}

/** "28/09/2026" -> Date. Devuelve null si no calza el formato o está vacío. */
export function parseFechaSiaf(texto: string | undefined | null): Date | null {
  if (!texto) return null;
  const m = texto.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const [, d, mo, y] = m;
  const fecha = new Date(Number(y), Number(mo) - 1, Number(d));
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

export function esFaseValida(v: string): v is 'C' | 'D' | 'G' | 'P' | 'R' {
  return v === 'C' || v === 'D' || v === 'G' || v === 'P' || v === 'R';
}
