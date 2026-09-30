import { Lienzo } from "./Lienzo";
import { P, type Color } from "./paleta";

// ---------- tonos ----------

/** Oscurece un color (multiplica sus canales). */
export function osc(c: Color, f = 0.78): Color {
  const r = Math.round(((c >> 16) & 255) * f);
  const g = Math.round(((c >> 8) & 255) * f);
  const b = Math.round((c & 255) * f);
  return (r << 16) | (g << 8) | b;
}

/** Aclara un color (lo mezcla con blanco cálido). */
export function clara(c: Color, f = 0.28): Color {
  const mez = (v: number, w: number) => Math.round(v + (w - v) * f);
  return (mez((c >> 16) & 255, 255) << 16) | (mez((c >> 8) & 255, 246) << 8) | mez(c & 255, 226);
}

/** Número pseudoaleatorio estable a partir de dos enteros (el mismo dibujo siempre sale igual). */
export function hash(a: number, b: number): number {
  let h = (a * 374761393 + b * 668265263) ^ 0x5bf03635;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// ---------- volúmenes en vista 3/4 ----------

export interface OpcCaja {
  /** Dibuja detalles sobre la cara frontal (x, y, ancho, alto de la cara). */
  frente?: (l: Lienzo, x: number, y: number, w: number, h: number) => void;
  /** Dibuja detalles sobre la tapa (x, y, ancho, alto de la tapa). */
  tapa?: (l: Lienzo, x: number, y: number, w: number, h: number) => void;
  /** En vez de cara frontal llena: faldón y dos patas (mesas, bancas). */
  patas?: boolean;
}

/**
 * Caja en vista 3/4. La huella ocupa (x, y, w, h); la tapa se dibuja subida `alto` píxeles
 * y la cara frontal ocupa los últimos `alto` píxeles de la huella.
 */
export function caja(l: Lienzo, x: number, y: number, w: number, h: number, alto: number, colTapa: Color, colFrente: Color, o: OpcCaja = {}): void {
  const fy = y + h - alto;
  if (o.patas) {
    l.rect(x, fy, w, 3, colFrente);
    l.hline(x, fy + 2, w, osc(colFrente));
    for (const px of [x + 1, x + w - 4]) {
      l.rect(px, fy, 3, alto, colFrente);
      l.vline(px + 2, fy + 3, alto - 3, osc(colFrente));
    }
  } else {
    l.rect(x, fy, w, alto, colFrente);
    l.hline(x, y + h - 1, w, osc(colFrente, 0.7));
    l.vline(x + w - 1, fy, alto, osc(colFrente, 0.85));
  }
  o.frente?.(l, x, fy, w, alto);
  const ty = y - alto;
  l.rect(x, ty, w, h, colTapa);
  l.hline(x + 1, ty, w - 2, clara(colTapa, 0.35));
  l.vline(x, ty + 1, h - 2, clara(colTapa, 0.2));
  l.hline(x, ty + h - 1, w, osc(colTapa, 0.86));
  o.tapa?.(l, x, ty, w, h);
}

/** Cilindro en vista 3/4 (macetas, pufs, tazas). `base` es la y del suelo. */
export function cilindro(l: Lienzo, cx: number, base: number, rx: number, ry: number, alto: number, lado: Color, tapa: Color): void {
  l.ovalo(cx, base, rx, ry, osc(lado));
  l.rect(Math.round(cx - rx), base - alto, Math.round(rx * 2) + 1, alto, lado);
  l.rect(Math.round(cx + rx * 0.35), base - alto, Math.round(rx * 0.65) + 1, alto, osc(lado, 0.84));
  l.vline(Math.round(cx - rx * 0.6), base - alto + 1, alto - 1, clara(lado, 0.25));
  l.ovalo(cx, base - alto, rx, ry, tapa);
  l.hline(Math.round(cx - rx * 0.5), Math.round(base - alto - ry + 1), Math.round(rx), clara(tapa, 0.35));
}

// ---------- plantas ----------

export type TipoPlanta = "monstera" | "sansevieria" | "helecho" | "suculenta" | "cactus" | "colgante" | "ficus" | "flores" | "hierbas";

const VERDES = [P.hojaOsc, P.hoja, P.hojaMed, P.hojaClara];

/** Hoja en forma de gota, apuntando en `ang` (grados). */
function hoja(l: Lienzo, cx: number, cy: number, largo: number, ancho: number, ang: number, c: Color, nervio?: Color): void {
  const a = (ang * Math.PI) / 180;
  const ux = Math.cos(a);
  const uy = Math.sin(a);
  for (let t = 0; t <= largo; t += 0.5) {
    const w = ancho * Math.sin((t / largo) * Math.PI) * (t < largo * 0.5 ? 1 : 0.9);
    const px = cx + ux * t;
    const py = cy + uy * t;
    for (let s = -w; s <= w; s += 0.5) l.px(px - uy * s, py + ux * s, c);
  }
  if (nervio) for (let t = 1; t < largo * 0.85; t += 1) l.px(cx + ux * t, cy + uy * t, nervio);
}

/** Planta en maceta. `base` es la y del suelo; `r` define el tamaño. */
export function planta(l: Lienzo, cx: number, base: number, tipo: TipoPlanta, r: number, maceta: Color = P.terracota, flor: Color = P.rosa): void {
  const altoMaceta = Math.max(4, Math.round(r * 0.55));
  cilindro(l, cx, base, Math.max(3, r * 0.48), Math.max(1.5, r * 0.2), altoMaceta, maceta, P.maderaOsc);
  const fy = base - altoMaceta;
  const sem = Math.round(cx * 7 + base * 3);

  switch (tipo) {
    case "monstera":
      for (let i = 0; i < 9; i++) {
        const ang = -180 + i * 22 + hash(i, sem) * 10;
        const c = VERDES[1 + (i % 3)];
        hoja(l, cx, fy - 2, r * (0.95 + hash(sem, i) * 0.3), r * 0.36, ang, c, osc(c));
        // Cortes típicos de la monstera
        const a = (ang * Math.PI) / 180;
        for (const k of [0.45, 0.7]) l.px(cx + Math.cos(a) * r * k + Math.sin(a) * 2, fy - 2 + Math.sin(a) * r * k - Math.cos(a) * 2, osc(c, 0.6));
      }
      break;
    case "sansevieria":
      for (let i = 0; i < 7; i++) {
        const x = cx - 4 + i * 1.3;
        const h = r * (1.2 + hash(i, sem) * 0.6);
        const ang = -90 + (i - 3) * 7;
        hoja(l, x, fy, h, 1.6, ang, i % 2 ? P.hoja : P.hojaOsc, P.mostazaClara);
      }
      break;
    case "helecho":
      for (let i = 0; i < 11; i++) {
        const ang = -175 + i * 17;
        const a = (ang * Math.PI) / 180;
        for (let t = 2; t < r * 1.1; t += 1.5) {
          const px = cx + Math.cos(a) * t;
          const py = fy - 1 + Math.sin(a) * t + (t > r * 0.6 ? (t - r * 0.6) * 0.5 : 0);
          l.px(px, py, P.hoja);
          l.px(px - Math.sin(a) * 1.5, py + Math.cos(a) * 1.5, P.hojaMed);
          l.px(px + Math.sin(a) * 1.5, py - Math.cos(a) * 1.5, P.hojaClara);
        }
      }
      break;
    case "suculenta":
      for (let anillo = 0; anillo < 3; anillo++) {
        const n = 8 - anillo * 2;
        const lr = r * (0.8 - anillo * 0.22);
        const c = [P.salvia, P.salviaClara, P.hojaClara][anillo];
        for (let i = 0; i < n; i++) {
          const ang = (i / n) * 360 + anillo * 22;
          const a = (ang * Math.PI) / 180;
          l.ovalo(cx + Math.cos(a) * lr * 0.55, fy - 2 + Math.sin(a) * lr * 0.3, lr * 0.32, lr * 0.2, c);
        }
      }
      l.px(cx, fy - 3, P.rosa);
      break;
    case "cactus": {
      const h = Math.round(r * 1.3);
      l.rect(cx - 2, fy - h, 5, h, P.hojaMed);
      l.vline(cx - 2, fy - h, h, P.hojaClara);
      l.vline(cx + 2, fy - h, h, P.hoja);
      l.rect(cx + 3, fy - h + 4, 3, 2, P.hojaMed);
      l.rect(cx + 5, fy - h + 1, 2, 4, P.hojaMed);
      for (let j = 1; j < h; j += 3) l.px(cx + (j % 2 ? -1 : 1), fy - j, P.cremaClara);
      l.ovalo(cx, fy - h - 1, 1.5, 1, P.rosa);
      break;
    }
    case "colgante":
      for (let i = 0; i < 7; i++) hoja(l, cx, fy - 1, r * 0.6, r * 0.28, -170 + i * 27, VERDES[1 + (i % 3)]);
      for (const d of [-1, 1]) {
        for (let t = 0; t < r * 1.6; t += 1) {
          const px = cx + d * (r * 0.45 + Math.sin(t * 0.5) * 1.5);
          const py = fy + t;
          l.px(px, py, P.hoja);
          if (t % 3 === 0) l.ovalo(px + d, py, 1.5, 1, t % 6 ? P.hojaClara : P.hojaMed);
        }
      }
      break;
    case "ficus":
      l.vline(cx, fy - Math.round(r * 1.5), Math.round(r * 1.5), P.maderaOsc);
      for (let i = 0; i < 11; i++) {
        const y = fy - r * 0.2 - i * r * 0.13;
        const lado = i % 2 ? 1 : -1;
        l.ovalo(cx + lado * (2 + hash(i, sem) * 3), y, r * 0.3, r * 0.2, VERDES[i % 3]);
        l.px(cx + lado * (2 + hash(i, sem) * 3), y, P.hojaClara);
      }
      break;
    case "flores":
    case "hierbas":
      for (let i = 0; i < 10; i++) {
        const x = cx + (hash(i, sem) - 0.5) * r * 1.3;
        const y = fy - 1 - hash(sem, i) * r * 0.9;
        l.ovalo(x, y, 1.6, 1.2, VERDES[1 + (i % 3)]);
      }
      if (tipo === "flores")
        for (let i = 0; i < 5; i++) {
          const x = cx + (hash(i + 20, sem) - 0.5) * r;
          const y = fy - 2 - hash(sem, i + 20) * r * 0.8;
          l.px(x, y - 1, flor);
          l.px(x - 1, y, flor);
          l.px(x + 1, y, flor);
          l.px(x, y + 1, flor);
          l.px(x, y, P.mostazaClara);
        }
      break;
  }
}

// ---------- objetos chicos (se apoyan en `base`) ----------

export function libros(l: Lienzo, cx: number, base: number, colores: Color[]): void {
  colores.forEach((c, i) => {
    const w = 12 - i * 2;
    const y = base - (i + 1) * 3;
    l.rect(cx - w / 2, y, w, 3, c);
    l.hline(cx - w / 2, y, w, clara(c, 0.3));
    l.vline(cx + w / 2 - 1, y + 1, 2, P.cremaClara);
  });
}

export function lomos(l: Lienzo, x: number, y: number, w: number, h: number, sem = 1): void {
  const cols = [P.terracota, P.mostaza, P.salvia, P.azul, P.crema, P.lila, P.terracotaClara, P.azulClaro];
  let px = x;
  let i = 0;
  while (px < x + w - 1) {
    const bw = 2 + Math.floor(hash(i, sem) * 2);
    const bh = h - Math.floor(hash(sem, i) * 3);
    const c = cols[Math.floor(hash(i * 3, sem) * cols.length)];
    l.rect(px, y + h - bh, bw, bh, c);
    l.hline(px, y + h - bh, bw, clara(c, 0.3));
    px += bw + (hash(i, sem * 2) < 0.15 ? 1 : 0);
    i++;
  }
}

export function taza(l: Lienzo, cx: number, base: number, c: Color = P.cremaClara, vapor = true): void {
  cilindro(l, cx, base, 3, 1.2, 4, c, P.maderaOsc);
  l.px(cx + 4, base - 3, c);
  l.px(cx + 4, base - 2, c);
  if (vapor) {
    l.px(cx - 1, base - 8, P.cremaClara);
    l.px(cx, base - 9, P.cremaClara);
    l.px(cx - 1, base - 10, P.cremaClara);
  }
}

export function tetera(l: Lienzo, cx: number, base: number, c: Color): void {
  l.ovalo(cx, base - 4, 5, 4, c);
  l.ovalo(cx - 2, base - 6, 1.5, 1, clara(c, 0.5));
  l.rect(cx - 2, base - 9, 5, 2, c);
  l.px(cx, base - 10, P.maderaOsc);
  l.linea(cx + 5, base - 4, cx + 8, base - 7, c);
  l.linea(cx - 5, base - 6, cx - 7, base - 3, osc(c));
}

export function vela(l: Lienzo, cx: number, base: number): void {
  l.rect(cx - 1, base - 5, 3, 5, P.cremaClara);
  l.vline(cx + 1, base - 4, 4, P.crema);
  l.px(cx, base - 6, P.fuegoClaro);
  l.px(cx, base - 7, P.fuego);
}

export function marco(l: Lienzo, cx: number, base: number, c: Color, dentro: Color = P.cielo): void {
  l.rect(cx - 4, base - 10, 9, 10, c);
  l.rect(cx - 3, base - 9, 7, 7, dentro);
  l.px(cx - 1, base - 6, P.grisOsc);
  l.px(cx + 1, base - 6, P.grisOsc);
  l.rect(cx - 1, base - 5, 3, 2, P.grisOsc);
}

export function lampara(l: Lienzo, cx: number, base: number, pantalla: Color = P.crema): void {
  cilindro(l, cx, base, 3, 1, 2, P.madera, P.maderaMed);
  l.vline(cx, base - 9, 7, P.maderaOsc);
  for (let j = 0; j < 7; j++) l.hline(cx - 3 - Math.floor(j / 2), base - 16 + j, 7 + Math.floor(j / 2) * 2, j === 6 ? P.luzClara : pantalla);
  l.hline(cx - 2, base - 16, 5, clara(pantalla, 0.4));
}

export function florero(l: Lienzo, cx: number, base: number, c: Color): void {
  const flores = [P.rosa, P.mostazaClara, P.cremaClara, P.lilaClara];
  [[-3, -10], [0, -12], [3, -9], [-1, -8], [2, -11]].forEach(([dx, dy], i) => {
    l.linea(cx, base - 5, cx + dx, base + dy, P.hoja);
    l.px(cx + dx, base + dy, flores[i % 4]);
    l.px(cx + dx + 1, base + dy, flores[i % 4]);
    l.px(cx + dx, base + dy - 1, flores[i % 4]);
  });
  l.rect(cx - 2, base - 5, 5, 5, c);
  l.hline(cx - 1, base - 6, 3, c);
  l.vline(cx - 2, base - 4, 3, clara(c, 0.4));
}

export function ovillo(l: Lienzo, cx: number, base: number, c: Color): void {
  l.ovalo(cx, base - 3, 3, 3, c);
  l.linea(cx - 2, base - 4, cx + 1, base - 5, clara(c, 0.4));
  l.linea(cx - 2, base - 2, cx + 2, base - 3, clara(c, 0.4));
}

export function tocadiscos(l: Lienzo, x: number, y: number): void {
  l.rect(x, y, 16, 11, P.crema);
  l.hline(x, y, 16, P.cremaClara);
  l.ovalo(x + 6, y + 5, 4.5, 3.5, P.negroPiano);
  l.ovalo(x + 6, y + 5, 1.5, 1, P.rojo);
  l.linea(x + 13, y + 1, x + 9, y + 6, P.grisOsc);
}
