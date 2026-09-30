import { OPUESTA, type Casilla, type Dir, type Grilla } from "../sistemas/grilla";

const DIRS: Dir[] = ["arriba", "izquierda", "abajo", "derecha"];

/**
 * IA de Tomasito (nivel 1): en cada cruce elige un camino libre al azar, sin devolverse.
 * Con probabilidad `probPerseguir` elige en cambio el camino que queda más cerca en línea recta
 * de Quesito (el método "codicioso" de los fantasmas de Pac-Man).
 */
export function elegirAzar(
  grilla: Grilla,
  desde: Casilla,
  dirActual: Dir,
  objetivo: Casilla,
  probPerseguir: number,
  azar: () => number = Math.random,
): Dir {
  let opciones = DIRS.filter((d) => d !== OPUESTA[dirActual] && grilla.puedeMover(desde.x, desde.y, d));
  // Callejón sin salida: la única opción es devolverse.
  if (opciones.length === 0) opciones = [OPUESTA[dirActual]];

  if (azar() < probPerseguir) {
    let mejor = opciones[0];
    let menor = Infinity;
    for (const d of opciones) {
      const v = grilla.vecino(desde.x, desde.y, d);
      const dist = distanciaCuadrada(grilla, v, objetivo);
      if (dist < menor) {
        menor = dist;
        mejor = d;
      }
    }
    return mejor;
  }
  return opciones[Math.floor(azar() * opciones.length)];
}

/** Distancia en línea recta (al cuadrado), considerando que las gateras unen los bordes. */
export function distanciaCuadrada(grilla: Grilla, a: Casilla, b: Casilla): number {
  let dx = Math.abs(a.x - b.x);
  dx = Math.min(dx, grilla.ancho - dx);
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}
