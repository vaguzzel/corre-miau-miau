import type { Casilla, TipoObjeto } from "./grilla";

export type Puntos = Record<TipoObjeto, number>;

/**
 * Lleva la cuenta de los objetos que quedan en el mapa y del puntaje.
 * Se gana cuando no queda queso ni pepinos (el cafecito y las cajas no cuentan).
 */
export class Despensa {
  private readonly objetos = new Map<string, TipoObjeto>();
  private pendientes = 0;
  puntaje = 0;

  constructor(
    objetos: { casilla: Casilla; tipo: TipoObjeto }[],
    private readonly puntos: Puntos,
  ) {
    for (const o of objetos) {
      this.objetos.set(clave(o.casilla.x, o.casilla.y), o.tipo);
      if (cuentaParaGanar(o.tipo)) this.pendientes++;
    }
  }

  /** Quesito llega a una casilla: si hay algo comestible, se lo come. Devuelve lo que comió. */
  comer(x: number, y: number): TipoObjeto | null {
    const k = clave(x, y);
    const tipo = this.objetos.get(k);
    if (!tipo || tipo === "caja") return null;
    this.objetos.delete(k);
    this.puntaje += this.puntos[tipo];
    if (cuentaParaGanar(tipo)) this.pendientes--;
    return tipo;
  }

  /** Puntos que no vienen de comer (por ejemplo, tocar al gato asustado). */
  sumar(puntos: number): void {
    this.puntaje += puntos;
  }

  /** ¿Todavía hay algo en esa casilla? */
  tiene(x: number, y: number): boolean {
    return this.objetos.has(clave(x, y));
  }

  get restantes(): number {
    return this.pendientes;
  }

  get ganado(): boolean {
    return this.pendientes === 0;
  }
}

const clave = (x: number, y: number) => `${x},${y}`;
const cuentaParaGanar = (t: TipoObjeto) => t === "queso" || t === "pepino";
