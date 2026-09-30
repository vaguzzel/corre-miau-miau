import { ALTO_PARED, construirMuebles, T, type Dibujo, type EstiloTarima, type Habitacion, type Retrato } from "./habitacion";
import { escribir } from "./letras";
import { desdeTexto, Lienzo } from "./Lienzo";
import { estanteAlto, plantasRincon, pufs } from "./living";
import { P, type Color } from "./paleta";
import { caja, cilindro, clara, hash, libros, osc, ovillo, planta, taza, tetera, vela } from "./primitivas";

// El rincón de Violeta (final): su cuarto, lila y tranquilo. Aquí no hay persecución.

const LILA_PARED = 0xe6d3ec;
const LILA_PARED_OSC = 0xd8c0e2;
const LILA_MUEBLE = 0xb99ad0;
const LILA_MUEBLE_OSC = 0x9676b3;

const TARIMA_RINCON: EstiloTarima = { tapa: 0xb48cbf, linea: 0xa47caf, borde: 0xd4b6de, frente: 0x7e5a8f };

/** Muebles del cuarto de Violeta: [columna, fila, ancho, alto]. */
export const BLOQUES_VIOLETA: [number, number, number, number][] = [
  [2, 2, 3, 2], [6, 2, 3, 2], [10, 2, 3, 2], [14, 2, 3, 2],
  [2, 5, 2, 3], [15, 5, 2, 3], [5, 5, 3, 1], [11, 5, 3, 1],
  [7, 7, 5, 2],
  [2, 10, 3, 1], [6, 10, 2, 1], [11, 10, 2, 1], [14, 10, 3, 1],
];

const CORAZONES: [number, number][] = [[1, 1], [9, 1], [17, 1], [4, 4], [14, 4], [1, 6], [17, 6], [9, 6], [5, 8], [13, 8], [1, 11], [17, 11]];

/** Mapa del cuarto (19×13) armado a partir de los muebles: espacio = piso libre, h = corazón. */
export function mapaVioleta(): string {
  const W = 19;
  const H = 13;
  const g: string[][] = Array.from({ length: H }, (_, y) => Array.from({ length: W }, (_, x) => (x === 0 || y === 0 || x === W - 1 || y === H - 1 ? "#" : " ")));
  for (const [bx, by, bw, bh] of BLOQUES_VIOLETA) for (let y = by; y < by + bh; y++) for (let x = bx; x < bx + bw; x++) g[y][x] = "#";
  for (const [x, y] of CORAZONES) g[y][x] = "h";
  g[9][9] = "V";
  g[11][9] = "Q";
  return g.map((f) => f.join("")).join("\n");
}

/** Corazón para juntar */
export function dibujarCorazon(): Lienzo {
  const l = desdeTexto(
    `
.rr...rr.
rRRr.rRRr
rRwRrRRRr
rRRRRRRRr
.rRRRRRr.
..rRRRr..
...rRr...
....r....
`,
    { r: 0xc2415f, R: 0xff6fa0, w: 0xffd6e4 },
  );
  l.contorno(P.tinta);
  return l;
}

// ---------- muebles ----------

function hueso(l: Lienzo, cx: number, cy: number): void {
  l.rect(cx - 4, cy - 1, 9, 3, P.cremaClara);
  for (const dx of [-5, 5]) {
    l.ovalo(cx + dx, cy - 1, 1.5, 1.5, P.cremaClara);
    l.ovalo(cx + dx, cy + 2, 1.5, 1.5, P.cremaClara);
  }
}

function pelota(l: Lienzo, cx: number, cy: number, c: Color): void {
  l.ovalo(cx, cy, 3, 3, c);
  l.hline(cx - 2, cy, 5, P.cremaClara);
}

const V_INDIVIDUAL: Dibujo[] = [
  // 0 · tocador con moños y cepillo
  (l, x, y, w, h) =>
    caja(l, x + 2, y + 4, w - 4, h - 6, 18, P.cremaClara, LILA_MUEBLE, {
      frente: (l2, fx, fy, fw, fh) => {
        for (let i = 0; i < 3; i++) {
          l2.marco(fx + 2, fy + 2 + i * 5, fw - 4, 5, LILA_MUEBLE_OSC);
          l2.hline(fx + fw / 2 - 2, fy + 4 + i * 5, 5, P.mostazaClara);
        }
      },
      tapa: (l2, tx, ty, tw, th) => {
        l2.ovalo(tx + 12, ty + 6, 6, 5, P.cielo);
        l2.marco(tx + 6, ty + 1, 13, 11, P.mostazaClara);
        for (const [dx, c] of [[30, P.rosa], [42, P.lila]] as [number, Color][]) {
          l2.ovalo(tx + dx - 3, ty + th - 6, 3, 2, c);
          l2.ovalo(tx + dx + 3, ty + th - 6, 3, 2, c);
          l2.px(tx + dx, ty + th - 6, clara(c, 0.4));
        }
        l2.rect(tx + 52, ty + th - 10, 3, 8, P.maderaClara);
        l2.rect(tx + 51, ty + th - 13, 5, 4, P.madera);
      },
    }),
  // 1 · estante con juguetes
  (l, x, y, w, h) =>
    caja(l, x + 2, y + 4, w - 4, h - 6, 16, P.maderaClara, P.maderaMed, {
      frente: (l2, fx, fy, fw, fh) => {
        l2.rect(fx + 2, fy + 2, fw - 4, fh - 4, P.madera);
        pelota(l2, fx + 10, fy + fh / 2, P.rojo);
        pelota(l2, fx + 22, fy + fh / 2, P.azulClaro);
        hueso(l2, fx + 44, fy + fh / 2 - 1);
      },
      tapa: (l2, tx, ty, tw, th) => {
        l2.ovalo(tx + 14, ty + th - 8, 7, 6, P.cremaOsc);
        l2.ovalo(tx + 10, ty + th - 14, 3, 3, P.cremaOsc);
        l2.ovalo(tx + 18, ty + th - 14, 3, 3, P.cremaOsc);
        l2.px(tx + 12, ty + th - 9, P.tinta);
        l2.px(tx + 16, ty + th - 9, P.tinta);
        ovillo(l2, tx + 36, ty + th - 4, P.rosa);
        libros(l2, tx + 54, ty + th - 3, [P.lila, P.mostaza]);
      },
    }),
  // 2 · banco de ventana con cojines
  (l, x, y, w, h) =>
    caja(l, x + 1, y + 6, w - 2, h - 8, 14, P.cremaClara, LILA_MUEBLE, {
      frente: (l2, fx, fy, fw, fh) => {
        for (let i = 0; i < 3; i++) l2.marco(fx + 2 + i * 23, fy + 2, 22, fh - 4, LILA_MUEBLE_OSC);
      },
      tapa: (l2, tx, ty, tw, th) => {
        l2.rect(tx + 2, ty + 2, tw - 4, th - 4, P.rosaClara);
        l2.rect(tx + 8, ty - 4, 10, 9, P.cremaClara);
        l2.rect(tx + 20, ty - 4, 10, 9, P.lilaClara);
        l2.rect(tx + tw - 22, ty + 4, 16, 10, P.crema);
        for (let j = 0; j < 10; j += 3) l2.hline(tx + tw - 22, ty + 4 + j, 16, P.cremaOsc);
      },
    }),
  // 3 · plantas
  plantasRincon("monstera", "flores"),
  // 4 · sillón lila
  (l, x, y, w, h) => {
    caja(l, x + 2, y + 4, w - 4, 10, 16, LILA_MUEBLE_OSC, osc(LILA_MUEBLE_OSC));
    caja(l, x + 4, y + 12, w - 8, h - 16, 9, LILA_MUEBLE, osc(LILA_MUEBLE), {
      tapa: (l2, tx, ty, tw, th) => {
        l2.rect(tx + 4, ty + 3, tw - 8, th - 6, P.lilaClara);
        l2.rect(tx + 8, ty + 6, 9, 8, P.cremaClara);
      },
    });
    for (const ax of [x + 2, x + w - 8]) caja(l, ax, y + 10, 6, h - 14, 13, LILA_MUEBLE_OSC, osc(LILA_MUEBLE_OSC));
  },
  // 5 · estante alto
  estanteAlto(
    [
      (l, cx, b) => planta(l, cx, b, "suculenta", 7, P.rosaClara),
      (l, cx, b) => libros(l, cx, b, [P.rosa, P.lila, P.cremaClara]),
      (l, cx, b) => vela(l, cx, b),
    ],
    55,
  ),
  // 6 · mesita con té
  (l, x, y, w, h) =>
    caja(l, x + 2, y + 5, w - 4, h - 7, 9, P.cremaClara, P.crema, {
      patas: true,
      tapa: (l2, tx, ty, tw, th) => {
        tetera(l2, tx + 12, ty + th, P.lilaClara);
        taza(l2, tx + 30, ty + th, P.rosaClara, true);
        taza(l2, tx + 44, ty + th, P.cremaClara, false);
        l2.ovalo(tx + 58, ty + th - 3, 5, 2, P.cremaClara);
        l2.px(tx + 57, ty + th - 4, P.mostaza);
        l2.px(tx + 60, ty + th - 3, P.mostaza);
      },
    }),
  // 7 · cojines en el suelo
  (l, x, y, w, h) => {
    caja(l, x + 2, y + 8, 30, h - 10, 6, P.rosaClara, osc(P.rosaClara));
    caja(l, x + 26, y + 6, 30, h - 8, 7, P.lilaClara, osc(P.lilaClara));
    caja(l, x + 46, y + 4, 22, h - 10, 5, P.cremaClara, osc(P.cremaClara));
  },
  // 8 · la cama de Violeta, con su nombre
  (l, x, y, w, h) => {
    const cx = x + w / 2;
    const base = y + h - 6;
    cilindro(l, cx, base, w / 2 - 6, h / 2 - 8, 12, LILA_MUEBLE, LILA_MUEBLE);
    l.ovalo(cx, base - 13, w / 2 - 16, h / 2 - 14, P.cremaClara);
    l.ovalo(cx - 8, base - 15, 16, 6, 0xf8eef8);
    for (let i = 0; i < 7; i++) l.px(cx - 20 + i * 7, base - 10 + (i % 2), P.lilaClara);
    hueso(l, cx + 26, base - 16);
    l.rect(cx - 22, base - 8, 44, 8, P.cremaClara);
    escribir(l, "VIOLETA", cx, base - 6, LILA_MUEBLE_OSC);
    for (let i = 0; i < 16; i++) l.px(cx - 40 + hash(i, 4) * 80, base - 20 + hash(4, i) * 12, P.rosa);
  },
  // 9 · canasto de juguetes
  (l, x, y, w, h) => {
    cilindro(l, x + 16, y + h - 4, 12, 4, 9, P.maderaClara, P.maderaMed);
    for (let i = -11; i <= 11; i += 3) l.vline(x + 16 + i, y + h - 12, 8, P.maderaMed);
    pelota(l, x + 11, y + h - 15, P.rojo);
    pelota(l, x + 20, y + h - 14, P.mostazaClara);
    hueso(l, x + 50, y + h - 8);
  },
  // 10 · pufs
  pufs(P.rosaClara, P.lilaClara),
  // 11 · pufs
  pufs(P.lilaClara, P.cremaClara),
  // 12 · jardinera con flores
  (l, x, y, w, h) =>
    caja(l, x + 1, y + 4, w - 2, h - 6, 8, P.cremaClara, LILA_MUEBLE, {
      tapa: (l2, tx, ty, tw, th) => {
        for (let i = 0; i < 3; i++) planta(l2, tx + 12 + i * 23, ty + th - 1, "flores", 8, P.terracota, [P.rosa, P.lilaClara, P.cremaClara][i]);
      },
    }),
];

// ---------- piso y paredes ----------

const RETRATO: Retrato = { clave: "violeta", x: 8 * T + 10, y: -ALTO_PARED + 8, w: 26, h: 22 };

export function pisoRincon(ancho: number, alto: number): Lienzo {
  const W = ancho * T;
  const H = alto * T + ALTO_PARED;
  const l = new Lienzo(W, H);
  const oy = ALTO_PARED;
  for (let y = oy + T; y < oy + (alto - 1) * T; y++) {
    const fila = Math.floor((y - oy - T) / 6);
    const enFila = (y - oy - T) % 6;
    for (let x = T; x < W - T; x++) {
      const junta = (x + ((fila * 37) % 60)) % 60 === 0;
      let c: Color = fila % 2 ? 0xe3c49a : 0xd9b88c;
      if (enFila === 5 || junta) c = 0xc49c6e;
      else if (enFila === 0) c = 0xefd4ae;
      l.px(x, y, c);
    }
  }
  for (let x = T; x < W - T; x++) for (let j = 0; j < 4; j++) l.tono(x, oy + T + j, -0.2 + j * 0.05);

  const cara = oy + T;
  for (let y = 0; y < cara; y++)
    for (let x = 0; x < W; x++) {
      let c: Color = LILA_PARED;
      if ((x + y) % 14 === 0) c = LILA_PARED_OSC;
      if (x % 14 === 7 && y % 14 === 7) c = P.rosa;
      l.px(x, y, c);
    }
  l.rect(0, 0, W, 4, LILA_MUEBLE_OSC);
  l.rect(0, cara - 12, W, 12, P.cremaClara);
  l.hline(0, cara - 12, W, 0xffffff);
  for (let x = 4; x < W; x += 20) l.marco(x, cara - 9, 16, 6, P.crema);

  const vx = 12 * T;
  const vw = 4 * T;
  l.rect(vx, 6, vw, cara - 20, P.cremaClara);
  l.rect(vx + 3, 9, vw / 2 - 5, cara - 26, P.cielo);
  l.rect(vx + vw / 2 + 2, 9, vw / 2 - 5, cara - 26, P.cielo);
  for (let i = 0; i < 9; i++) l.px(vx + 8 + i, 22 - i, P.cremaClara);
  for (const cx of [vx - 10, vx + vw]) {
    l.rect(cx, 4, 10, cara - 16, P.lila);
    for (let i = 2; i < 10; i += 3) l.vline(cx + i, 4, cara - 16, LILA_MUEBLE_OSC);
  }
  l.rect(RETRATO.x - 3, RETRATO.y + oy - 3, RETRATO.w + 6, RETRATO.h + 6, P.maderaMed);
  l.rect(RETRATO.x, RETRATO.y + oy, RETRATO.w, RETRATO.h, P.cremaClara);
  l.rect(2 * T, 24, 4 * T, 3, P.maderaClara);
  libros(l, 2 * T + 14, 24, [P.rosa, P.lila]);
  planta(l, 3 * T + 20, 24, "colgante", 6, P.cremaClara);
  vela(l, 5 * T + 6, 24);

  for (const mx of [0, W - T]) {
    l.rect(mx, cara, T, H - cara, LILA_MUEBLE_OSC);
    l.vline(mx === 0 ? T - 1 : mx, cara, H - cara, LILA_MUEBLE);
  }
  // Alfombra redonda rosada al centro y otra frente a la cama
  l.ovalo(9 * T + 12, oy + 6 * T + 12, 70, 14, P.rosaClara);
  l.ovalo(9 * T + 12, oy + 6 * T + 12, 62, 10, 0xf8dbe3);
  l.ovalo(9 * T + 12, oy + 9 * T + 14, 40, 9, P.lilaClara);
  l.ovalo(9 * T + 12, oy + 9 * T + 14, 34, 6, 0xdcc6ea);
  for (let y = cara; y < cara + 6 * T; y++) {
    const t = (y - cara) / (6 * T);
    for (let x = Math.floor(vx - t * 30); x < vx + vw + t * 30; x++) if ((x + y) % 2 === 0 && hash(x, y) > t) l.tono(x, y, 0.1);
  }
  return l;
}

export function muroInferiorRincon(ancho: number): Lienzo {
  const W = ancho * T;
  const l = new Lienzo(W, T);
  l.rect(0, 0, W, 6, LILA_MUEBLE);
  l.hline(0, 0, W, P.lilaClara);
  l.rect(0, 6, W, T - 6, LILA_MUEBLE_OSC);
  return l;
}

/** El rincón de Violeta. */
export const RINCON: Habitacion = {
  piso: (ancho, alto) => pisoRincon(ancho, alto),
  muebles: () => construirMuebles(V_INDIVIDUAL, TARIMA_RINCON, BLOQUES_VIOLETA),
  muroInferior: muroInferiorRincon,
  fotos: [RETRATO],
  mini: { piso: 0xf0e0f0, muro: LILA_MUEBLE },
};
