import { ALTO_PARED, construirMuebles, T, type Dibujo, type EstiloTarima, type Habitacion, type Retrato } from "./habitacion";
import { escribir } from "./letras";
import { Lienzo } from "./Lienzo";
import { banca, jardinera } from "./living";
import { P, type Color } from "./paleta";
import { caja, cilindro, clara, florero, hash, libros, lomos, osc, planta, taza, tetera } from "./primitivas";

// La cocina de Begoña (nivel 2): cocina de campo, con harina por todos lados.

const VERDE_MUEBLE = 0x8fae94;
const VERDE_MUEBLE_OSC = 0x6f8f76;
const MARMOL = 0xece6da;
const ACERO = 0xb9c2c7;

const TARIMA_COCINA: EstiloTarima = { tapa: 0xb77f5f, linea: 0xa56f52, borde: P.terracotaClara, frente: P.terracotaOsc };

// ---------- objetos de cocina ----------

function frasco(l: Lienzo, cx: number, base: number, c: Color, alto = 7): void {
  l.rect(cx - 3, base - alto, 7, alto, 0xdfeef2);
  l.rect(cx - 2, base - alto + 2, 5, alto - 2, c);
  l.vline(cx - 2, base - alto + 2, alto - 3, clara(c, 0.4));
  l.rect(cx - 3, base - alto - 2, 7, 2, P.madera);
  l.hline(cx - 2, base - alto + 3, 5, P.cremaClara);
}

function olla(l: Lienzo, cx: number, base: number): void {
  cilindro(l, cx, base, 7, 3, 7, P.terracota, 0xe7a94b);
  l.px(cx - 3, base - 7, P.hojaMed);
  l.px(cx + 2, base - 8, P.fuego);
  l.px(cx, base - 6, P.cremaClara);
  l.hline(cx - 9, base - 5, 2, P.tinta);
  l.hline(cx + 8, base - 5, 2, P.tinta);
  for (const dx of [-2, 2]) for (let j = 0; j < 8; j += 2) l.px(cx + dx + (j % 4 ? 1 : 0), base - 13 - j, P.cremaClara);
}

function sarten(l: Lienzo, cx: number, base: number): void {
  l.ovalo(cx, base - 2, 7, 3.5, P.grisOsc);
  l.ovalo(cx, base - 2, 5.5, 2.5, 0x3a3533);
  l.hline(cx + 7, base - 2, 6, P.tinta);
  for (const dx of [-2.5, 2.5]) {
    l.ovalo(cx + dx, base - 2, 2, 1.3, P.cremaClara);
    l.px(cx + dx, base - 2, P.mostazaClara);
  }
}

function pan(l: Lienzo, cx: number, base: number): void {
  l.ovalo(cx, base - 3, 7, 3.5, P.mostazaOsc);
  l.ovalo(cx, base - 4, 6, 2.5, P.mostaza);
  for (let i = -4; i <= 4; i += 4) l.linea(cx + i - 1, base - 6, cx + i + 1, base - 3, P.mostazaOsc);
}

function torta(l: Lienzo, cx: number, base: number): void {
  cilindro(l, cx, base, 5, 1.5, 2, P.cremaClara, P.cremaClara);
  cilindro(l, cx, base - 2, 8, 3, 7, 0xf2d7b6, P.rosaClara);
  for (let i = -6; i <= 6; i += 4) l.px(cx + i, base - 10, P.rojo);
  for (let i = -7; i <= 7; i += 3) l.vline(cx + i, base - 9, 2 + (i % 2 ? 1 : 0), P.rosaClara);
}

function frutero(l: Lienzo, cx: number, base: number): void {
  l.ovalo(cx - 3, base - 5, 2.5, 2.5, P.fuego);
  l.ovalo(cx + 3, base - 5, 2.5, 2.5, P.rojo);
  l.ovalo(cx, base - 7, 2.5, 2.5, P.mostazaClara);
  l.rect(cx - 6, base - 4, 13, 3, P.cremaOsc);
  l.hline(cx - 5, base - 1, 11, P.cremaOsc);
}

function galletas(l: Lienzo, x: number, y: number, filas: number, cols: number): void {
  l.rect(x, y, cols * 5 + 2, filas * 5 + 2, ACERO);
  for (let j = 0; j < filas; j++)
    for (let i = 0; i < cols; i++) {
      l.ovalo(x + 3 + i * 5, y + 3 + j * 5, 2, 2, P.mostaza);
      l.px(x + 3 + i * 5, y + 3 + j * 5, P.maderaOsc);
    }
}

/** Mueble de cocina: tapa de mármol y puertas verdes. */
function mueble(items: ((l: Lienzo, tx: number, ty: number, tw: number, th: number) => void) | null, puertas = VERDE_MUEBLE): Dibujo {
  return (l, x, y, w, h) =>
    caja(l, x, y + 4, w, h - 4, 18, MARMOL, puertas, {
      frente: (l2, fx, fy, fw, fh) => {
        const n = Math.max(1, Math.round(fw / 24));
        const dw = Math.floor((fw - 2) / n);
        for (let i = 0; i < n; i++) {
          l2.marco(fx + 1 + i * dw, fy + 2, dw - 1, fh - 4, osc(puertas, 0.82));
          l2.rect(fx + 1 + i * dw + (i % 2 ? 3 : dw - 5), fy + 6, 1, 4, ACERO);
        }
      },
      tapa: items ?? undefined,
    });
}

function estanteFrascos(colores: Color[]): Dibujo {
  return (l, x, y, w, h) =>
    caja(l, x + 1, y, w - 2, h, 16, P.maderaMed, P.madera, {
      frente: (l2, fx, fy, fw, fh) => {
        l2.rect(fx + 2, fy + 2, fw - 4, fh - 4, P.maderaOsc);
        for (let i = 0; i < 3; i++) frasco(l2, fx + 5 + i * 6, fy + fh - 2, colores[i % colores.length], 6);
      },
      tapa: (l2, tx, ty, tw, th) => colores.forEach((c, i) => frasco(l2, tx + tw / 2, ty + Math.round(((i + 0.9) * th) / colores.length), c)),
    });
}

function pisosAltos(cojines: Color[]): Dibujo {
  return (l, x, y, w, h) => {
    const cx = x + w / 2;
    cojines.forEach((c, i) => {
      const base = y + Math.round(((i + 0.85) * h) / cojines.length);
      l.linea(cx - 6, base, cx - 4, base - 12, P.madera);
      l.linea(cx + 6, base, cx + 4, base - 12, P.madera);
      l.hline(cx - 5, base - 5, 11, P.maderaOsc);
      cilindro(l, cx, base - 12, 8, 3.5, 3, P.madera, c);
    });
  };
}

// ---------- el catálogo de la cocina (uno por bloque) ----------

const C_INDIVIDUAL: Dibujo[] = [
  // 0 · canastos de la despensa
  (l, x, y, w, h) => {
    for (const [cx, base, c, n] of [[x + 13, y + 22, 0xc9a77a, 5], [x + w - 13, y + 26, 0x9c5a8e, 4], [x + 16, y + h - 4, P.cremaClara, 5]] as [number, number, Color, number][]) {
      cilindro(l, cx, base, 11, 4, 9, P.maderaClara, P.maderaMed);
      for (let i = -9; i <= 9; i += 3) l.vline(cx + i, base - 8, 8, P.maderaMed);
      for (let i = 0; i < n; i++) l.ovalo(cx - 6 + (i % 3) * 5, base - 11 - Math.floor(i / 3) * 3, 2.5, 2, c);
    }
    for (let i = 0; i < 6; i++) l.ovalo(x + w - 20 + i * 3, y + h - 8 + (i % 2), 2, 2, P.cremaClara);
  },
  // 1 · isla de amasar con harina y huellitas de Begoña
  (l, x, y, w, h) =>
    caja(l, x, y + 4, w, h - 4, 18, P.maderaClara, P.madera, {
      frente: (l2, fx, fy, fw, fh) => {
        for (let i = 0; i < 3; i++) l2.marco(fx + 2 + i * 23, fy + 2, 22, fh - 4, P.maderaOsc);
        l2.rect(fx + 30, fy + 3, 10, 12, P.cremaClara);
        for (let j = 0; j < 12; j += 3) l2.hline(fx + 30, fy + 3 + j, 10, P.rosaClara);
      },
      tapa: (l2, tx, ty, tw, th) => {
        for (let i = 4; i < tw; i += 8) l2.vline(tx + i, ty + 1, th - 2, osc(P.maderaClara, 0.9));
        l2.ovalo(tx + 20, ty + 14, 13, 8, P.cremaClara);
        l2.ovalo(tx + 20, ty + 14, 7, 5, 0xf3e3c3);
        l2.ovalo(tx + 18, ty + 12, 3, 1.5, P.cremaClara);
        l2.linea(tx + 34, ty + 20, tx + 52, ty + 12, P.maderaMed);
        l2.linea(tx + 34, ty + 21, tx + 52, ty + 13, P.maderaClara);
        for (const [px, py] of [[8, 24], [14, 27], [40, 6]]) {
          l2.px(tx + px, ty + py, P.cremaClara);
          l2.px(tx + px - 2, ty + py - 2, P.cremaClara);
          l2.px(tx + px, ty + py - 3, P.cremaClara);
          l2.px(tx + px + 2, ty + py - 2, P.cremaClara);
        }
        l2.rect(tx + tw - 18, ty + 4, 14, 8, P.cremaOsc);
        for (let i = 0; i < 3; i++) l2.ovalo(tx + tw - 15 + i * 4, ty + 7, 1.5, 2, P.cremaClara);
        l2.rect(tx + tw - 16, ty + 16, 12, 12, P.crema);
        escribir(l2, "H", tx + tw - 10, ty + 20, P.madera);
      },
    }),
  // 2 · especiero alto
  estanteFrascos([P.rojo, P.mostaza, P.hojaMed, P.madera]),
  // 3 · mesón largo con cafetera, panera y frutero
  mueble((l, tx, ty, tw, th) => {
    const b = ty + th - 4;
    l.rect(tx + 6, b - 14, 12, 14, 0x3a3533);
    l.rect(tx + 8, b - 8, 8, 6, 0x6b4226);
    l.rect(tx + 24, b - 10, 20, 10, P.mostazaOsc);
    l.hline(tx + 24, b - 10, 20, P.mostaza);
    escribir(l, "PAN", tx + 34, b - 7, P.cremaClara);
    frutero(l, tx + 58, b);
    tetera(l, tx + 78, b, P.terracotaClara);
    l.rect(tx + 92, b - 12, 7, 12, P.crema);
    l.linea(tx + 94, b - 12, tx + 92, b - 20, P.maderaClara);
    l.linea(tx + 96, b - 12, tx + 97, b - 21, ACERO);
    planta(l, tx + tw - 8, b, "hierbas", 7);
  }),
  // 4 · libros de cocina y radio
  (l, x, y, w, h) =>
    caja(l, x + 1, y, w - 2, h, 16, P.maderaMed, P.madera, {
      frente: (l2, fx, fy, fw, fh) => lomos(l2, fx + 2, fy + 3, fw - 4, fh - 5, 44),
      tapa: (l2, tx, ty, tw, th) => {
        const cx = tx + tw / 2;
        l2.rect(cx - 7, ty + 6, 14, 10, P.salvia);
        l2.hline(cx - 7, ty + 6, 14, P.salviaClara);
        for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) l2.px(cx - 5 + i * 2, ty + 9 + j * 2, P.salviaOsc);
        l2.ovalo(cx + 3, ty + 11, 2, 2, P.mostazaClara);
        l2.linea(cx + 5, ty + 6, cx + 8, ty, P.grisOsc);
        libros(l2, cx, ty + th * 0.6, [P.rojo, P.mostaza, P.azul]);
        planta(l2, cx, ty + th - 4, "hierbas", 6);
      },
    }),
  // 5 · mesón de picar
  mueble((l, tx, ty, tw, th) => {
    l.rect(tx + 6, ty + 5, 26, 16, P.maderaClara);
    l.marco(tx + 6, ty + 5, 26, 16, P.maderaMed);
    for (const [px, py] of [[12, 10], [18, 13], [24, 9]]) {
      l.ovalo(tx + px, ty + py, 2.5, 2.5, P.rojo);
      l.px(tx + px, ty + py - 2, P.hojaMed);
    }
    l.hline(tx + 14, ty + 17, 12, ACERO);
    l.hline(tx + 26, ty + 17, 4, P.madera);
    cilindro(l, tx + 48, ty + th - 4, 9, 3.5, 5, P.azulClaro, P.hojaClara);
    l.ovalo(tx + 62, ty + 12, 3, 3, 0x9c5a8e);
    l.ovalo(tx + 62, ty + 12, 1, 1, P.cremaClara);
  }),
  // 6 · refrigerador con imanes y un dibujo
  (l, x, y, w, h) =>
    caja(l, x + 6, y + 6, w - 12, h - 8, 34, P.cremaClara, 0xf4f1ea, {
      frente: (l2, fx, fy, fw, fh) => {
        l2.hline(fx + 1, fy + 10, fw - 2, P.grisClaro);
        l2.rect(fx + fw - 5, fy + 13, 2, 14, ACERO);
        l2.rect(fx + fw - 5, fy + 3, 2, 5, ACERO);
        l2.rect(fx + 5, fy + 14, 12, 10, P.cremaClara);
        l2.marco(fx + 5, fy + 14, 12, 10, P.grisClaro);
        l2.ovalo(fx + 11, fy + 19, 3, 2.5, P.mostaza);
        l2.px(fx + 9, fy + 17, P.mostaza);
        l2.px(fx + 13, fy + 17, P.mostaza);
        l2.px(fx + 20, fy + 16, P.rojo);
        l2.px(fx + 22, fy + 20, P.azul);
        l2.px(fx + 8, fy + 4, P.hojaMed);
      },
      tapa: (l2, tx, ty) => {
        l2.rect(tx + 4, ty + 3, 12, 8, P.mostaza);
        planta(l2, tx + 22, ty + 12, "colgante", 6, P.crema);
      },
    }),
  // 7 · cocina con olla humeante y huevos fritos
  (l, x, y, w, h) =>
    caja(l, x + 2, y + 4, w - 4, h - 6, 20, 0x3a3533, 0x2e2a28, {
      frente: (l2, fx, fy, fw, fh) => {
        l2.rect(fx + 5, fy + 6, fw - 10, fh - 9, 0x221e1c);
        l2.rect(fx + 8, fy + 9, fw - 16, fh - 15, osc(P.fuego, 0.6));
        l2.hline(fx + 6, fy + 3, fw - 12, ACERO);
        for (let i = 0; i < 4; i++) l2.px(fx + 8 + i * 8, fy + 2, P.mostazaClara);
      },
      tapa: (l2, tx, ty, tw, th) => {
        for (const [a, b] of [[0.3, 0.35], [0.72, 0.35], [0.3, 0.78], [0.72, 0.78]]) l2.ovalo(tx + tw * a, ty + th * b, 6, 4, 0x4a4542);
        olla(l2, tx + tw * 0.3, ty + th * 0.45);
        sarten(l2, tx + tw * 0.68, ty + th * 0.82);
        tetera(l2, tx + tw * 0.72, ty + th * 0.42, P.salvia);
      },
    }),
  // 8 · estación de Begoña: sus platos con su nombre
  (l, x, y, w, h) => {
    l.rect(x + 2, y + 5, w - 4, h - 8, P.mostaza);
    l.marco(x + 2, y + 5, w - 4, h - 8, P.mostazaOsc);
    cilindro(l, x + 14, y + h - 9, 7, 3, 3, ACERO, 0x8e5b3a);
    for (let i = 0; i < 4; i++) l.px(x + 11 + i * 2, y + h - 12, P.maderaOsc);
    cilindro(l, x + w - 14, y + h - 9, 7, 3, 3, P.rosa, P.azulClaro);
    escribir(l, "BEGOÑA", x + w / 2, y + h - 7, P.maderaOsc);
  },
  // 9 · pisos altos
  pisosAltos([P.salviaClara, P.rosaClara, P.mostazaClara]),
  // 10 · jardinera de hierbas
  jardinera(["hierbas", "flores", "hierbas"], false),
  // 11 · basurero y escoba
  (l, x, y, w, h) => {
    cilindro(l, x + w / 2 - 2, y + h - 6, 7, 3, 14, P.salvia, P.salviaOsc);
    l.hline(x + w / 2 - 4, y + h - 21, 5, P.tinta);
    l.linea(x + w - 4, y + h - 2, x + w - 2, y - 14, P.maderaClara);
    for (let i = -3; i <= 3; i++) l.linea(x + w - 4, y + h - 6, x + w - 4 + i, y + h, P.mostaza);
  },
  // 12 · mesa del comedor con el almuerzo
  (l, x, y, w, h) => {
    for (const cx of [x + 30, x + w / 2, x + w - 30]) caja(l, cx - 9, y + 2, 18, 8, 16, P.maderaMed, P.madera);
    caja(l, x + 4, y + 12, w - 8, h - 16, 16, P.cremaClara, P.crema, {
      patas: true,
      tapa: (l2, tx, ty, tw, th) => {
        for (let j = 0; j < th; j++) for (let i = 0; i < tw; i++) if ((Math.floor(i / 4) + Math.floor(j / 4)) % 2 === 0) l2.px(tx + i, ty + j, P.rosaClara);
        l2.rect(tx + 10, ty + th / 2 - 4, tw - 20, 8, P.cremaClara);
        const b = ty + th / 2 + 4;
        cilindro(l2, tx + 18, b, 9, 4, 5, P.maderaClara, P.maderaMed);
        pan(l2, tx + 18, b - 3);
        l2.rect(tx + 38, b - 10, 22, 12, P.maderaClara);
        for (const dx of [42, 50]) {
          for (let j = 0; j < 5; j++) l2.hline(tx + dx + j, b - 8 + j, 6 - j, P.queso);
        }
        tetera(l2, tx + 78, b, P.mostaza);
        florero(l2, tx + 98, b, P.azulClaro);
        taza(l2, tx + 114, b, P.cremaClara, true);
        taza(l2, tx + 130, b, P.rosaClara, false);
        l2.ovalo(tx + 146, b - 3, 6, 3, P.cremaClara);
        l2.ovalo(tx + 146, b - 3, 3, 1.5, P.rojo);
      },
    });
  },
  // 13 · repisa de mermeladas
  (l, x, y, w, h) =>
    caja(l, x + 2, y + 6, w - 4, h - 8, 10, P.maderaMed, P.madera, {
      tapa: (l2, tx, ty, tw, th) => [P.rojo, 0x9c5a8e, P.fuego, P.rojo, P.mostaza].forEach((c, i) => frasco(l2, tx + 7 + i * 12, ty + th - 1, c)),
    }),
  // 14 · mesita con jarro de agua
  (l, x, y, w, h) => {
    const cx = x + w / 2;
    const base = y + h - 6;
    cilindro(l, cx, base, 9, 4, 13, P.maderaMed, P.maderaClara);
    l.rect(cx - 5, base - 23, 6, 9, 0xdfeef2);
    l.rect(cx - 4, base - 20, 4, 6, P.azulClaro);
    l.rect(cx + 3, base - 19, 3, 5, 0xdfeef2);
  },
  // 15 · banca con cojines
  banca([P.rosaClara, P.salviaClara, P.mostazaClara]),
  // 16 · lavaplatos con secador de loza
  mueble((l, tx, ty, tw, th) => {
    l.rect(tx + 4, ty + 4, 22, 16, ACERO);
    l.rect(tx + 6, ty + 6, 18, 12, 0x9aa4aa);
    l.px(tx + 15, ty + 12, P.grisOsc);
    l.rect(tx + 13, ty, 3, 6, P.grisClaro);
    for (let i = 0; i < 4; i++) l.ovalo(tx + 32 + i * 4, ty + th - 10, 1.5, 5, P.cremaClara);
    l.rect(tx + 30, ty + th - 6, 16, 2, P.grisClaro);
    l.rect(tx + 32, ty + 4, 8, 4, P.mostazaClara);
  }, 0xd9cfbf),
  // 17 · fuente de agua y frasco de premios
  (l, x, y, w, h) => {
    cilindro(l, x + 13, y + h - 5, 9, 4, 5, P.cremaClara, P.azulClaro);
    l.ovalo(x + 13, y + h - 11, 2, 1, P.cremaClara);
    frasco(l, x + w - 12, y + h - 3, 0xe8c9a0, 12);
  },
  // 18 · basureros de reciclaje
  (l, x, _y, w, h) => {
    caja(l, x + 2, _y + 6, w / 2 - 3, h - 8, 12, P.hojaMed, P.hoja);
    caja(l, x + w / 2 + 1, _y + 6, w / 2 - 3, h - 8, 12, P.azulClaro, P.azul);
  },
  // 19 · torta de frutillas enfriándose en un carrito
  (l, x, y, w, h) =>
    caja(l, x + 4, y + 8, w - 8, h - 10, 18, ACERO, P.grisClaro, {
      patas: true,
      tapa: (l2, tx, ty, tw, th) => {
        for (let i = 3; i < tw; i += 4) l2.vline(tx + i, ty + 1, th - 2, P.grisClaro);
        torta(l2, tx + tw / 2, ty + th - 6);
      },
    }),
  // 20 · estante de platos
  (l, x, y, w, h) =>
    caja(l, x + 1, y, w - 2, h, 14, P.maderaMed, P.madera, {
      tapa: (l2, tx, ty, tw, th) => {
        const cx = tx + tw / 2;
        [P.cremaClara, P.azulClaro, P.rosaClara, P.cremaClara].forEach((c, i) => {
          const b = ty + Math.round(((i + 0.85) * th) / 4);
          for (let k = 0; k < 3; k++) cilindro(l2, cx, b - k * 2, 7, 2.5, 1, c, c);
        });
      },
    }),
  // 21 · piso con canasto de ropa
  pisosAltos([P.azulClaro, P.cremaClara]),
  // 22 · banco con canastos
  (l, x, y, w, h) =>
    caja(l, x + 1, y + 4, w - 2, h - 6, 8, P.maderaMed, P.madera, {
      patas: true,
      tapa: (l2, tx, ty, tw, th) => {
        for (let i = 0; i < 3; i++) {
          const cx = tx + 11 + i * 23;
          cilindro(l2, cx, ty + th - 1, 8, 3, 6, P.maderaClara, P.maderaMed);
          l2.ovalo(cx - 2, ty + th - 8, 2.5, 2, [P.fuego, P.hojaMed, 0xc9a77a][i]);
          l2.ovalo(cx + 2, ty + th - 7, 2.5, 2, [P.mostazaClara, P.hojaClara, P.cremaClara][i]);
        }
      },
    }),
  // 23 · isla de repostería
  (l, x, y, w, h) =>
    caja(l, x + 2, y + 4, w - 4, h - 6, 20, MARMOL, VERDE_MUEBLE, {
      frente: (l2, fx, fy, fw, fh) => {
        for (let i = 0; i < 6; i++) l2.marco(fx + 2 + i * 27, fy + 2, 26, fh - 4, VERDE_MUEBLE_OSC);
        l2.rect(fx + 60, fy + 4, 9, 12, P.cremaClara);
        for (let j = 0; j < 12; j += 3) l2.hline(fx + 60, fy + 4 + j, 9, P.azulClaro);
      },
      tapa: (l2, tx, ty, tw, th) => {
        galletas(l2, tx + 6, ty + 6, 3, 4);
        torta(l2, tx + 42, ty + th - 8);
        cilindro(l2, tx + 66, ty + th - 8, 10, 4, 7, P.azulClaro, 0xf3e3c3);
        l2.linea(tx + 68, ty + th - 16, tx + 74, ty + th - 26, ACERO);
        for (let i = 0; i < 3; i++) l2.ovalo(tx + 86 + i * 5, ty + th - 10, 2, 2.5, P.cremaClara);
        l2.rect(tx + 102, ty + 6, 24, 16, P.cremaClara);
        l2.vline(tx + 114, ty + 6, 16, P.cremaOsc);
        for (let j = 9; j < 20; j += 3) {
          l2.hline(tx + 104, ty + j, 8, P.cremaOsc);
          l2.hline(tx + 116, ty + j, 8, P.cremaOsc);
        }
        l2.ovalo(tx + 140, ty + th - 10, 8, 5, P.cremaClara);
        l2.linea(tx + 132, ty + th - 5, tx + 150, ty + th - 14, P.maderaClara);
      },
    }),
  // 24 · jardinera de hierbas
  jardinera(["hierbas", "hierbas", "flores"], false),
  // 25 · balde y trapero
  (l, x, y, w, h) => {
    cilindro(l, x + w / 2, y + h - 6, 7, 3, 9, P.azulClaro, P.azul);
    l.linea(x + w / 2 + 2, y + h - 12, x + w / 2 + 6, y - 12, P.maderaClara);
    l.ovalo(x + w / 2 + 1, y + h - 14, 4, 2, P.cremaOsc);
  },
  // 26 · pisos altos
  pisosAltos([P.mostazaClara, P.salviaClara, P.rosaClara]),
  // 27 · cajón de naranjas y limones
  (l, x, y, w, h) =>
    caja(l, x + 2, y + 6, w - 4, h - 8, 10, P.maderaClara, P.maderaMed, {
      frente: (l2, fx, fy, fw, fh) => l2.hline(fx, fy + fh / 2, fw, P.madera),
      tapa: (l2, tx, ty, tw, th) => {
        for (let i = 0; i < 8; i++) l2.ovalo(tx + 4 + i * 5, ty + th / 2 - 1 + (i % 2), 2.5, 2.5, i % 3 === 2 ? P.mostazaClara : P.fuego);
      },
    }),
  // 28 · lavadora con ropa girando
  (l, x, y, w, h) => {
    caja(l, x + 4, y + 8, w - 16, h - 10, 26, 0xf4f1ea, P.cremaClara, {
      frente: (l2, fx, fy, fw, fh) => {
        l2.ovalo(fx + fw / 2, fy + fh / 2 + 1, 9, 9, P.grisClaro);
        l2.ovalo(fx + fw / 2, fy + fh / 2 + 1, 7, 7, P.azulClaro);
        l2.ovalo(fx + fw / 2 - 2, fy + fh / 2, 3, 2, P.rosa);
        l2.ovalo(fx + fw / 2 + 2, fy + fh / 2 + 3, 3, 2, P.mostazaClara);
      },
      tapa: (l2, tx, ty, tw) => {
        l2.rect(tx + 2, ty + 2, tw - 4, 5, P.grisClaro);
        l2.px(tx + 5, ty + 4, P.hojaMed);
        l2.px(tx + 9, ty + 4, P.grisOsc);
      },
    });
    cilindro(l, x + w - 8, y + h - 4, 7, 3, 11, P.maderaClara, P.maderaMed);
    l.ovalo(x + w - 9, y + h - 16, 3, 2, P.lilaClara);
  },
  // 29 · huerto de hierbas con etiquetas
  (l, x, y, w, h) =>
    caja(l, x + 2, y + 4, w - 4, h - 6, 10, P.maderaClara, P.maderaMed, {
      frente: (l2, fx, fy, fw) => {
        l2.rect(fx + 3, fy + 2, fw / 2 - 4, 6, P.cremaClara);
        l2.rect(fx + fw / 2 + 1, fy + 2, fw / 2 - 4, 6, P.cremaClara);
      },
      tapa: (l2, tx, ty, tw, th) => {
        l2.rect(tx + 2, ty + 2, tw - 4, th - 4, 0x5c3d2a);
        for (const [a, b] of [[0.28, 0.4], [0.72, 0.4], [0.28, 0.9], [0.72, 0.9]]) planta(l2, tx + tw * a, ty + th * b, "hierbas", 8);
      },
    }),
  // 30 · mesón con batidora y receta de pan amasado
  mueble((l, tx, ty, tw, th) => {
    const b = ty + th - 4;
    l.rect(tx + 6, b - 20, 8, 14, P.terracotaClara);
    l.rect(tx + 4, b - 22, 16, 5, P.terracotaClara);
    cilindro(l, tx + 12, b, 7, 3, 6, ACERO, 0xf3e3c3);
    l.rect(tx + 26, b - 16, 26, 14, P.cremaClara);
    l.vline(tx + 39, b - 16, 14, P.cremaOsc);
    escribir(l, "PAN", tx + 32, b - 13, P.madera);
    for (let j = b - 12; j < b - 3; j += 3) l.hline(tx + 42, j, 8, P.cremaOsc);
    for (let i = 0; i < 2; i++) l.ovalo(tx + 60 + i * 5, b - 3, 2, 2.5, P.cremaClara);
  }),
  // 31 · despensa de frascos
  estanteFrascos([P.fuego, 0x9c5a8e, P.hojaMed]),
  // 32 · aparador con mermeladas, pan y huevos
  (l, x, y, w, h) =>
    caja(l, x, y + 6, w, h - 6, 18, P.maderaClara, P.maderaMed, {
      frente: (l2, fx, fy, fw, fh) => {
        for (let i = 0; i < 4; i++) {
          l2.marco(fx + 2 + i * 29, fy + 2, 28, fh - 4, P.madera);
          l2.px(fx + 2 + i * 29 + (i % 2 ? 3 : 24), fy + fh / 2, P.mostazaClara);
        }
      },
      tapa: (l2, tx, ty, tw, th) => {
        const b = ty + th - 3;
        [P.rojo, 0x9c5a8e, P.fuego].forEach((c, i) => frasco(l2, tx + 8 + i * 9, b, c));
        pan(l2, tx + 46, b);
        pan(l2, tx + 62, b - 4);
        cilindro(l2, tx + 84, b, 9, 3.5, 5, P.maderaClara, P.maderaMed);
        for (let i = 0; i < 3; i++) l2.ovalo(tx + 80 + i * 4, b - 7, 1.8, 2.3, P.cremaClara);
        frasco(l2, tx + 104, b, P.mostazaClara, 9);
      },
    }),
  // 33 · especiero
  estanteFrascos([P.mostaza, P.rojo, P.cremaClara, P.hojaMed]),
  // 34 · mesa del desayuno
  (l, x, y, w, h) =>
    caja(l, x + 2, y + 6, w - 4, h - 8, 14, P.cremaClara, P.crema, {
      patas: true,
      tapa: (l2, tx, ty, tw, th) => {
        for (let j = 0; j < th; j++) for (let i = 0; i < tw; i++) if ((Math.floor(i / 4) + Math.floor(j / 4)) % 2 === 0) l2.px(tx + i, ty + j, P.azulClaro);
        const b = ty + th - 4;
        tetera(l2, tx + 14, b, P.salvia);
        taza(l2, tx + 30, b, P.cremaClara, true);
        for (let i = 0; i < 2; i++) {
          cilindro(l2, tx + 42 + i * 7, b, 2.5, 1, 3, P.cremaClara, P.cremaClara);
          l2.ovalo(tx + 42 + i * 7, b - 5, 2, 2.3, P.cremaClara);
        }
        l2.rect(tx + 54, b - 9, 5, 9, 0xdfeef2);
        l2.rect(tx + 55, b - 7, 3, 6, P.fuego);
      },
    }),
  // 35 · cocina a leña antigua
  (l, x, y, w, h) =>
    caja(l, x + 2, y + 6, w - 4, h - 8, 22, 0x3a3533, 0x2a2624, {
      frente: (l2, fx, fy, fw, fh) => {
        l2.hline(fx + 2, fy + 2, fw - 4, P.mostazaClara);
        l2.rect(fx + 4, fy + 6, fw / 2 - 4, fh - 10, P.fuego);
        l2.rect(fx + 5, fy + fh - 8, fw / 2 - 6, 3, P.fuegoClaro);
        l2.rect(fx + fw / 2 + 3, fy + 6, fw / 2 - 7, fh - 10, 0x4a4542);
        l2.px(fx + fw - 7, fy + fh / 2, P.mostazaClara);
      },
      tapa: (l2, tx, ty, tw, th) => {
        tetera(l2, tx + 12, ty + th - 4, P.terracota);
        cilindro(l2, tx + tw - 12, ty + th - 4, 7, 3, 6, ACERO, 0xe7a94b);
      },
    }),
];

// ---------- piso y paredes ----------

/** Dibujo de Begoña pegado en la pared (la foto HD va encima en el juego). */
const DIBUJO: Retrato = { clave: "begona", x: 16 * T + 8, y: -ALTO_PARED + 10, w: 26, h: 22 };

export function pisoCocina(ancho: number, alto: number, gateraFila: number): Lienzo {
  const W = ancho * T;
  const H = alto * T + ALTO_PARED;
  const l = new Lienzo(W, H);
  const oy = ALTO_PARED;

  // Baldosas en damero, con fragüe
  for (let y = oy + T; y < oy + (alto - 1) * T; y++)
    for (let x = T; x < W - T; x++) {
      const bx = Math.floor(x / 12);
      const by = Math.floor((y - oy) / 12);
      let c: Color = (bx + by) % 2 ? 0xf1e6d0 : 0xc9d8b5;
      if (x % 12 === 0 || (y - oy) % 12 === 0) c = 0xdccdb1;
      else if (x % 12 === 1 && (y - oy) % 12 === 1) c = clara(c, 0.4);
      l.px(x, y, c);
    }
  for (let x = T; x < W - T; x++) for (let j = 0; j < 4; j++) l.tono(x, oy + T + j, -0.2 + j * 0.05);

  // Pared: azulejos tipo metro, repisa con frascos, ventana con hierbas, utensilios colgando
  const cara = oy + T;
  for (let y = 0; y < cara; y++)
    for (let x = 0; x < W; x++) {
      const fila = Math.floor(y / 6);
      const junta = y % 6 === 0 || (x + (fila % 2) * 6) % 12 === 0;
      l.px(x, y, junta ? 0xd9cfc0 : 0xf4efe6);
    }
  l.rect(0, 0, W, 4, P.maderaOsc);
  l.rect(0, cara - 8, W, 8, VERDE_MUEBLE);
  l.hline(0, cara - 8, W, 0xa8c4ac);
  l.rect(0, cara - 2, W, 2, VERDE_MUEBLE_OSC);

  const vx = 11 * T + 10;
  const vw = 5 * T - 20;
  l.rect(vx, 6, vw, cara - 18, P.cremaClara);
  l.rect(vx + 3, 9, vw - 6, cara - 26, P.cielo);
  l.vline(vx + vw / 2, 9, cara - 26, P.cremaClara);
  for (let i = 0; i < 10; i++) l.px(vx + 10 + i, 24 - i, P.cremaClara);
  l.rect(vx - 4, cara - 14, vw + 8, 3, P.crema);
  planta(l, vx + 14, cara - 14, "hierbas", 6);
  planta(l, vx + vw / 2, cara - 14, "flores", 6, P.terracota, P.rojo);
  planta(l, vx + vw - 14, cara - 14, "hierbas", 6);
  l.rect(vx, 4, vw, 4, P.mostaza);
  for (let i = 0; i < vw; i += 6) l.rect(vx + i, 8, 3, 3, P.mostaza);

  l.rect(2 * T, 26, 7 * T, 3, P.madera);
  [P.mostaza, P.rojo, P.hojaMed, P.madera, P.cremaClara, 0x9c5a8e, P.fuego].forEach((c, i) => frasco(l, 2 * T + 10 + i * 22, 26, c, 8));

  l.hline(18 * T, 14, 6 * T, ACERO);
  for (let i = 0; i < 6; i++) {
    const ux = 18 * T + 12 + i * 22;
    l.vline(ux, 14, 4, P.grisOsc);
    if (i % 3 === 1) {
      l.ovalo(ux, 26, 7, 7, P.terracota);
      l.ovalo(ux, 26, 5, 5, P.terracotaOsc);
    } else {
      l.vline(ux, 18, 10, i % 2 ? ACERO : P.maderaClara);
      l.ovalo(ux, 30, 3, 4, i % 2 ? ACERO : P.maderaClara);
    }
  }
  l.ovalo(9 * T + 12, 16, 7, 7, P.maderaMed);
  l.ovalo(9 * T + 12, 16, 5, 5, P.cremaClara);
  l.vline(9 * T + 12, 12, 4, P.tinta);
  l.hline(9 * T + 12, 16, 3, P.tinta);

  // Marco del dibujo de Begoña, pegado con cinta
  l.rect(DIBUJO.x - 2, DIBUJO.y + oy - 2, DIBUJO.w + 4, DIBUJO.h + 4, P.cremaClara);
  l.rect(DIBUJO.x + DIBUJO.w / 2 - 5, DIBUJO.y + oy - 4, 10, 4, 0xf4e6a8);

  // Muros laterales y gateras
  for (const mx of [0, W - T]) {
    l.rect(mx, cara, T, H - cara, VERDE_MUEBLE_OSC);
    l.vline(mx === 0 ? T - 2 : mx + 1, cara, H - cara, VERDE_MUEBLE);
    l.vline(mx === 0 ? T - 1 : mx, cara, H - cara, 0xa8c4ac);
    const gy = oy + gateraFila * T;
    l.rect(mx, gy, T, T, 0xf1e6d0);
    l.rect(mx === 0 ? 0 : W - 6, gy - 2, 6, T + 4, P.tinta);
    l.rect(mx === 0 ? 1 : W - 5, gy + 2, 4, T - 4, P.madera);
  }

  // Alfombra de trapo en la fila 4 y camino en la fila central
  const ky = oy + 4 * T + 4;
  const trapo = [P.terracotaClara, P.azulClaro, P.cremaClara, P.mostazaClara];
  for (let x = T + 6; x < W - T - 6; x++) for (let j = 0; j < 16; j++) l.px(x, ky + j, trapo[Math.floor(j / 3) % 4]);
  for (let j = 0; j < 16; j += 2) {
    l.px(T + 4, ky + j, P.cremaClara);
    l.px(W - T - 5, ky + j, P.cremaClara);
  }
  // Huellitas de harina de Begoña cruzando la cocina
  for (let i = 0; i < 26; i++) {
    const hx = 3 * T + i * 18;
    const hy = oy + 9 * T + (i % 2 ? 8 : 15);
    l.ovalo(hx, hy, 2, 1.5, P.cremaClara);
    l.px(hx - 2, hy - 3, P.cremaClara);
    l.px(hx, hy - 3, P.cremaClara);
    l.px(hx + 2, hy - 3, P.cremaClara);
  }
  for (let i = 0; i < 60; i++) l.px(6 * T + hash(i, 1) * 30, oy + 4 * T + hash(1, i) * 20, P.cremaClara);

  // Calor de las cocinas
  const luz = (lx: number, ly: number, r: number, f: number) => {
    for (let y = ly - r; y < ly + r; y++)
      for (let x = lx - r; x < lx + r; x++) {
        const d = Math.hypot(x - lx, y - ly) / r;
        if (d < 1 && hash(x, y) > d * 0.9) l.tono(x, y, f * (1 - d));
      }
  };
  luz(3 * T, oy + 7 * T, 50, 0.22);
  luz(24 * T, oy + 17 * T, 50, 0.22);
  for (let y = cara; y < cara + 8 * T; y++) {
    const t = (y - cara) / (8 * T);
    for (let x = Math.floor(vx - t * 40); x < vx + vw + t * 40; x++) if ((x + y) % 2 === 0 && hash(x, y) > t) l.tono(x, y, 0.1);
  }
  return l;
}

export function muroInferiorCocina(ancho: number): Lienzo {
  const W = ancho * T;
  const l = new Lienzo(W, T);
  l.rect(0, 0, W, 6, MARMOL);
  l.hline(0, 0, W, P.cremaClara);
  l.rect(0, 6, W, T - 6, VERDE_MUEBLE);
  for (let x = 2; x < W; x += 24) l.marco(x, 8, 22, 14, VERDE_MUEBLE_OSC);
  return l;
}

/** La cocina de Begoña (nivel 2). */
export const COCINA: Habitacion = {
  piso: pisoCocina,
  muebles: () => construirMuebles(C_INDIVIDUAL, TARIMA_COCINA),
  muroInferior: muroInferiorCocina,
  fotos: [DIBUJO],
  mini: { piso: 0xe5e8d3, muro: 0x8fae94 },
};

