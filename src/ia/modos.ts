export type Modo = "patrullar" | "cazar";

/**
 * Horario de modos del gato, como en el Pac-Man original: alterna entre patrullar su rincón
 * y cazar a Quesito. Esas pausas hacen el juego justo: no te persigue todo el tiempo.
 * Una duración negativa significa "para siempre".
 */
export class HorarioModos {
  private i = 0;
  private restante: number;

  constructor(private readonly tramos: [Modo, number][]) {
    this.restante = tramos[0][1];
  }

  get modo(): Modo {
    return this.tramos[this.i][0];
  }

  /** Avanza el tiempo. Devuelve true si el modo cambió en este paso. */
  actualizar(dt: number): boolean {
    if (this.restante < 0) return false;
    this.restante -= dt;
    if (this.restante > 0 || this.i >= this.tramos.length - 1) return false;
    this.i++;
    this.restante = this.tramos[this.i][1];
    return true;
  }
}
