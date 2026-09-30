import type { Casilla, Dir, Grilla } from "../sistemas/grilla";

const DIRS: Dir[] = ["arriba", "izquierda", "abajo", "derecha"];

/**
 * Cola de prioridad con un montículo binario (heap): siempre entrega primero
 * el elemento con menor prioridad, en tiempo logarítmico.
 */
class ColaPrioridad<T> {
  private datos: { valor: T; prioridad: number }[] = [];

  get vacia(): boolean {
    return this.datos.length === 0;
  }

  agregar(valor: T, prioridad: number): void {
    const d = this.datos;
    d.push({ valor, prioridad });
    let i = d.length - 1;
    while (i > 0) {
      const padre = (i - 1) >> 1;
      if (d[padre].prioridad <= d[i].prioridad) break;
      [d[padre], d[i]] = [d[i], d[padre]];
      i = padre;
    }
  }

  sacar(): T {
    const d = this.datos;
    const primero = d[0];
    const ultimo = d.pop()!;
    if (d.length > 0) {
      d[0] = ultimo;
      let i = 0;
      for (;;) {
        const a = 2 * i + 1;
        const b = a + 1;
        let menor = i;
        if (a < d.length && d[a].prioridad < d[menor].prioridad) menor = a;
        if (b < d.length && d[b].prioridad < d[menor].prioridad) menor = b;
        if (menor === i) break;
        [d[menor], d[i]] = [d[i], d[menor]];
        i = menor;
      }
    }
    return primero.valor;
  }
}

/** Heurística de A*: distancia Manhattan, considerando el atajo de las gateras (bordes unidos). */
export function manhattan(grilla: Grilla, a: Casilla, b: Casilla): number {
  const dx = Math.abs(a.x - b.x);
  return Math.min(dx, grilla.ancho - dx) + Math.abs(a.y - b.y);
}

/**
 * A*: como BFS, pero explora primero lo que *parece* más cerca de la meta.
 * Cada casilla tiene un costo f = g + h:
 *   g = pasos ya caminados desde el inicio,
 *   h = estimación de lo que falta (Manhattan).
 * Como h nunca sobreestima, el camino encontrado es el más corto, visitando menos casillas que BFS.
 * Devuelve el primer paso del camino (o null si ya llegó o no hay camino).
 * `prohibida` descarta ese primer paso si hay otra salida (para que el gato no se dé vuelta).
 */
export function primerPasoAEstrella(grilla: Grilla, desde: Casilla, hasta: Casilla, prohibida?: Dir): Dir | null {
  if (desde.x === hasta.x && desde.y === hasta.y) return null;
  const clave = (c: Casilla) => c.y * grilla.ancho + c.x;
  const g = new Map<number, number>();
  const primerPaso = new Map<number, Dir>();
  const cerradas = new Set<number>();
  const abiertas = new ColaPrioridad<Casilla>();

  const libres = DIRS.filter((d) => grilla.puedeMover(desde.x, desde.y, d));
  const salidas = libres.length > 1 ? libres.filter((d) => d !== prohibida) : libres;
  cerradas.add(clave(desde));
  for (const d of salidas) {
    const v = grilla.vecino(desde.x, desde.y, d);
    g.set(clave(v), 1);
    primerPaso.set(clave(v), d);
    abiertas.agregar(v, 1 + manhattan(grilla, v, hasta));
  }

  while (!abiertas.vacia) {
    const c = abiertas.sacar();
    const kc = clave(c);
    if (cerradas.has(kc)) continue;
    cerradas.add(kc);
    if (c.x === hasta.x && c.y === hasta.y) return primerPaso.get(kc)!;
    const gc = g.get(kc)!;
    for (const d of DIRS) {
      if (!grilla.puedeMover(c.x, c.y, d)) continue;
      const v = grilla.vecino(c.x, c.y, d);
      const kv = clave(v);
      if (cerradas.has(kv)) continue;
      if (gc + 1 < (g.get(kv) ?? Infinity)) {
        g.set(kv, gc + 1);
        primerPaso.set(kv, primerPaso.get(kc)!);
        abiertas.agregar(v, gc + 1 + manhattan(grilla, v, hasta));
      }
    }
  }
  return null;
}

/**
 * Objetivo de Eren: la casilla libre que está hasta `pasos` casillas delante de Quesito,
 * en la dirección en que corre. Así Eren no lo sigue: le corta el paso.
 */
export function casillaAdelante(grilla: Grilla, desde: Casilla, dir: Dir, pasos: number): Casilla {
  let c = desde;
  for (let i = 0; i < pasos; i++) {
    if (!grilla.puedeMover(c.x, c.y, dir)) break;
    c = grilla.vecino(c.x, c.y, dir);
  }
  return c;
}
