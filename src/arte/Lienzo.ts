import type { Color } from "./paleta";

/**
 * Lienzo de píxeles en memoria (RGBA). No depende del navegador: el mismo dibujo
 * sirve para crear texturas en Phaser y para exportar PNG desde Node.
 * Las coordenadas son enteras; todo lo que cae fuera del lienzo se ignora.
 */
export class Lienzo {
  readonly datos: Uint8ClampedArray;

  constructor(
    readonly ancho: number,
    readonly alto: number,
  ) {
    this.datos = new Uint8ClampedArray(ancho * alto * 4);
  }

  px(x: number, y: number, c: Color): void {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.ancho || y >= this.alto) return;
    const i = (y * this.ancho + x) * 4;
    this.datos[i] = (c >> 16) & 255;
    this.datos[i + 1] = (c >> 8) & 255;
    this.datos[i + 2] = c & 255;
    this.datos[i + 3] = 255;
  }

  opaco(x: number, y: number): boolean {
    if (x < 0 || y < 0 || x >= this.ancho || y >= this.alto) return false;
    return this.datos[(y * this.ancho + x) * 4 + 3] > 0;
  }

  borrar(x: number, y: number): void {
    if (x < 0 || y < 0 || x >= this.ancho || y >= this.alto) return;
    this.datos[(y * this.ancho + x) * 4 + 3] = 0;
  }

  rect(x: number, y: number, w: number, h: number, c: Color): void {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c);
  }

  hline(x: number, y: number, w: number, c: Color): void {
    this.rect(x, y, w, 1, c);
  }

  vline(x: number, y: number, h: number, c: Color): void {
    this.rect(x, y, 1, h, c);
  }

  /** Borde de un rectángulo (sin relleno). */
  marco(x: number, y: number, w: number, h: number, c: Color): void {
    this.hline(x, y, w, c);
    this.hline(x, y + h - 1, w, c);
    this.vline(x, y, h, c);
    this.vline(x + w - 1, y, h, c);
  }

  /** Óvalo relleno centrado en (cx, cy). Acepta radios con medio píxel. */
  ovalo(cx: number, cy: number, rx: number, ry: number, c: Color): void {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x - cx) / (rx + 0.3);
        const dy = (y - cy) / (ry + 0.3);
        if (dx * dx + dy * dy <= 1) this.px(x, y, c);
      }
    }
  }

  /** Línea de Bresenham. */
  linea(x0: number, y0: number, x1: number, y1: number, c: Color): void {
    x0 = Math.round(x0);
    y0 = Math.round(y0);
    x1 = Math.round(x1);
    y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.px(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y0 += sy;
      }
    }
  }

  /** Rellena con un tramado de ajedrez (dithering) entre dos colores. */
  tramado(x: number, y: number, w: number, h: number, a: Color, b: Color): void {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, (i + j) % 2 ? a : b);
  }

  /** Pinta solo sobre píxeles ya opacos (útil para sombras y brillos dentro de una forma). */
  sobre(x: number, y: number, c: Color): void {
    if (this.opaco(Math.round(x), Math.round(y))) this.px(x, y, c);
  }

  /** Agrega un contorno de 1 px por fuera de todo lo dibujado (vecinos en cruz). */
  contorno(c: Color): void {
    const marcar: number[] = [];
    for (let y = 0; y < this.alto; y++) {
      for (let x = 0; x < this.ancho; x++) {
        if (this.opaco(x, y)) continue;
        if (this.opaco(x - 1, y) || this.opaco(x + 1, y) || this.opaco(x, y - 1) || this.opaco(x, y + 1)) marcar.push(x, y);
      }
    }
    for (let i = 0; i < marcar.length; i += 2) this.px(marcar[i], marcar[i + 1], c);
  }

  /** Copia otro lienzo encima de este (respeta la transparencia). */
  pegar(otro: Lienzo, dx: number, dy: number, espejo = false): void {
    for (let y = 0; y < otro.alto; y++) {
      for (let x = 0; x < otro.ancho; x++) {
        const sx = espejo ? otro.ancho - 1 - x : x;
        const i = (y * otro.ancho + sx) * 4;
        if (otro.datos[i + 3] === 0) continue;
        this.px(dx + x, dy + y, (otro.datos[i] << 16) | (otro.datos[i + 1] << 8) | otro.datos[i + 2]);
      }
    }
  }
}

/**
 * Crea un lienzo a partir de una grilla de caracteres y una paleta.
 * El punto "." es transparente. Ideal para personajes y objetos chicos dibujados a mano.
 */
export function desdeTexto(texto: string, colores: Record<string, Color>): Lienzo {
  const filas = texto.split("\n").map((f) => f.trimEnd()).filter((f) => f.length > 0);
  const ancho = Math.max(...filas.map((f) => f.length));
  const l = new Lienzo(ancho, filas.length);
  filas.forEach((fila, y) =>
    [...fila].forEach((ch, x) => {
      if (ch === "." || ch === " ") return;
      const c = colores[ch];
      if (c === undefined) throw new Error(`Color sin definir para "${ch}"`);
      l.px(x, y, c);
    }),
  );
  return l;
}
