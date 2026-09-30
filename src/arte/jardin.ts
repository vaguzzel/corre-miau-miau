import { ALTO_PARED, construirMuebles, T, type Dibujo, type EstiloTarima, type Habitacion } from "./habitacion";
import { escribir } from "./letras";
import { Lienzo } from "./Lienzo";
import { P, type Color } from "./paleta";
import { caja, cilindro, clara, hash, osc, planta, taza, type TipoPlanta } from "./primitivas";

// El jardín de Eren (nivel 3): una tarde de verano en el patio, con huerto y parrilla.

const PASTO = 0x8fbf6f;
const PASTO_OSC = 0x7aaa5c;
const GRAVA = 0xe3d1a8;
const PIEDRA = 0xa39c90;
const CERCA = 0xc99862;
const CERCA_OSC = 0xa87447;

/** Borde de piedras con tierra: la "tarima" del jardín. */
const TARIMA_JARDIN: EstiloTarima = { tapa: 0x6f9a55, linea: 0x628c4a, borde: PIEDRA, frente: 0x6e675e };

// ---------- piezas de jardín ----------

/** Árbol con copa redonda y fruta. */
function arbol(fruta: Color, flor = false): Dibujo {
  return (l, x, y, w, h) => {
    const cx = x + w / 2;
    const base = y + h - 6;
    l.ovalo(cx, base, 18, 5, osc(PASTO, 0.8));
    l.rect(cx - 3, base - 22, 7, 22, P.madera);
    l.vline(cx - 3, base - 22, 22, P.maderaMed);
    l.vline(cx + 3, base - 22, 22, P.maderaOsc);
    const cy = base - 38;
    l.ovalo(cx, cy, 25, 20, P.hojaOsc);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      l.ovalo(cx + Math.cos(a) * 12, cy + Math.sin(a) * 9, 11, 9, P.hoja);
    }
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.5;
      l.ovalo(cx + Math.cos(a) * 8 - 4, cy + Math.sin(a) * 6 - 5, 6, 5, P.hojaMed);
    }
    for (let i = 0; i < 10; i++) l.px(cx - 12 + hash(i, 3) * 20, cy - 12 + hash(3, i) * 10, P.hojaClara);
    for (let i = 0; i < (flor ? 22 : 9); i++) {
      const fx = cx + (hash(i, cx) - 0.5) * 40;
      const fy = cy + (hash(cx, i) - 0.5) * 30;
      if (flor) {
        l.px(fx, fy, P.rosaClara);
        l.px(fx + 1, fy, P.cremaClara);
      } else {
        l.ovalo(fx, fy, 1.5, 1.5, fruta);
        l.px(fx - 1, fy - 1, clara(fruta, 0.5));
      }
    }
    if (!flor)
      for (const [dx, dy] of [[-14, 3], [12, 1]]) {
        l.ovalo(cx + dx, base + dy, 2, 2, fruta);
      }
  };
}

/** Seto recortado, con flores opcionales. */
function seto(flores: Color[] = [], espigas = false): Dibujo {
  return (l, x, y, w, h) =>
    caja(l, x + 1, y + 2, w - 2, h - 2, 14, P.hoja, P.hojaOsc, {
      frente: (l2, fx, fy, fw, fh) => {
        for (let i = 0; i < fw; i += 5) l2.ovalo(fx + i + 2, fy + fh - 2, 3, 2.5, P.hojaOsc);
        for (let i = 2; i < fw - 2; i += 6) l2.px(fx + i, fy + 4, P.hojaMed);
      },
      tapa: (l2, tx, ty, tw, th) => {
        const n = Math.round((tw * th) / 30);
        for (let i = 0; i < n; i++) {
          const px = tx + 2 + hash(i, tx + ty) * (tw - 4);
          const py = ty + 2 + hash(ty, i + tx) * (th - 4);
          l2.ovalo(px, py, 2.5, 2, P.hojaMed);
          l2.px(px - 1, py - 1, P.hojaClara);
        }
        if (espigas)
          for (let i = 0; i < n; i++) {
            const px = tx + 2 + hash(i * 7, tx) * (tw - 4);
            const py = ty + 2 + hash(tx, i * 7) * (th - 4);
            l2.vline(px, py - 2, 3, i % 2 ? P.lila : P.lilaClara);
          }
        flores.forEach((c, k) => {
          for (let i = 0; i < n / 3; i++) {
            const px = tx + 3 + hash(i + k * 50, ty) * (tw - 6);
            const py = ty + 3 + hash(ty, i + k * 50) * (th - 6);
            l2.px(px, py, c);
            l2.px(px + 1, py, c);
            l2.px(px, py - 1, clara(c, 0.4));
          }
        });
      },
    });
}

/** Cantero de madera con tierra y plantas. */
function cantero(dibujar: (l: Lienzo, tx: number, ty: number, tw: number, th: number) => void): Dibujo {
  return (l, x, y, w, h) =>
    caja(l, x + 1, y + 3, w - 2, h - 4, 8, P.maderaMed, P.madera, {
      frente: (l2, fx, fy, fw, fh) => l2.hline(fx, fy + fh / 2, fw, P.maderaOsc),
      tapa: (l2, tx, ty, tw, th) => {
        l2.rect(tx + 2, ty + 2, tw - 4, th - 4, 0x6e4a33);
        for (let i = 0; i < (tw * th) / 20; i++) l2.px(tx + 3 + hash(i, 5) * (tw - 6), ty + 3 + hash(5, i) * (th - 6), 0x5a3c29);
        dibujar(l2, tx, ty, tw, th);
      },
    });
}

function macetas(tipos: [TipoPlanta, Color][], vertical: boolean): Dibujo {
  return (l, x, y, w, h) =>
    tipos.forEach(([t, flor], i) => {
      const cx = vertical ? x + w / 2 : x + Math.round(((i + 0.5) * w) / tipos.length);
      const base = vertical ? y + Math.round(((i + 0.9) * h) / tipos.length) : y + h - 3;
      planta(l, cx, base, t, t === "hierbas" ? 8 : 9, P.terracota, flor);
    });
}

function lechuga(l: Lienzo, cx: number, cy: number): void {
  l.ovalo(cx, cy, 5, 4, P.hojaMed);
  l.ovalo(cx, cy - 1, 3.5, 2.5, P.hojaClara);
  l.px(cx, cy - 1, 0xd8efb0);
}

function zanahoria(l: Lienzo, cx: number, cy: number): void {
  l.ovalo(cx, cy + 1, 1.5, 1, P.fuego);
  for (let k = -2; k <= 2; k++) l.linea(cx, cy, cx + k * 1.5, cy - 5, k % 2 ? P.hojaMed : P.hoja);
}

function tomatera(l: Lienzo, cx: number, base: number): void {
  l.vline(cx, base - 18, 18, P.maderaClara);
  for (let j = 0; j < 4; j++) l.ovalo(cx + (j % 2 ? 3 : -3), base - 4 - j * 4, 4, 3, j % 2 ? P.hoja : P.hojaMed);
  for (const [dx, dy] of [[3, -6], [-4, -10], [2, -14]]) l.ovalo(cx + dx, base + dy, 1.5, 1.5, P.rojo);
}

function zapallo(l: Lienzo, cx: number, base: number): void {
  l.ovalo(cx, base - 3, 6, 4, P.fuego);
  l.vline(cx - 2, base - 6, 6, osc(P.fuego, 0.8));
  l.vline(cx + 2, base - 6, 6, osc(P.fuego, 0.8));
  l.rect(cx, base - 9, 1, 3, P.hoja);
}

// ---------- el catálogo del jardín (uno por bloque) ----------

const J_INDIVIDUAL: Dibujo[] = [
  // 0 · limonero
  arbol(P.mostazaClara),
  // 1 · huerto de lechugas y zanahorias
  cantero((l, tx, ty, tw, th) => {
    for (let i = 0; i < 5; i++) lechuga(l, tx + 8 + i * 13, ty + 10);
    for (let i = 0; i < 8; i++) zanahoria(l, tx + 6 + i * 8, ty + th - 6);
    l.rect(tx + tw - 22, ty + th / 2 - 3, 18, 6, P.cremaClara);
    escribir(l, "EREN", tx + tw - 13, ty + th / 2 - 2, P.madera);
  }),
  // 2 · seto con rosas
  seto([P.rojo, P.rosa]),
  // 3 · invernadero con plantas adentro
  (l, x, y, w, h) =>
    caja(l, x + 2, y + 6, w - 4, h - 8, 24, 0xdff0f4, 0xcfe6ee, {
      frente: (l2, fx, fy, fw, fh) => {
        for (let i = 0; i < 5; i++) planta(l2, fx + 12 + i * 22, fy + fh - 1, (["hierbas", "flores", "helecho", "flores", "suculenta"] as TipoPlanta[])[i], 7, P.terracota, [P.rosa, P.mostazaClara, P.lilaClara][i % 3]);
        for (let i = 0; i < fw; i += 16) l2.vline(fx + i, fy, fh, P.cremaClara);
        l2.hline(fx, fy, fw, P.cremaClara);
        for (let i = 0; i < 8; i++) l2.px(fx + 6 + i, fy + 10 - i, 0xffffff);
      },
      tapa: (l2, tx, ty, tw, th) => {
        l2.hline(tx, ty + th / 2, tw, P.cremaClara);
        for (let i = 0; i < tw; i += 16) l2.vline(tx + i, ty, th, P.cremaClara);
        for (let i = 0; i < 12; i++) l2.px(tx + 20 + i, ty + 14 - i, 0xffffff);
      },
    }),
  // 4 · seto con clemátides
  seto([P.lila, P.lilaClara]),
  // 5 · huerto de tomates y zapallos
  cantero((l, tx, ty, tw, th) => {
    for (let i = 0; i < 4; i++) tomatera(l, tx + 9 + i * 18, ty + th / 2 + 2);
    zapallo(l, tx + 16, ty + th - 2);
    zapallo(l, tx + tw - 18, ty + th - 3);
  }),
  // 6 · ciruelo en flor
  arbol(P.rosaClara, true),
  // 7 · composteras
  (l, x, y, w, h) => {
    for (const bx of [x + 2, x + w / 2 + 1])
      caja(l, bx, y + 10, w / 2 - 3, h - 12, 14, 0x6e4a33, P.madera, {
        frente: (l2, fx, fy, fw, fh) => {
          for (let j = 3; j < fh; j += 4) l2.hline(fx, fy + j, fw, P.maderaOsc);
        },
        tapa: (l2, tx, ty, tw, th) => {
          l2.px(tx + 5, ty + 5, P.fuego);
          l2.px(tx + tw - 6, ty + 8, P.hojaMed);
          l2.px(tx + 8, ty + th - 5, P.mostazaClara);
        },
      });
  },
  // 8 · carretilla con tierra
  (l, x, y, w, h) => {
    const b = y + h - 4;
    l.linea(x + 6, b - 10, x + 2, b - 14, P.maderaOsc);
    l.linea(x + 6, b - 4, x + 2, b, P.maderaOsc);
    for (let j = 0; j < 9; j++) l.hline(x + 6 + j, b - 13 + j, 30 - j * 2, P.hojaMed);
    l.ovalo(x + 20, b - 13, 13, 3, 0x6e4a33);
    l.ovalo(x + 38, b - 4, 4, 4, P.grisOsc);
    l.ovalo(x + 38, b - 4, 1.5, 1.5, P.gris);
  },
  // 9 · seto de lavanda
  seto([], true),
  // 10 · cantero de flores
  cantero((l, tx, ty, tw, th) => {
    const cols = [P.rosa, P.mostazaClara, P.lilaClara, P.cremaClara, P.rojo];
    for (let i = 0; i < 12; i++) {
      const fx = tx + 4 + i * 5.5;
      const fy = ty + 4 + (i % 2) * 5;
      l.px(fx, fy + 1, P.hoja);
      l.px(fx, fy, cols[i % 5]);
      l.px(fx - 1, fy, cols[i % 5]);
      l.px(fx + 1, fy, cols[i % 5]);
      l.px(fx, fy - 1, cols[i % 5]);
    }
  }),
  // 11 · macetas de geranios
  macetas([["flores", P.rojo], ["flores", P.rosa]], true),
  // 12 · laguna con nenúfares, peces y una rana
  (l, x, y, w, h) => {
    const cx = x + w / 2;
    const cy = y + h / 2 + 2;
    l.ovalo(cx, cy, w / 2 - 6, h / 2 - 6, PIEDRA);
    for (let i = 0; i < 30; i++) {
      const a = (i / 30) * Math.PI * 2;
      l.ovalo(cx + Math.cos(a) * (w / 2 - 8), cy + Math.sin(a) * (h / 2 - 8), 4, 3, i % 3 ? 0xb8b2a7 : 0x8a8378);
    }
    l.ovalo(cx, cy, w / 2 - 14, h / 2 - 13, 0x6aa8c2);
    l.ovalo(cx, cy + 2, w / 2 - 26, h / 2 - 20, 0x5a96b0);
    for (const [dx, dy] of [[-40, -8], [30, 10], [-10, 14], [50, -10]]) {
      l.ovalo(cx + dx, cy + dy, 5, 3, P.hojaMed);
      l.px(cx + dx + 3, cy + dy - 1, 0x6aa8c2);
    }
    l.px(cx - 40, cy - 9, P.rosaClara);
    l.px(cx - 39, cy - 9, P.rosa);
    l.ovalo(cx - 14, cy - 2, 4, 1.5, P.fuego);
    l.px(cx - 19, cy - 2, P.fuego);
    l.ovalo(cx + 14, cy + 4, 4, 1.5, P.cremaClara);
    l.px(cx + 12, cy + 4, P.fuego);
    l.ovalo(cx + 30, cy + 8, 2.5, 2, P.hojaClara);
    l.px(cx + 29, cy + 7, P.tinta);
    l.px(cx + 31, cy + 7, P.tinta);
    for (let i = 0; i < 5; i++) l.hline(cx - 50 + i * 20, cy - 12 + (i % 2) * 20, 5, 0x9ccbe0);
    for (let i = 0; i < 7; i++) l.linea(x + w - 26 + i * 3, y + h - 10, x + w - 28 + i * 3.5, y + h - 30, P.hoja);
  },
  // 13 · muro de piedras con musgo
  (l, x, y, w, h) =>
    caja(l, x + 1, y + 4, w - 2, h - 6, 12, P.hojaMed, PIEDRA, {
      frente: (l2, fx, fy, fw, fh) => {
        for (let j = 0; j < fh; j += 5) for (let i = (j / 5) % 2 ? 0 : 4; i < fw; i += 8) l2.ovalo(fx + i, fy + j + 2, 3, 2, (i + j) % 3 ? 0xb8b2a7 : 0x8a8378);
      },
      tapa: (l2, tx, ty, tw, th) => {
        for (let i = 3; i < tw; i += 9) {
          l2.rect(tx + i, ty + 2, 1, 3, P.cremaClara);
          l2.ovalo(tx + i, ty + 2, 2, 1.2, P.rojo);
        }
      },
    }),
  // 14 · farol
  (l, x, y, w, h) => {
    const cx = x + w / 2;
    const b = y + h - 5;
    l.rect(cx - 1, b - 40, 3, 40, 0x3a3533);
    l.rect(cx - 5, b - 50, 11, 10, P.luz);
    l.marco(cx - 5, b - 50, 11, 10, 0x3a3533);
    l.hline(cx - 6, b - 51, 13, 0x3a3533);
    planta(l, cx + 6, b + 2, "flores", 6, P.terracota, P.cremaClara);
  },
  // 15 · seto de hortensias
  seto([P.azulClaro, P.rosaClara, P.lilaClara]),
  // 16 · bebedero de pájaros
  (l, x, y, w, h) => {
    const cx = x + w / 2;
    const b = y + h - 8;
    cilindro(l, cx, b, 4, 2, 16, 0xb8b2a7, 0xb8b2a7);
    cilindro(l, cx, b - 16, 13, 5, 4, 0xb8b2a7, 0x9ccbe0);
    for (const [bx, c] of [[cx - 6, P.azulClaro], [cx + 5, P.terracotaClara]] as [number, Color][]) {
      l.ovalo(bx, b - 24, 3, 2.5, c);
      l.ovalo(bx + 2, b - 27, 2, 2, c);
      l.px(bx + 4, b - 27, P.mostaza);
    }
    planta(l, x + 8, y + h - 2, "flores", 7, P.terracota, P.rosa);
  },
  // 17 · manguera y regadera
  (l, x, y, w, h) => {
    const b = y + h - 4;
    l.ovalo(x + 12, b - 9, 9, 9, P.hojaMed);
    l.ovalo(x + 12, b - 9, 6, 6, P.hoja);
    l.ovalo(x + 12, b - 9, 3, 3, P.hojaMed);
    l.ovalo(x + 12, b - 9, 1.5, 1.5, P.maderaClara);
    l.ovalo(x + 34, b - 6, 7, 6, P.gris);
    l.linea(x + 40, b - 8, x + 46, b - 14, P.gris);
    l.linea(x + 30, b - 12, x + 36, b - 15, P.grisOsc);
  },
  // 18 · girasoles
  macetas([["flores", P.mostaza], ["flores", P.mostazaClara]], false),
  // 19 · galpón de herramientas
  (l, x, y, w, h) =>
    caja(l, x + 3, y + 10, w - 6, h - 12, 24, 0xa65f43, CERCA, {
      frente: (l2, fx, fy, fw, fh) => {
        for (let i = 0; i < fw; i += 4) l2.vline(fx + i, fy, fh, CERCA_OSC);
        l2.rect(fx + fw / 2 - 5, fy + 4, 10, fh - 4, P.madera);
        l2.px(fx + fw / 2 + 3, fy + fh / 2 + 2, P.mostazaClara);
        l2.rect(fx + 3, fy + 5, 6, 5, P.cielo);
      },
      tapa: (l2, tx, ty, tw, th) => {
        for (let j = 0; j < th; j += 4) for (let i = (j / 4) % 2 ? 0 : 3; i < tw; i += 6) l2.hline(tx + i, ty + j, 4, 0x8e4a33);
        l2.hline(tx, ty + th / 2, tw, 0x6e3a28);
      },
    }),
  // 20 · seto de rosas
  seto([P.rojo, P.cremaClara]),
  // 21 · gnomo y hongos
  (l, x, y, w, h) => {
    const cx = x + w / 2;
    const b = y + h * 0.55;
    l.ovalo(cx, b - 4, 4, 4, P.azul);
    for (let j = 0; j < 9; j++) l.hline(cx - Math.floor(4 - j * 0.45), b - 16 + j, Math.floor(8 - j * 0.9) + 1, P.rojo);
    l.ovalo(cx, b - 7, 2.5, 2, 0xf2c9a0);
    l.ovalo(cx, b - 4, 3, 2, P.cremaClara);
    for (const [dx, dy, c] of [[-5, 16, P.rojo], [4, 20, P.mostaza], [0, 12, P.rojo]] as [number, number, Color][]) {
      l.rect(cx + dx - 1, b + dy - 3, 2, 3, P.cremaClara);
      l.ovalo(cx + dx, b + dy - 4, 3, 2, c);
      l.px(cx + dx - 1, b + dy - 5, P.cremaClara);
    }
  },
  // 22 · la banca de Eren, con su nombre tallado
  (l, x, y, w, h) => {
    caja(l, x + 3, y + 2, w - 6, 5, 14, P.maderaMed, P.madera, {
      frente: (l2, fx, fy, fw) => escribir(l2, "EREN", fx + fw / 2, fy + 5, P.maderaOsc),
    });
    caja(l, x + 3, y + 7, w - 6, h - 9, 8, P.maderaClara, P.maderaMed, {
      patas: true,
      tapa: (l2, tx, ty, tw) => {
        l2.rect(tx + 4, ty + 1, 20, 6, P.terracotaClara);
        taza(l2, tx + tw - 10, ty + 7, P.cremaClara, true);
      },
    });
  },
  // 23 · terraza de madera con reposeras y limonada
  (l, x, y, w, h) =>
    caja(l, x + 2, y + 2, w - 4, h - 4, 6, P.maderaClara, P.maderaMed, {
      tapa: (l2, tx, ty, tw, th) => {
        for (let j = 5; j < th; j += 6) l2.hline(tx, ty + j, tw, P.maderaMed);
        for (const [rx, c] of [[tx + 18, P.terracotaClara], [tx + 48, P.azulClaro]] as [number, Color][]) {
          l2.rect(rx, ty + 12, 20, 40, P.cremaClara);
          l2.rect(rx + 2, ty + 14, 16, 36, c);
          for (let j = 18; j < 50; j += 6) l2.hline(rx + 2, ty + j, 16, clara(c, 0.4));
          l2.rect(rx, ty + 6, 20, 8, clara(c, 0.2));
        }
        cilindro(l2, tx + 94, ty + 40, 10, 4, 12, P.cremaClara, P.cremaClara);
        l2.rect(tx + 89, ty + 22, 6, 9, 0xfff3a8);
        l2.rect(tx + 97, ty + 24, 4, 6, 0xfff3a8);
        planta(l2, tx + tw - 22, ty + th - 6, "helecho", 13);
        planta(l2, tx + tw - 50, ty + 24, "flores", 9, P.cremaClara, P.rosa);
        l2.ovalo(tx + 124, ty + th - 14, 9, 4, 0xe8c98e);
        l2.ovalo(tx + 124, ty + th - 16, 5, 3, 0xe8c98e);
        l2.hline(tx + 119, ty + th - 15, 10, P.terracota);
      },
    }),
  // 24 · leña apilada
  (l, x, y, w, h) =>
    caja(l, x + 2, y + 6, w - 4, h - 8, 10, P.maderaClara, P.madera, {
      frente: (l2, fx, fy, fw, fh) => {
        for (let i = 0; i < fw - 2; i += 6) {
          l2.ovalo(fx + 3 + i, fy + 3, 2.5, 2.5, P.maderaClara);
          l2.ovalo(fx + 6 + i, fy + 7, 2.5, 2.5, P.maderaClara);
        }
      },
    }),
  // 25 · comedero de pájaros
  (l, x, y, w, h) => {
    const cx = x + w / 2;
    const b = y + h - 5;
    l.rect(cx - 1, b - 34, 3, 34, P.madera);
    caja(l, cx - 8, b - 48, 16, 10, 8, P.rojo, P.mostaza, {
      frente: (l2, fx, fy, fw, fh) => l2.ovalo(fx + fw / 2, fy + fh / 2, 2, 2, P.tinta),
    });
    l.ovalo(cx + 9, b - 42, 3, 2.5, P.azulClaro);
    l.px(cx + 12, b - 43, P.mostaza);
  },
  // 26 · seto de boj
  seto(),
  // 27 · macetas de hierbas
  macetas([["hierbas", P.cremaClara], ["flores", P.lilaClara], ["hierbas", P.cremaClara]], false),
  // 28 · manzano
  arbol(P.rojo),
  // 29 · naranjo
  arbol(P.fuego),
  // 30 · parrilla de ladrillo con choripanes y pebre
  (l, x, y, w, h) => {
    caja(l, x + 2, y + 8, 44, h - 10, 20, 0x4a2a20, P.terracota, {
      frente: (l2, fx, fy, fw, fh) => {
        for (let j = 0; j < fh; j += 4) for (let i = (j / 4) % 2 ? 0 : 4; i < fw; i += 8) l2.hline(fx + i, fy + j, 7, P.terracotaClara);
      },
      tapa: (l2, tx, ty, tw, th) => {
        for (let i = 0; i < 16; i++) l2.px(tx + 3 + hash(i, 2) * (tw - 6), ty + 3 + hash(2, i) * (th - 6), i % 2 ? P.fuego : P.fuegoClaro);
        for (let j = 3; j < th; j += 4) l2.hline(tx + 2, ty + j, tw - 4, P.grisClaro);
        for (const [a, b] of [[8, 6], [22, 6], [8, 16], [22, 16]]) {
          l2.rect(tx + a, ty + b, 10, 4, 0x8e4a2e);
          l2.hline(tx + a + 1, ty + b, 8, 0xa85a3a);
        }
      },
    });
    const cx = x + w - 12;
    cilindro(l, cx, y + h - 22, 7, 3, 3, P.cremaClara, P.rojo);
    l.px(cx - 2, y + h - 26, P.hojaMed);
    l.px(cx + 2, y + h - 25, P.cremaClara);
    cilindro(l, cx, y + h - 5, 8, 3, 5, P.maderaClara, P.maderaMed);
    for (const dx of [-3, 2]) l.ovalo(cx + dx, y + h - 11, 3, 1.5, P.mostaza);
  },
  // 31 · seto
  seto([P.cremaClara]),
  // 32 · cantero largo de tulipanes
  cantero((l, tx, ty, tw, th) => {
    const cols = [P.rojo, P.mostazaClara, P.rosa, P.lilaClara, P.cremaClara];
    for (let i = 0; i < 20; i++)
      for (let j = 0; j < 2; j++) {
        const fx = tx + 5 + i * 5.6;
        const fy = ty + 12 + j * 14;
        l.vline(fx, fy - 4, 5, P.hoja);
        l.rect(fx - 1, fy - 7, 3, 3, cols[(i + j) % 5]);
        l.px(fx, fy - 8, cols[(i + j) % 5]);
      }
  }),
  // 33 · seto
  seto([P.mostazaClara]),
  // 34 · mesa con quitasol a rayas
  (l, x, y, w, h) => {
    const cx = x + w / 2;
    const b = y + h - 6;
    cilindro(l, cx, b, 12, 5, 12, P.cremaClara, P.cremaClara);
    for (const sx of [x + 6, x + w - 14]) caja(l, sx, y + 18, 10, 12, 8, P.cremaClara, P.crema, { patas: true });
    l.rect(cx, b - 40, 2, 30, P.maderaClara);
    for (let j = 0; j < 12; j++) {
      const ancho = 10 + j * 2.5;
      for (let i = -ancho; i <= ancho; i++) l.px(cx + i, b - 52 + j, Math.floor((i + 40) / 6) % 2 ? P.cremaClara : P.terracotaClara);
    }
    l.px(cx, b - 53, P.maderaMed);
  },
  // 35 · jardín de piedras con suculentas
  (l, x, y, w, h) => {
    l.rect(x + 3, y + 3, w - 6, h - 6, GRAVA);
    for (let i = 0; i < 40; i++) l.px(x + 4 + hash(i, 7) * (w - 8), y + 4 + hash(7, i) * (h - 8), 0xcdb789);
    for (const [dx, dy, r] of [[12, 16, 7], [36, 38, 8], [38, 14, 5]]) {
      l.ovalo(x + dx, y + dy, r, r * 0.7, 0xb8b2a7);
      l.ovalo(x + dx - 2, y + dy - 2, r * 0.4, r * 0.25, 0xd8d2c7);
    }
    planta(l, x + 26, y + 30, "suculenta", 8, P.azulClaro);
    planta(l, x + 12, y + h - 4, "cactus", 7, P.terracotaClara);
  },
];

// ---------- piso, cerca y cielo ----------

export function pisoJardin(ancho: number, alto: number, gateraFila: number, esMuro: (x: number, y: number) => boolean): Lienzo {
  const W = ancho * T;
  const H = alto * T + ALTO_PARED;
  const l = new Lienzo(W, H);
  const oy = ALTO_PARED;

  // Pasto con matitas
  for (let y = oy; y < H; y++)
    for (let x = 0; x < W; x++) {
      const h = hash(x >> 1, y >> 1);
      l.px(x, y, h < 0.08 ? PASTO_OSC : h > 0.94 ? clara(PASTO, 0.2) : PASTO);
    }
  for (let i = 0; i < 400; i++) {
    const x = hash(i, 11) * W;
    const y = oy + hash(11, i) * (H - oy);
    l.px(x, y, PASTO_OSC);
    l.px(x + 1, y - 1, PASTO_OSC);
    l.px(x + 2, y, PASTO_OSC);
  }
  // Senderos de gravilla sobre los pasillos
  for (let gy = 1; gy < alto - 1; gy++)
    for (let gx = 0; gx < ancho; gx++) {
      if (esMuro(gx, gy)) continue;
      for (let y = gy * T - 2; y < gy * T + T + 2; y++)
        for (let x = gx * T - 2; x < gx * T + T + 2; x++) {
          const h = hash(x, y);
          l.px(x, y + oy, h < 0.1 ? 0xcdb789 : h > 0.93 ? 0xf2e6c8 : GRAVA);
        }
    }
  for (let i = 0; i < 30; i++) {
    const x = hash(i, 21) * W;
    const y = oy + hash(21, i) * (H - oy);
    const c = [P.cremaClara, P.mostazaClara, P.rosaClara][i % 3];
    l.px(x, y, c);
  }

  // Cielo, sol y nubes
  const cara = oy + T;
  for (let y = 0; y < cara; y++) for (let x = 0; x < W; x++) l.px(x, y, y < 20 ? 0x9cc8e0 : 0xb5d8ea);
  l.ovalo(W - 60, 14, 9, 9, 0xfff1b8);
  for (const [nx, ny] of [[120, 10], [360, 16], [520, 8]]) {
    l.ovalo(nx, ny, 16, 5, 0xffffff);
    l.ovalo(nx + 10, ny - 3, 9, 5, 0xffffff);
  }
  // Cerca alta de tablas con enredaderas y casita de pájaros
  for (let x = 0; x < W; x++)
    for (let y = 18; y < cara; y++) {
      const tabla = x % 12;
      let c: Color = tabla === 11 ? CERCA_OSC : CERCA;
      if (tabla === 0) c = clara(CERCA, 0.2);
      l.px(x, y, c);
    }
  for (let x = 0; x < W; x += 12) for (let j = 0; j < 6; j++) l.hline(x + j, 18 - j, 12 - j * 2, x % 24 ? CERCA : clara(CERCA, 0.1));
  l.rect(0, 26, W, 3, CERCA_OSC);
  l.rect(0, cara - 12, W, 3, CERCA_OSC);
  for (let i = 0; i < 40; i++) {
    const x = hash(i, 31) * W;
    const y = 22 + hash(31, i) * (cara - 26);
    l.ovalo(x, y, 3, 2, i % 2 ? P.hoja : P.hojaMed);
    if (i % 4 === 0) l.px(x + 1, y - 1, P.rosa);
  }
  const cx = 13 * T + 12;
  l.rect(cx - 1, 20, 3, cara - 20, P.maderaOsc);
  l.rect(cx - 8, 6, 17, 14, P.terracota);
  for (let j = 0; j < 6; j++) l.hline(cx - 9 + j, 6 - j, 19 - j * 2, P.rojo);
  l.ovalo(cx, 13, 2.5, 2.5, P.tinta);
  // Guirnalda de luces
  for (let x = 6; x < W - 6; x++) {
    const y = 34 + Math.round(Math.sin(((x % (W / 3)) / (W / 3)) * Math.PI) * 5);
    l.px(x, y, P.sombra);
    if (x % 18 === 0) l.rect(x - 1, y + 1, 3, 3, [P.luz, P.rosaClara, P.cielo][Math.floor(x / 18) % 3]);
  }

  // Cercas laterales vistas desde arriba, con portones
  for (const mx of [0, W - T]) {
    l.rect(mx, cara, T, H - cara, CERCA_OSC);
    for (let y = cara; y < H; y += 6) l.rect(mx + 4, y, T - 8, 5, CERCA);
    const gy = oy + gateraFila * T;
    l.rect(mx, gy, T, T, GRAVA);
    l.rect(mx === 0 ? 0 : W - 6, gy - 2, 6, T + 4, P.hojaOsc);
    l.rect(mx === 0 ? 1 : W - 5, gy + 2, 4, T - 4, P.hojaMed);
  }
  return l;
}

export function muroInferiorJardin(ancho: number): Lienzo {
  const W = ancho * T;
  const l = new Lienzo(W, T);
  for (let x = 0; x < W; x++)
    for (let y = 0; y < T; y++) {
      const tabla = x % 12;
      l.px(x, y, tabla === 11 ? CERCA_OSC : y < 3 ? clara(CERCA, 0.2) : CERCA);
    }
  l.rect(0, 8, W, 3, CERCA_OSC);
  return l;
}

/** El jardín necesita saber dónde están los pasillos para dibujar los senderos. */
export function crearJardin(esMuro: (x: number, y: number) => boolean): Habitacion {
  return {
    piso: (ancho, alto, fila) => pisoJardin(ancho, alto, fila, esMuro),
    muebles: () => construirMuebles(J_INDIVIDUAL, TARIMA_JARDIN),
    muroInferior: muroInferiorJardin,
    fotos: [],
    mini: { piso: 0xe3d1a8, muro: 0x5e9a50 },
  };
}
