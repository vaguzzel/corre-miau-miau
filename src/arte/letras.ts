import type { Lienzo } from "./Lienzo";
import type { Color } from "./paleta";

// Letra de píxeles de 3×5 para letreros chicos (nombres, felpudo).
const GLIFOS: Record<string, string> = {
  A: "010101111101101",
  B: "110101110101110",
  E: "111100110100111",
  G: "011100101101011",
  H: "101101111101101",
  I: "111010010010111",
  L: "100100100100111",
  M: "101111111101101",
  N: "101111111111101",
  Ñ: "111000110101101",
  O: "010101101101010",
  P: "110101110100100",
  C: "011100100100011",
  D: "110101101101110",
  F: "111100110100100",
  K: "101101110101101",
  U: "101101101101111",
  Y: "101101010010010",
  R: "110101110101101",
  S: "011100010001110",
  T: "111010010010010",
  V: "101101101101010",
};

/** Escribe `texto` centrado en `cx`, con la parte de arriba en `y`. */
export function escribir(l: Lienzo, texto: string, cx: number, y: number, c: Color): void {
  const ancho = texto.length * 4 - 1;
  let x = Math.round(cx - ancho / 2);
  for (const ch of texto.toUpperCase()) {
    const g = GLIFOS[ch];
    if (g) for (let i = 0; i < 15; i++) if (g[i] === "1") l.px(x + (i % 3), y + Math.floor(i / 3), c);
    x += 4;
  }
}
