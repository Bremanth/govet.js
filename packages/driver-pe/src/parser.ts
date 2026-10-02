// govet-pe/parser.ts

import { parseCsv } from './csv';
import { ALIAS_FORMATO_A, normalizarCabecera, parseFechaSiaf, parseMonto, esFaseValida } from './mapper';
import { MovimientoSiaf, ResultadoParseo, Advertencia } from 'govet';

const TOLERANCIA_RECONCILIACION = 0.5; // soles; el archivo puede traer redondeos

function esFilaTotal(cells: string[]): boolean {
  return cells.some((c) => c.toUpperCase().includes('TOTAL EN MONEDA'));
}

function encontrarFilaCabecera(filas: string[][]): number {
  for (let i = 0; i < filas.length; i++) {
    const normalizadas = filas[i].map(normalizarCabecera);
    if (normalizadas.includes('expediente siaf') && normalizadas.includes('fase')) {
      return i;
    }
  }
  throw new Error(
    'No se encontró la fila de cabecera (se esperaba "Expediente SIAF" y "Fase"). ' +
      'El formato del export puede haber cambiado.'
  );
}

export function parseFormatoA(textoCrudo: string): ResultadoParseo {
  const filas = parseCsv(textoCrudo);
  const idxCabecera = encontrarFilaCabecera(filas);
  const cabecera = filas[idxCabecera];

  const indice: Record<string, number> = {};
  const columnasNoReconocidas: string[] = [];

  cabecera.forEach((celda, i) => {
    const limpio = celda.trim();
    if (!limpio) return; // columna sin nombre, se ignora sin marcarla como "no reconocida"
    const norm = normalizarCabecera(limpio);
    const campo = ALIAS_FORMATO_A[norm];
    if (campo) {
      indice[campo] = i;
    } else {
      columnasNoReconocidas.push(limpio);
    }
  });

  if (indice['expediente'] === undefined || indice['fase'] === undefined) {
    throw new Error('La cabecera no trae "Expediente SIAF" o "Fase" mapeables. Revisa el mapper.');
  }

  const get = (fila: string[], campo: string): string | undefined => {
    const i = indice[campo];
    return i === undefined ? undefined : fila[i];
  };

  const movimientos: MovimientoSiaf[] = [];
  const advertencias: Advertencia[] = [];
  let totalDeclarado: number | null = null;

  for (let f = idxCabecera + 1; f < filas.length; f++) {
    const fila = filas[f];
    if (fila.every((c) => c.trim() === '')) continue; // línea en blanco al final

    const expediente = get(fila, 'expediente')?.trim() ?? '';

    if (!expediente) {
      if (esFilaTotal(fila)) {
        const montoTotal = parseMonto(get(fila, 'montoSoles'));
        if (montoTotal !== null) totalDeclarado = montoTotal;
      }
      continue; // fila sin expediente y que no es el total: se ignora
    }

    const faseTexto = (get(fila, 'fase') ?? '').trim();
    if (!esFaseValida(faseTexto)) {
      advertencias.push({ fila: f + 1, campo: 'fase', motivo: `valor de fase no reconocido: "${faseTexto}"` });
      continue; // sin fase válida no se puede clasificar el movimiento
    }

    const montoSoles = parseMonto(get(fila, 'montoSoles'));
    if (montoSoles === null) {
      advertencias.push({
        fila: f + 1,
        campo: 'montoSoles',
        motivo: `no se pudo leer el monto: "${get(fila, 'montoSoles')}"`,
      });
    }

    movimientos.push({
      expediente,
      fase: faseTexto,
      subRegistro: get(fila, 'subRegistro') ?? null,
      correlativo: get(fila, 'correlativo') ?? null,
      secuenciaPadre: get(fila, 'secuenciaPadre') ?? null,
      certificado: get(fila, 'certificado') ?? null,
      certificadoSecuencia: get(fila, 'certificadoSecuencia') ?? null,
      codDoc: get(fila, 'codDoc') ?? null,
      numDoc: get(fila, 'numDoc') ?? null,
      fechaDoc: parseFechaSiaf(get(fila, 'fechaDoc')),
      fechaAprobacion: parseFechaSiaf(get(fila, 'fechaAprobacion')),
      fechaProceso: parseFechaSiaf(get(fila, 'fechaProceso')),
      tipoOperacion: get(fila, 'tipoOperacion') ?? null,
      estRegistro: get(fila, 'estRegistro') ?? null,
      tipoRegistro: get(fila, 'tipoRegistro') ?? null,
      proveedorRuc: get(fila, 'proveedorRuc') || null,
      proveedorNombre: get(fila, 'proveedorNombre') || null,
      clasificador: get(fila, 'clasificador') ?? null,
      secFuncional: get(fila, 'secFuncional') ?? null,
      rubro: get(fila, 'rubro') ?? null,
      rubroNombre: get(fila, 'rubroNombre') ?? null,
      montoSoles,
      codDocB: get(fila, 'codDocB') ?? null,
      numDocB: get(fila, 'numDocB') ?? null,
      fechaDocB: parseFechaSiaf(get(fila, 'fechaDocB')),
      proveedorBeneficiario: get(fila, 'proveedorBeneficiario') || null,
      filaOrigen: f + 1,
    });
  }

  const totalCalculado = movimientos.reduce((acc, m) => acc + (m.montoSoles ?? 0), 0);
  const reconciliaOk =
    totalDeclarado !== null && Math.abs(totalDeclarado - totalCalculado) < TOLERANCIA_RECONCILIACION;

  return {
    movimientos,
    advertencias,
    columnasNoReconocidas: [...new Set(columnasNoReconocidas)],
    totalDeclarado,
    totalCalculado: Math.round(totalCalculado * 100) / 100,
    reconciliaOk,
  };
}
