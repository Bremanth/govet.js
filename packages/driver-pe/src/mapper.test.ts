// govet-pe/mapper.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizarCabecera, parseMonto, parseFechaSiaf, esFaseValida } from './mapper';

test('normalizarCabecera: ignora tildes, saltos de línea y mayúsculas', () => {
  assert.equal(normalizarCabecera('Expediente\nSIAF'), 'expediente siaf');
  assert.equal(normalizarCabecera('Fecha Aprobación'), 'fecha aprobacion');
  assert.equal(normalizarCabecera('COD. DOC.'), 'cod doc');
});

test('parseMonto: coma de miles', () => {
  assert.equal(parseMonto('9,837.41'), 9837.41);
});

test('parseMonto: el signo negativo va al final en el SIAF', () => {
  assert.equal(parseMonto('960.00-'), -960);
});

test('parseMonto: nunca devuelve 0 para vacío o inválido, siempre null', () => {
  assert.equal(parseMonto(''), null);
  assert.equal(parseMonto(undefined), null);
  assert.equal(parseMonto('abc'), null);
});

test('parseFechaSiaf: formato dd/mm/yyyy', () => {
  const f = parseFechaSiaf('28/09/2026');
  assert.equal(f?.getFullYear(), 2026);
  assert.equal(f?.getMonth(), 8);
  assert.equal(f?.getDate(), 28);
});

test('parseFechaSiaf: null si no calza el formato', () => {
  assert.equal(parseFechaSiaf('2026-09-28'), null);
  assert.equal(parseFechaSiaf(''), null);
  assert.equal(parseFechaSiaf(null), null);
});

test('esFaseValida', () => {
  assert.equal(esFaseValida('C'), true);
  assert.equal(esFaseValida('Z'), false);
});
