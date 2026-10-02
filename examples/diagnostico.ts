// examples/diagnostico.ts
//
// Demo de extremo a extremo: lee un export Formato A, lo parsea con
// govet-pe y corre los 4 modelos de Pendientes + Ejecución Detallada
// de govet. Corre con: npm run demo

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseFormatoA } from 'govet-pe';
import { modelos, modelosDetalle, diagnosticoEstados, etiquetaEstado } from 'govet';

const rutaCsv = join(__dirname, 'data', 'formato-a-ejemplo.csv');
const textoCrudo = readFileSync(rutaCsv, 'latin1');

const resultado = parseFormatoA(textoCrudo);

console.log('=== govet.js — diagnóstico de ejemplo ===\n');
console.log(`Movimientos parseados: ${resultado.movimientos.length}`);
console.log(`Advertencias: ${resultado.advertencias.length}`);
console.log(`Columnas no reconocidas: ${resultado.columnasNoReconocidas.join(', ') || '(ninguna)'}`);
console.log(`Total declarado en archivo: S/ ${resultado.totalDeclarado}`);
console.log(`Total calculado: S/ ${resultado.totalCalculado}`);
console.log(`Reconcilia: ${resultado.reconciliaOk ? 'SÍ ✅' : 'NO ❌'}\n`);

const diag = diagnosticoEstados(resultado.movimientos);
console.log('--- El candado (Est Registro) ---');
console.log('Incluidos en los cálculos:', diag.incluidos);
console.log('Excluidos (nunca silenciosos):', diag.excluidos, '\n');

console.log('--- Pendientes por Devengar (C → D) ---');
for (const p of modelos.pendientesPorDevengar(resultado.movimientos)) {
  console.log(
    `Expediente ${p.expediente}: pendiente S/ ${p.saldoPendiente.toFixed(2)} | ` +
      `${p.diasTranscurridos ?? '?'} días | ${p.nivelAlerta} | ${p.proveedorNombre ?? '(sin proveedor)'}`
  );
}

console.log('\n--- Pendientes por Girar (D → G) ---');
for (const p of modelos.pendientesPorGirar(resultado.movimientos)) {
  console.log(`Expediente ${p.expediente}: pendiente S/ ${p.saldoPendiente.toFixed(2)} | ${p.nivelAlerta}`);
}

console.log('\n--- Ejecución Detallada (modelo 662) ---');
for (const f of modelosDetalle.ejecucionDetallada662(resultado.movimientos)) {
  const monto = f.comprometido ?? f.devengado ?? f.girado ?? f.pagado ?? f.rendido;
  console.log(`Expediente ${f.expediente} | Fase ${f.fase} | S/ ${monto?.toFixed(2)} | Doc ${f.codDoc}-${f.numDoc}`);
}

console.log('\nListo. Esto es el motor govet.js corriendo 100% en local, sin subir nada a ningún servidor.');
