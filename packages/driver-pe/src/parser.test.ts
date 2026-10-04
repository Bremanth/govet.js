// govet-pe/parser.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFormatoA } from './parser';

const CSV_EJEMPLO = [
  '"Expediente\nSIAF",Fase,"Est\nRegistro","Monto\nS/"',
  '0000001,C,A,"1,000.00"',
  '0000001,D,A,"900.00"',
  '0000002,C,A,"500.00-"',
  ',,,"2,400.00"', // fila "TOTAL EN MONEDA NACIONAL" simplificada (sin esa palabra, no debe tomarse como total)
].join('\n');

test('parseFormatoA: parsea filas básicas y calcula el total', () => {
  const r = parseFormatoA(CSV_EJEMPLO);
  assert.equal(r.movimientos.length, 3);
  assert.equal(r.movimientos[0].expediente, '0000001');
  assert.equal(r.movimientos[2].montoSoles, -500);
});

test('parseFormatoA: reconcilia contra la fila de TOTAL EN MONEDA NACIONAL', () => {
  const csv = [
    '"Expediente\nSIAF",Fase,"Est\nRegistro","Monto\nS/"',
    '0000001,C,A,"1,000.00"',
    '0000001,D,A,"900.00"',
    ',TOTAL EN MONEDA NACIONAL,,"1,900.00"',
  ].join('\n');
  const r = parseFormatoA(csv);
  assert.equal(r.totalDeclarado, 1900);
  assert.equal(r.totalCalculado, 1900);
  assert.equal(r.reconciliaOk, true);
});

test('parseFormatoA: fase no reconocida genera advertencia y se excluye', () => {
  const csv = [
    '"Expediente\nSIAF",Fase,"Est\nRegistro","Monto\nS/"',
    '0000001,Z,A,"100.00"',
  ].join('\n');
  const r = parseFormatoA(csv);
  assert.equal(r.movimientos.length, 0);
  assert.equal(r.advertencias.length, 1);
  assert.equal(r.advertencias[0].campo, 'fase');
});

test('parseFormatoA: lanza error si no encuentra la cabecera esperada', () => {
  assert.throws(() => parseFormatoA('a,b,c\n1,2,3'));
});

test('parseFormatoA: fila con fase pero sin expediente genera advertencia', () => {
  const csv = [
    '"Expediente\nSIAF",Fase,"Est\nRegistro","Monto\nS/"',
    ',C,A,"100.00"',
  ].join('\n');
  const r = parseFormatoA(csv);
  assert.equal(r.movimientos.length, 0);
  assert.equal(r.advertencias.length, 1);
  assert.equal(r.advertencias[0].campo, 'expediente');
});

test('parseFormatoA: lee las columnas del Formato A completo y distingue "T.C." de "TC"', () => {
  const csv = [
    '"Expediente\nSIAF",Fase,"Est\nRegistro","Monto\nS/",TC,T.C.,Prg,"Prod\nPry","Act\nAI\nObra","Función","Mes\nProceso",TR,Monto',
    '0000001,C,A,"100.00",2,"3.75",0001,3000001,5000001,03,09,00,"26.67"',
  ].join('\n');
  const r = parseFormatoA(csv);
  assert.deepEqual(r.columnasNoReconocidas, []);
  const m = r.movimientos[0];
  assert.equal(m.tc, '2');
  assert.equal(m.tipoCambio, 3.75);
  assert.equal(m.programa, '0001');
  assert.equal(m.prodPry, '3000001');
  assert.equal(m.actAiObra, '5000001');
  assert.equal(m.funcion, '03');
  assert.equal(m.mesProceso, '09');
  assert.equal(m.tipoRecurso, '00');
  assert.equal(m.monto, 26.67);
  assert.equal(m.meta, null); // columna ausente: null, nunca vacío ni 0
});

test('parseFormatoA: lee el encabezado sobre la cabecera', () => {
  const csv = [
    ',REPORTE DE GASTOS (FORMATO A),,',
    'SECTOR,,99 - SECTOR EJEMPLO,',
    'EJECUTORA,008 - UNIDAD EJEMPLO,,Fecha: 29/09/2026',
    'Periodo:,2026,Hora:,11:58:03',
    '"Expediente\nSIAF",Fase,"Est\nRegistro","Monto\nS/"',
    '0000001,C,A,"100.00"',
  ].join('\n');
  const r = parseFormatoA(csv);
  assert.deepEqual(r.encabezado, {
    sector: '99 - SECTOR EJEMPLO',
    ejecutora: '008 - UNIDAD EJEMPLO',
    fecha: '29/09/2026',
    periodo: '2026',
    hora: '11:58:03',
    titulos: ['REPORTE DE GASTOS (FORMATO A)'],
  });
});

test('parseFormatoA: encabezado vacío si el archivo empieza en la cabecera', () => {
  assert.deepEqual(parseFormatoA(CSV_EJEMPLO).encabezado, {});
});
