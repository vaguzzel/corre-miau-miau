// Lógica pura de la grilla: no depende de Phaser, así se puede probar con Vitest.

export type Dir = "arriba" | "abajo" | "izquierda" | "derecha";

export const DELTA: Record<Dir, { x: number; y: number }> = {
  arriba: { x: 0, y: -1 },
  abajo: { x: 0, y: 1 },
  izquierda: { x: -1, y: 0 },
  derecha: { x: 1, y: 0 },
};

export const OPUESTA: Record<Dir, Dir> = {
  arriba: "abajo",
  abajo: "arriba",
  izquierda: "derecha",
  derecha: "izquierda",
};

export interface Casilla {
  x: number;
  y: number;
}

export type TipoObjeto = "queso" | "pepino" | "cafe" | "caja" | "corazon";

export class Grilla {
  readonly ancho: number;
  readonly alto: number;
  readonly inicioRaton: Casilla;
  readonly inicioGato: Casilla;
  /** Dónde espera Violeta en el nivel final (si el mapa tiene una V). */
  readonly violeta: Casilla | null = null;
  readonly objetos: { casilla: Casilla; tipo: TipoObjeto }[] = [];
  readonly gateras: Casilla[] = [];
  private readonly muros: boolean[][];

  constructor(texto: string) {
    const filas = texto.split("\n").map((f) => f.trimEnd()).filter((f) => f.length > 0);
    this.alto = filas.length;
    this.ancho = filas[0].length;
    if (filas.some((f) => f.length !== this.ancho)) throw new Error("Todas las filas del mapa deben tener el mismo largo");

    let raton: Casilla | null = null;
    let gato: Casilla | null = null;
    let violeta: Casilla | null = null;
    this.muros = filas.map((fila, y) =>
      [...fila].map((c, x) => {
        switch (c) {
          case "#":
            return true;
          case "=":
            this.gateras.push({ x, y });
            return false;
          case "Q":
            raton = { x, y };
            this.objetos.push({ casilla: { x, y }, tipo: "queso" });
            return false;
          case "G":
            gato = { x, y };
            this.objetos.push({ casilla: { x, y }, tipo: "queso" });
            return false;
          case ".":
            this.objetos.push({ casilla: { x, y }, tipo: "queso" });
            return false;
          case "o":
            this.objetos.push({ casilla: { x, y }, tipo: "pepino" });
            return false;
          case "c":
            this.objetos.push({ casilla: { x, y }, tipo: "cafe" });
            return false;
          case "b":
            this.objetos.push({ casilla: { x, y }, tipo: "caja" });
            return false;
          case "h":
            this.objetos.push({ casilla: { x, y }, tipo: "corazon" });
            return false;
          case "V":
            violeta = { x, y };
            return false;
          case " ":
            return false;
          default:
            throw new Error(`Carácter desconocido en el mapa: "${c}" (${x}, ${y})`);
        }
      }),
    );
    if (!raton) throw new Error("El mapa necesita una Q (Quesito)");
    if (!gato && !violeta) throw new Error("El mapa necesita una G (gato) o una V (Violeta)");
    this.inicioRaton = raton;
    this.inicioGato = gato ?? raton;
    this.violeta = violeta;
  }

  /** Casilla vecina en una dirección. Por las gateras, salir por un borde te deja en el otro. */
  vecino(x: number, y: number, dir: Dir): Casilla {
    const d = DELTA[dir];
    return {
      x: (x + d.x + this.ancho) % this.ancho,
      y: (y + d.y + this.alto) % this.alto,
    };
  }

  esMuro(x: number, y: number): boolean {
    return this.muros[y]?.[x] ?? true;
  }

  puedeMover(x: number, y: number, dir: Dir): boolean {
    const v = this.vecino(x, y, dir);
    return !this.esMuro(v.x, v.y);
  }
}
