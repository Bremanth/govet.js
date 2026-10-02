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
