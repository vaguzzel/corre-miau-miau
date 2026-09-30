import { Lienzo } from "./Lienzo";
import { P, type Color } from "./paleta";
import { caja } from "./primitivas";

// Piezas comunes a todas las habitaciones: tamaño de casilla, muebles y tarimas.

/** Tamaño de una casilla en píxeles de arte. */
export const T = 24;
/** Alto extra de la pared del fondo, por encima de la fila 0 (vista 3/4). */
export const ALTO_PARED = 40;

/** Muebles de cada habitación: [columna, fila, ancho, alto] en casillas. Coinciden con los muros del mapa. */
export const BLOQUES: [number, number, number, number][] = [
  [2, 2, 2, 2], [5, 2, 3, 2], [9, 1, 1, 3], [11, 2, 5, 2], [17, 1, 1, 3], [19, 2, 3, 2], [23, 2, 2, 2],
  [2, 5, 2, 2], [2, 8, 2, 1], [5, 5, 1, 4], [7, 5, 3, 1], [7, 7, 1, 2], [10, 6, 7, 3], [17, 5, 3, 1], [19, 7, 1, 2], [21, 5, 1, 4], [23, 5, 2, 2], [23, 8, 2, 1],
  [2, 10, 2, 1], [2, 12, 2, 2], [5, 10, 1, 4], [7, 10, 1, 2], [7, 13, 3, 1], [10, 10, 7, 3], [17, 13, 3, 1], [19, 10, 1, 2], [21, 10, 1, 4], [23, 10, 2, 1], [23, 12, 2, 2],
  [2, 15, 2, 2], [5, 15, 3, 2], [9, 15, 1, 3], [11, 15, 5, 2], [17, 15, 1, 3], [19, 15, 3, 2], [23, 15, 2, 2],
];

/** Margen del lienzo de cada mueble: a los lados, hacia arriba (para lo alto) y hacia abajo. */
const MARGEN = 6;
const ARRIBA = 52;
const ABAJO = 4;

export type Dibujo = (l: Lienzo, x: number, y: number, w: number, h: number) => void;

export interface SpriteMueble {
  lienzo: Lienzo;
  /** Esquina superior izquierda en el mundo (píxeles). */
  x: number;
  y: number;
  /** Profundidad: la base del mueble. Lo que esté más abajo en pantalla se dibuja delante. */
  profundidad: number;
}

/** Foto HD colgada en la pared: el marco se dibuja en pixel art y la foto se pone encima en el juego. */
export interface Retrato {
  clave: string;
  /** Rectángulo interior del marco, en coordenadas del mundo. */
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface EstiloTarima {
  tapa: Color;
  linea: Color;
  borde: Color;
  frente: Color;
}

export const TARIMA_MADERA: EstiloTarima = { tapa: 0x9c6a42, linea: 0x8e5f3a, borde: P.maderaMed, frente: P.maderaOsc };

/**
 * Tarima baja que ocupa exactamente la huella de cada mueble. Es la señal visual de "aquí no se pasa":
 * aunque un mueble no llene todo su espacio (un piano, unas plantas), su tarima marca el borde del muro.
 */
function tarima(l: Lienzo, x: number, y: number, w: number, h: number, e: EstiloTarima): void {
  caja(l, x, y, w, h, 4, e.tapa, e.frente, {
    tapa: (l2, tx, ty, tw, th) => {
      for (let j = 3; j < th - 1; j += 4) l2.hline(tx + 1, ty + j, tw - 2, e.linea);
      l2.marco(tx, ty, tw, th, e.borde);
    },
  });
}

/** Dibuja cada mueble del catálogo (uno por bloque, en el mismo orden) en su propio lienzo. */
export function construirMuebles(catalogo: Dibujo[], estilo: EstiloTarima = TARIMA_MADERA, bloques = BLOQUES): SpriteMueble[] {
  if (catalogo.length !== bloques.length) throw new Error(`El catálogo tiene ${catalogo.length} muebles y hay ${bloques.length} bloques`);
  return bloques.map(([bx, by, bw, bh], i) => {
    const w = bw * T;
    const h = bh * T;
    const l = new Lienzo(w + MARGEN * 2, h + ARRIBA + ABAJO);
    tarima(l, MARGEN, ARRIBA, w, h, estilo);
    catalogo[i](l, MARGEN, ARRIBA, w, h);
    l.contorno(P.tinta);
    return { lienzo: l, x: bx * T - MARGEN, y: by * T - ARRIBA, profundidad: (by + bh) * T };
  });
}

/** Una habitación completa: todo lo que el juego necesita para dibujar un nivel. */
export interface Habitacion {
  piso: (ancho: number, alto: number, filaGatera: number) => Lienzo;
  muebles: () => SpriteMueble[];
  muroInferior: (ancho: number) => Lienzo;
  fotos: Retrato[];
  /** Colores del mini-mapa */
  mini: { piso: number; muro: number };
}
