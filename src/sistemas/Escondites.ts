import type { Casilla } from "./grilla";

/**
 * Cajas de cartón: Quesito entra, se queda quieto y el gato pierde su rastro.
 * - Cada caja se puede usar `usosPorVida` veces por vida.
 * - Dentro se puede estar como máximo `maxSeg` segundos; después Quesito "se asoma" y queda a la vista.
 */
export class Escondites {
  private usos = new Map<string, number>();
  private cajaActual: string | null = null;
  restante = 0;

  constructor(
    private readonly cajas: Casilla[],
    private readonly usosPorVida: number,
    private readonly maxSeg: number,
  ) {
    this.reiniciar();
  }

  /** Al empezar una vida nueva, las cajas vuelven a tener todos sus usos. */
  reiniciar(): void {
    for (const c of this.cajas) this.usos.set(clave(c.x, c.y), this.usosPorVida);
    this.cajaActual = null;
    this.restante = 0;
  }

  get escondido(): boolean {
    return this.cajaActual !== null;
  }

  usosDe(x: number, y: number): number {
    return this.usos.get(clave(x, y)) ?? 0;
  }

  /** Quesito llega a una casilla. Devuelve true si se metió a una caja. */
  entrar(x: number, y: number): boolean {
    const k = clave(x, y);
    const quedan = this.usos.get(k);
    if (!quedan || this.cajaActual) return false;
    this.usos.set(k, quedan - 1);
    this.cajaActual = k;
    this.restante = this.maxSeg;
    return true;
  }

  /** Quesito se movió fuera de la caja. */
  salir(): void {
    this.cajaActual = null;
    this.restante = 0;
  }

  /** Avanza el tiempo. Devuelve true en el momento en que se acaba el tiempo dentro de la caja. */
  actualizar(dt: number): boolean {
    if (!this.cajaActual) return false;
    this.restante -= dt;
    if (this.restante > 0) return false;
    this.salir();
    return true;
  }
}

const clave = (x: number, y: number) => `${x},${y}`;
