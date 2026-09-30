import { DELTA, OPUESTA, type Dir, type Grilla } from "./grilla";

/**
 * Mueve a un personaje de casilla en casilla con desplazamiento suave.
 * - Las decisiones se toman al llegar al centro de una casilla.
 * - La dirección pedida queda guardada: si apretaste "arriba" antes del cruce, gira apenas pueda.
 * - Darse vuelta (dirección opuesta) es inmediato, incluso a mitad de camino.
 */
export class MovedorGrilla {
  /** Casilla de origen del tramo actual. */
  x: number;
  y: number;
  /** Dirección hacia la que mira (también cuando está detenido). */
  dir: Dir = "izquierda";
  /** Dirección pedida por el jugador o la IA, aplicada en el próximo cruce posible. */
  pedida: Dir | null = null;
  /** Avance hacia la casilla vecina, de 0 a 1. */
  progreso = 0;
  detenido = true;
  /** Se llama cada vez que llega al centro de una casilla. */
  alLlegar?: (x: number, y: number) => void;

  constructor(
    private readonly grilla: Grilla,
    x: number,
    y: number,
  ) {
    this.x = x;
    this.y = y;
  }

  pedir(dir: Dir): void {
    this.pedida = dir;
    if (!this.detenido && this.progreso > 0 && dir === OPUESTA[this.dir]) {
      const v = this.grilla.vecino(this.x, this.y, this.dir);
      this.x = v.x;
      this.y = v.y;
      this.progreso = 1 - this.progreso;
      this.dir = dir;
    }
  }

  /** Detiene al personaje en el centro de su casilla y olvida el giro pedido (por ejemplo, al entrar a una caja). */
  detener(): void {
    if (this.progreso === 0) {
      this.detenido = true;
      this.pedida = null;
    }
  }

  /** Avanza `dt` segundos a `velocidad` casillas por segundo. */
  actualizar(dt: number, velocidad: number): void {
    let paso = dt * velocidad;
    while (paso > 0) {
      if (this.progreso === 0 && !this.decidir()) return;
      const falta = 1 - this.progreso;
      if (paso < falta) {
        this.progreso += paso;
        return;
      }
      paso -= falta;
      const v = this.grilla.vecino(this.x, this.y, this.dir);
      this.x = v.x;
      this.y = v.y;
      this.progreso = 0;
      this.alLlegar?.(this.x, this.y);
    }
  }

  /** Posición continua en casillas (puede salir del mapa un instante al cruzar una gatera). */
  posicion(): { x: number; y: number } {
    const d = DELTA[this.dir];
    return { x: this.x + d.x * this.progreso, y: this.y + d.y * this.progreso };
  }

  /** En el centro de una casilla: elige hacia dónde seguir. Devuelve false si queda detenido. */
  private decidir(): boolean {
    if (this.pedida && this.grilla.puedeMover(this.x, this.y, this.pedida)) {
      this.dir = this.pedida;
      this.pedida = null;
    } else if (this.detenido || !this.grilla.puedeMover(this.x, this.y, this.dir)) {
      this.detenido = true;
      return false;
    }
    this.detenido = false;
    return true;
  }
}
