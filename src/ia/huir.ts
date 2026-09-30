import { OPUESTA, type Casilla, type Dir, type Grilla } from "../sistemas/grilla";
import { mapaDistancias } from "./bfs";

const DIRS: Dir[] = ["arriba", "izquierda", "abajo", "derecha"];

/**
 * Gato asustado (después de un pepino): en cada cruce elige el camino que lo deja
 * más lejos de Quesito, medido en pasos reales por los pasillos (BFS desde Quesito).
 * Como siempre, no se da vuelta salvo en un callejón.
 */
export function elegirHuida(grilla: Grilla, desde: Casilla, dirActual: Dir, amenaza: Casilla): Dir {
  const dist = mapaDistancias(grilla, amenaza);
  let opciones = DIRS.filter((d) => d !== OPUESTA[dirActual] && grilla.puedeMover(desde.x, desde.y, d));
  if (opciones.length === 0) opciones = [OPUESTA[dirActual]];
  let mejor = opciones[0];
  let lejos = -Infinity;
  for (const d of opciones) {
    const v = grilla.vecino(desde.x, desde.y, d);
    const dv = dist[v.y * grilla.ancho + v.x];
    if (dv > lejos) {
      lejos = dv;
      mejor = d;
    }
  }
  return mejor;
}
