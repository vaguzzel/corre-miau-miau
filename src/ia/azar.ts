import { OPUESTA, type Casilla, type Dir, type Grilla } from "../sistemas/grilla";
import { primerPasoBFS } from "./bfs";

const DIRS: Dir[] = ["arriba", "izquierda", "abajo", "derecha"];

/**
 * IA de Tomasito (nivel 1). En cada cruce:
 * - con probabilidad `probPerseguir` sigue el camino más corto hacia Quesito (BFS);
 * - si no, se distrae y elige un camino libre al azar.
 * Como en Pac-Man, nunca se da vuelta salvo en un callejón sin salida.
 */
export function elegirAzar(
  grilla: Grilla,
  desde: Casilla,
  dirActual: Dir,
  objetivo: Casilla,
  probPerseguir: number,
  azar: () => number = Math.random,
): Dir {
  if (azar() < probPerseguir) {
    const paso = primerPasoBFS(grilla, desde, objetivo, OPUESTA[dirActual]);
    if (paso) return paso;
  }
  let opciones = DIRS.filter((d) => d !== OPUESTA[dirActual] && grilla.puedeMover(desde.x, desde.y, d));
  // Callejón sin salida: la única opción es devolverse.
  if (opciones.length === 0) opciones = [OPUESTA[dirActual]];
  return opciones[Math.floor(azar() * opciones.length)];
}
