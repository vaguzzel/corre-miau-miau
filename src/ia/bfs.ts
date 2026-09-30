import type { Casilla, Dir, Grilla } from "../sistemas/grilla";

const DIRS: Dir[] = ["arriba", "izquierda", "abajo", "derecha"];

/**
 * Búsqueda en anchura (BFS): explora el laberinto "en ondas" desde `desde`
 * hasta encontrar `hasta`, y devuelve el primer paso del camino más corto.
 * Devuelve null si ya está ahí o si no hay camino.
 * `prohibida` (opcional) descarta ese primer paso si hay otra salida: sirve para que el gato no se dé vuelta.
 */
export function primerPasoBFS(grilla: Grilla, desde: Casilla, hasta: Casilla, prohibida?: Dir): Dir | null {
  if (desde.x === hasta.x && desde.y === hasta.y) return null;
  const clave = (c: Casilla) => c.y * grilla.ancho + c.x;

  // Para cada casilla visitada guardamos con qué dirección se salió de `desde` para llegar a ella.
  const primerPaso = new Map<number, Dir>();
  const visitadas = new Set<number>([clave(desde)]);
  const cola: Casilla[] = [];

  const libres = DIRS.filter((d) => grilla.puedeMover(desde.x, desde.y, d));
  const salidas = libres.length > 1 ? libres.filter((d) => d !== prohibida) : libres;
  for (const d of salidas) {
    const v = grilla.vecino(desde.x, desde.y, d);
    visitadas.add(clave(v));
    primerPaso.set(clave(v), d);
    cola.push(v);
  }

  for (let i = 0; i < cola.length; i++) {
    const c = cola[i];
    const paso = primerPaso.get(clave(c))!;
    if (c.x === hasta.x && c.y === hasta.y) return paso;
    for (const d of DIRS) {
      if (!grilla.puedeMover(c.x, c.y, d)) continue;
      const v = grilla.vecino(c.x, c.y, d);
      const k = clave(v);
      if (visitadas.has(k)) continue;
      visitadas.add(k);
      primerPaso.set(k, paso);
      cola.push(v);
    }
  }
  return null;
}
