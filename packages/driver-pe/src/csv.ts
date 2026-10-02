// govet-pe/csv.ts
//
// Un parser CSV "a mano" porque el export del SIAF trae celdas de cabecera
// con saltos de línea DENTRO de comillas (ej. "Expediente\nSIAF"). Un split
// ingenuo por '\n' rompe la fila de cabecera en dos. Este parser sigue el
// estándar RFC 4180: solo una coma o un salto de línea FUERA de comillas
// termina el campo o la fila.

export function parseCsv(texto: string): string[][] {
  const filas: string[][] = [];
  let fila: string[] = [];
  let campo = '';
  let dentroDeComillas = false;

  // Normaliza fin de línea Windows sin afectar comillas
  const s = texto.replace(/\r\n/g, '\n');

  for (let i = 0; i < s.length; i++) {
    const c = s[i];

    if (dentroDeComillas) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          campo += '"'; // comilla escapada
          i++;
        } else {
          dentroDeComillas = false;
        }
      } else {
        campo += c;
      }
      continue;
    }

    if (c === '"') {
      dentroDeComillas = true;
    } else if (c === ',') {
      fila.push(campo);
      campo = '';
    } else if (c === '\n') {
      fila.push(campo);
      filas.push(fila);
      fila = [];
      campo = '';
    } else {
      campo += c;
    }
  }
  // última fila si el archivo no termina en salto de línea
  if (campo.length > 0 || fila.length > 0) {
    fila.push(campo);
    filas.push(fila);
  }

  return filas;
}
