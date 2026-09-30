import { escribir } from "./letras";
import { Lienzo } from "./Lienzo";
import { P, type Color } from "./paleta";
import {
  caja,
  cilindro,
  clara,
  florero,
  hash,
  lampara,
  libros,
  lomos,
  marco,
  osc,
  ovillo,
  planta,
  taza,
  tetera,
  tocadiscos,
  vela,
  type TipoPlanta,
} from "./primitivas";

/** Tamaño de una casilla en píxeles de arte. */
export const T = 24;
/** Alto extra de la pared del fondo, por encima de la fila 0 (vista 3/4). */
export const ALTO_PARED = 40;

/** Muebles del living: [columna, fila, ancho, alto] en casillas. Coinciden con los muros del mapa. */
export const BLOQUES: [number, number, number, number][] = [
  [2, 2, 2, 2], [5, 2, 3, 2], [9, 1, 1, 3], [11, 2, 5, 2], [17, 1, 1, 3], [19, 2, 3, 2], [23, 2, 2, 2],
  [2, 5, 2, 2], [2, 8, 2, 1], [5, 5, 1, 4], [7, 5, 3, 1], [7, 7, 1, 2], [10, 6, 7, 3], [17, 5, 3, 1], [19, 7, 1, 2], [21, 5, 1, 4], [23, 5, 2, 2], [23, 8, 2, 1],
  [2, 10, 2, 1], [2, 12, 2, 2], [5, 10, 1, 4], [7, 10, 1, 2], [7, 13, 3, 1], [10, 10, 7, 3], [17, 13, 3, 1], [19, 10, 1, 2], [21, 10, 1, 4], [23, 10, 2, 1], [23, 12, 2, 2],
  [2, 15, 2, 2], [5, 15, 3, 2], [9, 15, 1, 3], [11, 15, 5, 2], [17, 15, 1, 3], [19, 15, 3, 2], [23, 15, 2, 2],
];

/** Margen del lienzo de cada mueble: a los lados, hacia arriba (para lo alto) y hacia abajo. */
const MARGEN = 6;
const ARRIBA = 52;
const ABAJO = 4;

export interface SpriteMueble {
  lienzo: Lienzo;
  /** Esquina superior izquierda en el mundo (píxeles). */
  x: number;
  y: number;
  /** Profundidad: la base del mueble. Lo que esté más abajo en pantalla se dibuja delante. */
  profundidad: number;
}

type Dibujo = (l: Lienzo, x: number, y: number, w: number, h: number) => void;

// ---------- piezas reutilizables ----------

function sofa(tela: Color, telaOsc: Color, cojines: [Color, Color], rasguños: boolean): Dibujo {
  return (l, x, y, w, h) => {
    caja(l, x, y, w, 10, 16, telaOsc, osc(telaOsc));
    const n = Math.max(2, Math.round((w - 16) / 22));
    const cw = Math.floor((w - 16) / n);
    caja(l, x + 2, y + 8, w - 4, h - 8, 9, tela, osc(tela), {
      tapa: (l2, tx, ty, _tw, th) => {
        for (let i = 0; i < n; i++) {
          l2.rect(tx + 6 + i * cw, ty + 2, cw - 1, th - 4, clara(tela, 0.08));
          l2.hline(tx + 6 + i * cw, ty + 2, cw - 1, clara(tela, 0.35));
          l2.vline(tx + 6 + i * cw + cw - 1, ty + 2, th - 4, osc(tela, 0.85));
        }
        // Cojines apoyados en el respaldo
        l2.rect(tx + 7, ty - 5, 9, 8, cojines[0]);
        l2.hline(tx + 7, ty - 5, 9, clara(cojines[0], 0.4));
        if (rasguños) {
          l2.px(tx + 9, ty - 2, P.tinta);
          l2.px(tx + 13, ty - 2, P.tinta);
          l2.px(tx + 11, ty, P.rosa);
          l2.px(tx + 7, ty - 6, cojines[0]);
          l2.px(tx + 15, ty - 6, cojines[0]);
        }
        const x2 = tx + _tw - 18;
        l2.rect(x2, ty - 5, 9, 8, cojines[1]);
        for (let j = 0; j < 8; j += 2) l2.hline(x2, ty - 5 + j, 9, clara(cojines[1], 0.45));
        // Manta tejida que cae por delante
        const mx = tx + Math.round(_tw * 0.58);
        l2.rect(mx, ty + 1, 14, th + 7, P.crema);
        for (let j = 0; j < th + 7; j += 3) for (let i = 0; i < 14; i += 4) l2.px(mx + i + (j % 2), ty + 1 + j, P.cremaOsc);
        for (let i = 0; i < 14; i += 2) l2.px(mx + i, ty + th + 8, P.cremaOsc);
      },
    });
    for (const ax of [x, x + w - 7]) caja(l, ax, y + 6, 7, h - 6, 13, telaOsc, osc(telaOsc));
    if (rasguños)
      for (let i = 0; i < 3; i++) {
        l.linea(x + 1, y + h - 11 + i * 3, x + 5, y + h - 9 + i * 3, osc(telaOsc, 0.55));
        l.px(x + 6, y + h - 8 + i * 3, P.crema);
      }
  };
}

function estanteAlto(items: ((l: Lienzo, cx: number, base: number) => void)[], sem: number): Dibujo {
  return (l, x, y, w, h) =>
    caja(l, x + 1, y, w - 2, h, 16, P.maderaMed, P.madera, {
      frente: (l2, fx, fy, fw, fh) => {
        l2.rect(fx + 2, fy + 2, fw - 4, fh - 4, P.maderaOsc);
        lomos(l2, fx + 2, fy + 3, fw - 4, fh - 5, sem);
      },
      tapa: (l2, tx, ty, tw, th) => items.forEach((f, i) => f(l2, tx + tw / 2, ty + Math.round(((i + 0.85) * th) / items.length))),
    });
}

function jardinera(tipos: TipoPlanta[], vertical: boolean): Dibujo {
  return (l, x, y, w, h) =>
    caja(l, x + 1, y + 2, w - 2, h - 2, 8, P.maderaOsc, P.madera, {
      frente: (l2, fx, fy, fw, fh) => {
        for (let i = 3; i < fw - 2; i += 6) l2.vline(fx + i, fy + 1, fh - 2, osc(P.madera, 0.85));
      },
      tapa: (l2, tx, ty, tw, th) => {
        l2.rect(tx + 2, ty + 2, tw - 4, th - 4, 0x5c3d2a);
        tipos.forEach((t, i) => {
          const cx = vertical ? tx + tw / 2 : tx + Math.round(((i + 0.5) * tw) / tipos.length);
          const base = vertical ? ty + Math.round(((i + 0.9) * th) / tipos.length) : ty + th - 3;
          planta(l2, cx, base, t, 8, P.terracota, [P.rosa, P.mostazaClara, P.lilaClara][i % 3]);
        });
      },
    });
}

function plantasRincon(grande: TipoPlanta, chica: TipoPlanta): Dibujo {
  return (l, x, y, w, h) => {
    planta(l, x + w - 12, y + 18, chica, 11, P.crema);
    planta(l, x + w / 2 - 2, y + h - 4, grande, 19, grande === "ficus" ? P.cremaClara : P.maderaClara);
  };
}

function mesita(cosas: (l: Lienzo, cx: number, base: number) => void): Dibujo {
  return (l, x, y, w, h) => {
    const cx = x + w / 2;
    const base = y + h - 6;
    cilindro(l, cx, base, 9, 4, 13, P.maderaMed, P.maderaClara);
    cosas(l, cx, base - 13);
  };
}

function pufs(a: Color, b: Color): Dibujo {
  return (l, x, y, w, h) => {
    const cx = x + w / 2;
    for (const [base, c] of [[y + h * 0.45, a], [y + h - 4, b]] as [number, Color][]) {
      cilindro(l, cx, base, 9.5, 4, 9, c, clara(c, 0.1));
      for (let i = -7; i <= 7; i += 3) l.vline(cx + i, base - 8, 8, osc(c, 0.88));
      l.px(cx, base - 9, osc(c, 0.7));
    }
  };
}

function banca(cojines: Color[]): Dibujo {
  return (l, x, y, w, h) =>
    caja(l, x + 1, y + 4, w - 2, h - 6, 8, P.maderaMed, P.madera, {
      patas: true,
      tapa: (l2, tx, ty, tw, th) => {
        const cw = Math.floor((tw - 4) / cojines.length);
        cojines.forEach((c, i) => {
          l2.rect(tx + 2 + i * cw, ty - 2, cw - 2, th, c);
          l2.hline(tx + 2 + i * cw, ty - 2, cw - 2, clara(c, 0.4));
          l2.px(tx + 2 + i * cw + cw / 2 - 1, ty + th / 2 - 1, osc(c, 0.7));
        });
      },
    });
}

function estanteBajo(items: ((l: Lienzo, cx: number, base: number) => void)[], sem: number): Dibujo {
  return (l, x, y, w, h) =>
    caja(l, x + 1, y + 2, w - 2, h - 2, 12, P.maderaMed, P.madera, {
      frente: (l2, fx, fy, fw, fh) => {
        l2.rect(fx + 2, fy + 2, fw - 4, fh - 4, P.maderaOsc);
        lomos(l2, fx + 2, fy + 3, fw - 4, fh - 5, sem);
      },
      tapa: (l2, tx, ty, tw, th) => items.forEach((f, i) => f(l2, tx + tw / 2, ty + Math.round(((i + 0.85) * th) / items.length))),
    });
}

// ---------- el catálogo del living (uno por bloque, en el mismo orden) ----------

const L_INDIVIDUAL: Dibujo[] = [
  // 0 · plantas del rincón
  plantasRincon("monstera", "sansevieria"),
  // 1 · sofá mostaza con los rasguños de Tomasito
  sofa(P.mostaza, P.mostazaOsc, [P.crema, P.azulClaro], true),
  // 2 · estante alto con libros
  estanteAlto(
    [
      (l, cx, b) => libros(l, cx, b, [P.azul, P.mostaza, P.terracota]),
      (l, cx, b) => planta(l, cx, b, "colgante", 8, P.crema),
      (l, cx, b) => marco(l, cx, b, P.maderaClara),
      (l, cx, b) => vela(l, cx, b),
    ],
    2,
  ),
  // 3 · aparador con tocadiscos
  (l, x, y, w, h) =>
    caja(l, x, y + 8, w, h - 8, 16, P.maderaMed, P.madera, {
      frente: (l2, fx, fy, fw, fh) => {
        const n = 4;
        const dw = Math.floor((fw - 4) / n);
        for (let i = 0; i < n; i++) {
          l2.marco(fx + 2 + i * dw, fy + 2, dw - 1, fh - 5, osc(P.madera, 0.8));
          l2.px(fx + 2 + i * dw + (i % 2 ? 2 : dw - 4), fy + fh / 2, P.mostazaClara);
        }
        l2.rect(fx + 3, fy + fh - 1, 3, 3, P.maderaOsc);
        l2.rect(fx + fw - 6, fy + fh - 1, 3, 3, P.maderaOsc);
      },
      tapa: (l2, tx, ty, tw, th) => {
        const b = ty + th - 4;
        lampara(l2, tx + 10, b);
        florero(l2, tx + 26, b, P.azulClaro);
        tocadiscos(l2, tx + 38, ty + 4);
        marco(l2, tx + 66, b, P.maderaOsc, P.rosaClara);
        libros(l2, tx + 84, b, [P.salvia, P.rosa]);
        planta(l2, tx + tw - 10, b, "colgante", 9, P.cremaClara);
      },
    }),
  // 4 · estante alto con plantas y cosas
  estanteAlto(
    [
      (l, cx, b) => planta(l, cx, b, "cactus", 7, P.terracotaClara),
      (l, cx, b) => ovillo(l, cx, b, P.lila),
      (l, cx, b) => planta(l, cx, b, "suculenta", 8, P.azulClaro),
      (l, cx, b) => libros(l, cx, b, [P.mostaza, P.azul]),
    ],
    4,
  ),
  // 5 · mesa con puzzle a medio armar, té y galletas
  (l, x, y, w, h) =>
    caja(l, x + 2, y + 6, w - 4, h - 8, 11, P.maderaClara, P.maderaMed, {
      patas: true,
      tapa: (l2, tx, ty, tw, th) => {
        for (let i = 0; i < 9; i++)
          for (let j = 0; j < 5; j++) {
            if (hash(i, j) < 0.2) continue;
            const c = j < 2 ? (hash(j, i) < 0.5 ? P.cielo : P.azulClaro) : j < 3 ? P.mostazaClara : P.hojaClara;
            l2.rect(tx + 4 + i * 4, ty + 4 + j * 4, 4, 4, c);
            l2.px(tx + 4 + i * 4, ty + 4 + j * 4, osc(c, 0.85));
          }
        l2.rect(tx + 44, ty + 18, 3, 3, P.azulClaro);
        tetera(l2, tx + tw - 14, ty + 14, P.terracotaClara);
        taza(l2, tx + tw - 26, ty + th - 3, P.cremaClara);
        l2.ovalo(tx + tw - 10, ty + th - 5, 5, 2, P.cremaClara);
        l2.px(tx + tw - 12, ty + th - 6, P.maderaMed);
        l2.px(tx + tw - 8, ty + th - 5, P.maderaMed);
      },
    }),
  // 6 · escritorio con máquina de escribir
  (l, x, y, w, h) =>
    caja(l, x + 2, y + 6, w - 4, h - 8, 16, P.maderaMed, P.madera, {
      frente: (l2, fx, fy, fw, fh) => {
        for (const dx of [2, fw / 2 + 1]) {
          l2.marco(fx + dx, fy + 3, fw / 2 - 3, fh - 6, osc(P.madera, 0.8));
          l2.hline(fx + dx + 5, fy + fh / 2, 6, P.mostazaClara);
        }
      },
      tapa: (l2, tx, ty, tw, th) => {
        lampara(l2, tx + 6, ty + th - 5, P.cremaOsc);
        l2.rect(tx + 14, ty + 7, 16, 9, P.salvia);
        l2.hline(tx + 14, ty + 7, 16, P.salviaClara);
        for (let i = 0; i < 6; i++) l2.px(tx + 16 + i * 2, ty + 12, P.cremaClara);
        l2.rect(tx + 16, ty + 2, 12, 5, P.cremaClara);
        taza(l2, tx + tw - 8, ty + th - 4, P.azulClaro, true);
      },
    }),
  // 7 · estufa a leña con fuego
  (l, x, y, w, h) => {
    l.rect(x + 2, y + h - 12, w - 4, 11, P.terracota);
    for (let i = 0; i < w - 4; i += 6) l.vline(x + 2 + i, y + h - 12, 11, P.terracotaOsc);
    l.hline(x + 2, y + h - 7, w - 4, P.terracotaOsc);
    l.rect(x + w - 16, y - 16, 5, 26, P.grisOsc);
    l.vline(x + w - 16, y - 16, 26, P.gris);
    l.rect(x + w - 17, y - 18, 7, 3, P.grisOsc);
    caja(l, x + 8, y + 12, w - 16, h - 16, 20, 0x3a3533, 0x2a2624, {
      frente: (l2, fx, fy, fw, fh) => {
        l2.rect(fx + 4, fy + 4, fw - 8, fh - 8, P.fuego);
        l2.rect(fx + 5, fy + fh - 9, fw - 10, 4, P.fuegoClaro);
        for (let i = 0; i < fw - 10; i += 3) l2.px(fx + 5 + i, fy + fh - 10 - (i % 2) * 2, P.fuegoClaro);
        l2.marco(fx + 3, fy + 3, fw - 6, fh - 6, P.grisOsc);
      },
      tapa: (l2, tx, ty) => tetera(l2, tx + 9, ty + 12, P.salvia),
    });
  },
  // 8 · leñera con un ratón de juguete
  (l, x, y, w, h) => {
    caja(l, x + 2, y + 5, w - 12, h - 6, 10, P.maderaClara, P.madera, {
      frente: (l2, fx, fy, fw, fh) => {
        for (let i = 0; i < fw - 4; i += 6) {
          l2.ovalo(fx + 3 + i, fy + fh / 2, 2.5, 2.5, P.maderaClara);
          l2.px(fx + 3 + i, fy + fh / 2, P.maderaMed);
        }
      },
    });
    l.ovalo(x + w - 5, y + h - 4, 3, 2, P.gris);
    l.px(x + w - 3, y + h - 6, P.rosa);
    l.linea(x + w - 8, y + h - 4, x + w - 10, y + h - 1, P.rosa);
  },
  // 9 · jardinera vertical
  jardinera(["helecho", "suculenta", "sansevieria", "flores"], true),
  // 10 · consola con velas y fotos
  (l, x, y, w, h) =>
    caja(l, x + 2, y + 4, w - 4, h - 6, 10, P.maderaOsc, P.madera, {
      patas: true,
      tapa: (l2, tx, ty, tw, th) => {
        const b = ty + th - 2;
        vela(l2, tx + 8, b);
        marco(l2, tx + 22, b, P.mostaza, P.cielo);
        florero(l2, tx + 40, b, P.terracotaClara);
        marco(l2, tx + 54, b, P.maderaClara, P.hojaClara);
        vela(l2, tx + tw - 6, b);
      },
    }),
  // 11 · mesita con lámpara
  mesita((l, cx, b) => lampara(l, cx, b + 2)),
  // 12 · el castillo de Tomasito
  (l, x, y, w, h) => {
    caja(l, x, y, w, h, 4, P.cremaOsc, P.papelOsc, {
      tapa: (l2, tx, ty, tw, th) => {
        for (let j = 1; j < th; j += 3) for (let i = (j % 2) * 2; i < tw; i += 4) l2.px(tx + i, ty + j, clara(P.cremaOsc, 0.2));
      },
    });
    const b = (yy: number) => y + yy - 4;
    // Cubo con agujero
    caja(l, x + w - 58, b(12), 44, 44, 30, P.maderaClara, P.maderaMed, {
      frente: (l2, fx, fy, fw, fh) => {
        l2.ovalo(fx + fw / 2, fy + fh / 2 + 1, 7, 7, P.tinta);
        l2.ovalo(fx + fw / 2 + 2, fy + fh / 2 + 3, 1.5, 1, P.gris);
      },
      tapa: (l2, tx, ty, tw, th) => {
        l2.ovalo(tx + tw / 2, ty + th / 2, 13, 11, P.crema);
        l2.ovalo(tx + tw / 2, ty + th / 2, 9, 7, P.cremaClara);
      },
    });
    const poste = (cx: number, base: number, alto: number, radio: number) => {
      cilindro(l, cx, base, 4, 2, alto, P.maderaClara, P.maderaClara);
      for (let j = 2; j < alto; j += 3) l.hline(cx - 4, base - j, 9, P.maderaMed);
      cilindro(l, cx, base - alto, radio, radio * 0.45, 4, P.maderaMed, P.crema);
      l.ovalo(cx, base - alto - 4, radio * 0.6, radio * 0.25, P.cremaClara);
    };
    poste(x + 76, b(30), 40, 12);
    l.linea(x + 86, b(30) - 44, x + 88, b(30) - 30, P.tinta);
    l.ovalo(x + 88, b(30) - 28, 2.5, 2.5, P.terracotaClara);
    poste(x + 28, b(44), 26, 14);
    l.px(x + 24, b(44) - 31, P.gris);
    l.px(x + 31, b(44) - 30, P.gris);
    // Hamaca entre los postes
    for (let i = 0; i < 40; i++) {
      const yy = b(50) - 20 + Math.round(Math.sin((i / 40) * Math.PI) * 7);
      l.vline(x + 36 + i, yy, 4, i % 4 < 2 ? P.azulClaro : P.cremaClara);
    }
    poste(x + 52, b(66), 16, 11);
    // Letrero con su nombre
    caja(l, x + w / 2 - 14, b(h - 8), 44, 8, 13, P.maderaMed, P.madera, {
      frente: (l2, fx, fy, fw) => escribir(l2, "TOMASITO", fx + fw / 2, fy + 3, P.cremaClara),
    });
    l.ovalo(x + w - 8, b(h - 4), 3, 3, P.salvia);
  },
  // 13 · banca con cojines
  banca([P.azulClaro, P.mostazaClara, P.terracotaClara]),
  // 14 · pufs
  pufs(P.salvia, P.terracotaClara),
  // 15 · estante bajo
  estanteBajo(
    [
      (l, cx, b) => libros(l, cx, b, [P.terracota, P.azul, P.mostaza]),
      (l, cx, b) => vela(l, cx, b),
      (l, cx, b) => planta(l, cx, b, "suculenta", 7, P.rosaClara),
      (l, cx, b) => libros(l, cx, b, [P.salvia, P.lila]),
    ],
    15,
  ),
  // 16 · sillón de lectura con lámpara de pie
  (l, x, y, w, h) => {
    const sw = 34;
    caja(l, x + 2, y + 4, sw, 10, 16, P.terracotaOsc, osc(P.terracotaOsc));
    caja(l, x + 4, y + 12, sw - 4, h - 16, 9, P.terracota, osc(P.terracota), {
      tapa: (l2, tx, ty, tw, th) => {
        l2.rect(tx + 5, ty + 2, tw - 10, th - 4, P.terracotaClara);
        l2.rect(tx + 8, ty + 6, 6, 8, P.cremaClara);
        l2.rect(tx + 14, ty + 6, 6, 8, P.crema);
      },
    });
    for (const ax of [x + 2, x + sw - 3]) caja(l, ax, y + 10, 6, h - 14, 13, P.terracotaOsc, osc(P.terracotaOsc));
    // Lámpara de pie
    const lx = x + w - 7;
    l.ovalo(lx, y + h - 6, 4, 1.5, P.maderaOsc);
    l.vline(lx, y - 24, y + h - 6 - (y - 24), P.maderaOsc);
    for (let j = 0; j < 9; j++) l.hline(lx - 4 - Math.floor(j / 2), y - 32 + j, 9 + Math.floor(j / 2) * 2, j === 8 ? P.luzClara : P.crema);
  },
  // 17 · canasto de lanas con un tejido a medias
  (l, x, y, _w, h) => {
    const cx = x + 14;
    const base = y + h - 4;
    cilindro(l, cx, base, 11, 4, 10, P.maderaClara, P.maderaMed);
    for (let i = -10; i <= 10; i += 3) l.vline(cx + i, base - 9, 9, P.maderaMed);
    ovillo(l, cx - 5, base - 12, P.lila);
    ovillo(l, cx + 4, base - 11, P.salvia);
    ovillo(l, cx, base - 15, P.mostaza);
    for (let i = 0; i < 16; i++) l.vline(x + 28 + i, y + h - 12 + (i % 2), 6, i % 4 < 2 ? P.lila : P.mostazaClara);
    l.linea(x + 27, y + h - 16, x + 44, y + h - 4, P.maderaClara);
    l.linea(x + 44, y + h - 16, x + 27, y + h - 4, P.maderaClara);
  },
  // 18 · cojines de piso
  (l, x, y, _w, h) => {
    caja(l, x + 2, y + 8, 22, h - 10, 6, P.lila, osc(P.lila));
    caja(l, x + 20, y + 6, 24, h - 8, 7, P.salvia, osc(P.salvia));
    caja(l, x + 22, y + 4, 18, h - 12, 5, P.mostazaClara, osc(P.mostazaClara));
  },
  // 19 · cama de gato y rascador de cartón
  (l, x, y, w, h) => {
    const cx = x + 20;
    const base = y + h - 8;
    cilindro(l, cx, base, 18, 11, 7, P.azulClaro, P.azulClaro);
    l.ovalo(cx, base - 8, 13, 7, P.crema);
    l.ovalo(cx - 3, base - 9, 6, 3, P.cremaClara);
    l.px(cx + 5, base - 8, P.gris);
    l.px(cx + 7, base - 9, P.gris);
    caja(l, x + w - 18, y + 8, 16, 26, 4, 0xc99a62, osc(0xc99a62), {
      tapa: (l2, tx, ty, tw, th) => {
        for (let i = 1; i < tw; i += 2) l2.vline(tx + i, ty + 1, th - 2, osc(0xc99a62, 0.85));
      },
    });
    l.ovalo(x + w - 8, y + h - 5, 3, 3, P.terracotaClara);
    l.px(x + w - 9, y + h - 6, P.cremaClara);
  },
  // 20 · jardinera de suculentas
  jardinera(["suculenta", "cactus", "suculenta", "cactus"], true),
  // 21 · mesita con libros
  mesita((l, cx, b) => {
    libros(l, cx - 3, b + 2, [P.azul, P.mostaza, P.terracota]);
    planta(l, cx + 5, b + 3, "suculenta", 5, P.rosaClara);
  }),
  // 22 · cajones de vinilos
  (l, x, y, w, h) =>
    caja(l, x + 2, y + 6, w - 4, h - 8, 9, P.maderaClara, P.maderaMed, {
      frente: (l2, fx, fy, fw, fh) => l2.vline(fx + fw / 2, fy, fh, P.madera),
      tapa: (l2, tx, ty, tw, th) => {
        const cols = [P.terracota, P.azul, P.mostaza, P.salvia, P.rosa, P.negroPiano, P.lila, P.crema];
        for (let i = 0; i < tw - 4; i += 2) l2.rect(tx + 2 + i, ty - 4, 2, th + 2, cols[(i / 2) % cols.length]);
      },
    }),
  // 23 · piano de cola
  (l, x, y, w, h) => {
    const sx = x + 14;
    const sy = y + 6;
    const sw = w - 40;
    const sh = h - 12;
    const alto = 16;
    const dentro = (px: number, py: number) => {
      if (px < sx || px > sx + sw || py < sy || py > sy + sh) return false;
      if (px <= sx + sw * 0.5) return true;
      const ex = (px - (sx + sw * 0.5)) / (sw * 0.5);
      const ey = (py - (sy + sh * 0.55)) / (sh * 0.55);
      return ex * ex + ey * ey <= 1;
    };
    for (let py = sy - alto; py <= sy + sh; py++)
      for (let px = sx; px <= sx + sw; px++) {
        if (dentro(px, py + alto)) l.px(px, py, P.negroPiano);
        else for (let k = 0; k < alto; k++) if (dentro(px, py - k)) { l.px(px, py, 0x15100e); break; }
      }
    // Reflejo de la tapa y teclado
    for (let i = 0; i < sw * 0.8; i++) l.sobre(sx + 6 + i, sy - alto + 5 + Math.round(Math.sin((i / sw) * 3) * 2), P.pianoBrillo);
    l.rect(sx + 2, sy + sh - alto - 9, Math.round(sw * 0.48), 8, P.cremaClara);
    for (let i = 0; i < sw * 0.48; i += 3) l.vline(sx + 2 + i, sy + sh - alto - 9, 8, P.crema);
    for (let i = 1; i < sw * 0.48 - 2; i += 3) if (i % 21 !== 7 && i % 21 !== 19) l.rect(sx + 2 + i, sy + sh - alto - 9, 2, 5, P.negroPiano);
    l.rect(sx + 14, sy + sh - alto - 20, 18, 10, P.cremaClara);
    for (let j = 2; j < 9; j += 2) l.hline(sx + 16, sy + sh - alto - 20 + j, 14, P.cremaOsc);
    vela(l, sx + sw - 30, sy + 22 - alto);
    florero(l, sx + sw - 50, sy + 18 - alto, P.cremaClara);
    // Banqueta
    caja(l, x + w - 22, y + 24, 16, 26, 10, P.lila, P.negroPiano);
  },
  // 24 · jardinera con flores
  jardinera(["flores", "flores", "flores"], false),
  // 25 · pufs
  pufs(P.mostazaClara, P.lila),
  // 26 · estante bajo
  estanteBajo(
    [
      (l, cx, b) => vela(l, cx, b),
      (l, cx, b) => libros(l, cx, b, [P.mostaza, P.terracota, P.salvia]),
      (l, cx, b) => marco(l, cx, b, P.lila, P.cielo),
      (l, cx, b) => planta(l, cx, b, "colgante", 7, P.crema),
    ],
    26,
  ),
  // 27 · par de pufs
  (l, x, y, w, h) => {
    for (const [cx, c] of [[x + 13, P.salvia], [x + w - 13, P.terracotaClara]] as [number, Color][]) {
      cilindro(l, cx, y + h - 4, 10, 4, 10, c, clara(c, 0.1));
      for (let i = -8; i <= 8; i += 3) l.vline(cx + i, y + h - 13, 9, osc(c, 0.88));
    }
  },
  // 28 · ficus y helecho
  plantasRincon("ficus", "helecho"),
  // 29 · mueble de discos con audífonos
  (l, x, y, w, h) =>
    caja(l, x + 2, y + 6, w - 4, h - 8, 18, P.madera, P.maderaOsc, {
      frente: (l2, fx, fy, fw, fh) => lomos(l2, fx + 3, fy + 3, fw - 6, fh - 5, 29),
      tapa: (l2, tx, ty, tw) => {
        tocadiscos(l2, tx + 3, ty + 6);
        l2.linea(tx + tw - 14, ty + 10, tx + tw - 10, ty + 5, P.grisOsc);
        l2.linea(tx + tw - 10, ty + 5, tx + tw - 5, ty + 10, P.grisOsc);
        l2.ovalo(tx + tw - 14, ty + 11, 2, 2.5, P.azul);
        l2.ovalo(tx + tw - 5, ty + 11, 2, 2.5, P.azul);
      },
    }),
  // 30 · sofá verde
  sofa(P.salvia, P.salviaOsc, [P.rosaClara, P.cremaClara], false),
  // 31 · estante alto con juegos de mesa
  estanteAlto(
    [
      (l, cx, b) => {
        l.rect(cx - 7, b - 6, 14, 6, P.azul);
        l.hline(cx - 7, b - 6, 14, P.azulClaro);
        l.rect(cx - 6, b - 11, 12, 5, P.terracota);
        l.hline(cx - 6, b - 11, 12, P.terracotaClara);
      },
      (l, cx, b) => planta(l, cx, b, "suculenta", 7, P.mostazaClara),
      (l, cx, b) => vela(l, cx, b),
      (l, cx, b) => libros(l, cx, b, [P.lila, P.mostaza]),
    ],
    31,
  ),
  // 32 · banco bajo la ventana
  (l, x, y, w, h) =>
    caja(l, x, y + 6, w, h - 6, 14, P.maderaClara, P.maderaMed, {
      frente: (l2, fx, fy, fw, fh) => {
        const n = 4;
        const dw = Math.floor((fw - 4) / n);
        for (let i = 0; i < n; i++) l2.marco(fx + 2 + i * dw, fy + 2, dw - 1, fh - 4, P.madera);
      },
      tapa: (l2, tx, ty, tw, th) => {
        l2.rect(tx + 2, ty + 2, tw - 4, th - 4, P.terracotaClara);
        l2.hline(tx + 2, ty + 2, tw - 4, clara(P.terracotaClara, 0.4));
        l2.rect(tx + 10, ty - 4, 10, 9, P.cremaClara);
        l2.rect(tx + 22, ty - 4, 10, 9, P.azulClaro);
        for (let j = 0; j < 9; j += 2) l2.hline(tx + 22, ty - 4 + j, 10, P.cremaClara);
        libros(l2, tx + tw - 24, ty + th - 4, [P.mostaza, P.azul]);
        planta(l2, tx + tw - 8, ty + th - 3, "colgante", 8, P.crema);
      },
    }),
  // 33 · estante alto con plantas
  estanteAlto(
    [
      (l, cx, b) => planta(l, cx, b, "helecho", 8),
      (l, cx, b) => planta(l, cx, b, "suculenta", 7, P.rosaClara),
      (l, cx, b) => planta(l, cx, b, "flores", 7, P.terracota, P.lilaClara),
      (l, cx, b) => planta(l, cx, b, "cactus", 7, P.crema),
    ],
    33,
  ),
  // 34 · mesa redonda con té y torta
  (l, x, y, w, h) => {
    const cx = x + w / 2;
    const base = y + h - 6;
    cilindro(l, cx, base, w / 2 - 6, 12, 14, P.cremaClara, P.cremaClara);
    for (let i = -w / 2 + 8; i < w / 2 - 6; i += 6) l.vline(cx + i, base - 12, 12, P.crema);
    const ty = base - 14;
    for (let j = -10; j <= 10; j += 4) for (let i = -28; i <= 28; i += 8) l.px(cx + i + (j % 8 ? 4 : 0), ty + j * 0.9, P.rosaClara);
    tetera(l, cx - 16, ty + 2, P.azulClaro);
    cilindro(l, cx + 6, ty + 2, 8, 3, 7, P.crema, P.rosaClara);
    for (const d of [-5, 0, 5]) l.px(cx + 6 + d, ty - 6, P.rojo);
    taza(l, cx + 20, ty + 4, P.rosaClara, false);
  },
  // 35 · plantas del rincón (otra combinación)
  plantasRincon("monstera", "helecho"),
];

/**
 * Tarima baja que ocupa exactamente la huella de cada mueble. Es la señal visual de "aquí no se pasa":
 * aunque un mueble no llene todo su espacio (un piano, unas plantas), su tarima marca el borde del muro.
 */
function tarima(l: Lienzo, x: number, y: number, w: number, h: number): void {
  caja(l, x, y, w, h, 4, 0x9c6a42, P.maderaOsc, {
    tapa: (l2, tx, ty, tw, th) => {
      for (let j = 3; j < th - 1; j += 4) l2.hline(tx + 1, ty + j, tw - 2, 0x8e5f3a);
      l2.marco(tx, ty, tw, th, P.maderaMed);
    },
  });
}

/** Dibuja cada mueble del living en su propio lienzo, listo para ordenarse por profundidad. */
export function mueblesLiving(): SpriteMueble[] {
  return BLOQUES.map(([bx, by, bw, bh], i) => {
    const w = bw * T;
    const h = bh * T;
    const l = new Lienzo(w + MARGEN * 2, h + ARRIBA + ABAJO);
    tarima(l, MARGEN, ARRIBA, w, h);
    L_INDIVIDUAL[i](l, MARGEN, ARRIBA, w, h);
    l.contorno(P.tinta);
    return { lienzo: l, x: bx * T - MARGEN, y: by * T - ARRIBA, profundidad: (by + bh) * T };
  });
}

// ---------- piso y paredes ----------

export interface Retrato {
  clave: string;
  /** Rectángulo interior del marco, en coordenadas del mundo. */
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Retratos de la familia colgados en la pared (las fotos HD se ponen encima en el juego). */
export const RETRATOS: Retrato[] = [
  { clave: "tomasito", x: 11 * T + 6, y: -ALTO_PARED + 10, w: 22, h: 22 },
  { clave: "begona", x: 12 * T + 16, y: -ALTO_PARED + 6, w: 24, h: 26 },
  { clave: "eren", x: 14 * T + 2, y: -ALTO_PARED + 10, w: 22, h: 22 },
  { clave: "violeta", x: 15 * T + 6, y: -ALTO_PARED + 6, w: 24, h: 26 },
];

/**
 * Piso y paredes del living en un solo lienzo. Su esquina superior izquierda va en (0, -ALTO_PARED) del mundo.
 * Incluye la pared del fondo vista de frente, los muros laterales vistos desde arriba, el piso de tablas y las alfombras.
 */
export function pisoLiving(ancho: number, alto: number, gateraFila: number): Lienzo {
  const W = ancho * T;
  const H = alto * T + ALTO_PARED;
  const l = new Lienzo(W, H);
  const oy = ALTO_PARED; // la fila 0 de la grilla empieza aquí

  // Piso de tablas
  for (let y = oy + T; y < oy + (alto - 1) * T; y++) {
    const fila = Math.floor((y - oy - T) / 6);
    const enFila = (y - oy - T) % 6;
    for (let x = T; x < W - T; x++) {
      const desfase = (fila * 37) % 60;
      const junta = (x + desfase) % 60 === 0;
      let c: Color = fila % 2 ? P.pisoA : P.pisoB;
      if (enFila === 5 || junta) c = P.pisoLinea;
      else if (enFila === 0) c = P.pisoBrillo;
      else if (hash(x >> 3, fila) < 0.04 && enFila === 3) c = osc(c, 0.9);
      l.px(x, y, c);
    }
  }
  // Sombra que proyecta la pared del fondo
  for (let x = T; x < W - T; x++) for (let j = 0; j < 4; j++) l.tono(x, oy + T + j, -0.22 + j * 0.05);

  // Pared del fondo (vista de frente): papel mural, zócalo y moldura
  const cara = oy + T;
  for (let y = 0; y < cara; y++)
    for (let x = 0; x < W; x++) {
      let c: Color = x % 12 < 6 ? 0xe9d5ba : 0xe2caab;
      if (x % 12 === 9 && y % 12 === 6) c = P.terracotaClara;
      if (x % 12 === 3 && y % 12 === 0) c = P.salviaClara;
      l.px(x, y, c);
    }
  l.rect(0, 0, W, 4, P.maderaOsc);
  l.hline(0, 4, W, P.madera);
  const zocalo = cara - 14;
  l.rect(0, zocalo, W, 14, P.maderaMed);
  l.hline(0, zocalo, W, P.maderaClara);
  for (let x = 4; x < W; x += 30) l.marco(x, zocalo + 3, 24, 8, P.madera);
  l.rect(0, cara - 2, W, 2, P.maderaOsc);

  // Ventanas con cortinas y luz
  for (const vx of [5 * T + 8, 18 * T + 8]) {
    const vw = 4 * T - 16;
    l.rect(vx, 8, vw, zocalo - 12, P.cremaClara);
    l.rect(vx + 3, 11, vw / 2 - 5, zocalo - 18, P.cielo);
    l.rect(vx + vw / 2 + 2, 11, vw / 2 - 5, zocalo - 18, P.cielo);
    for (let i = 0; i < 10; i++) {
      l.px(vx + 8 + i, 26 - i, P.cremaClara);
      l.px(vx + vw / 2 + 10 + i, 30 - i, P.cremaClara);
    }
    l.rect(vx - 4, zocalo - 5, vw + 8, 3, P.crema);
    for (const cx of [vx - 10, vx + vw]) {
      l.rect(cx, 5, 10, zocalo - 6, P.terracota);
      for (let i = 2; i < 10; i += 3) l.vline(cx + i, 5, zocalo - 6, P.terracotaOsc);
    }
    l.rect(vx - 12, 4, vw + 24, 2, P.maderaOsc);
    // Rayos de sol sobre el piso (tramados)
    for (let y = cara; y < cara + 9 * T; y++) {
      const t = (y - cara) / (9 * T);
      const x0 = vx - t * 40;
      const x1 = vx + vw + t * 40;
      for (let x = Math.floor(x0); x < x1; x++) if ((x + y) % 2 === 0 && hash(x, y) > t) l.tono(x, y, 0.1);
    }
  }

  // Marcos de los retratos (las fotos van encima, en alta resolución)
  for (const r of RETRATOS) {
    const y = r.y + oy;
    l.rect(r.x - 3, y - 3, r.w + 6, r.h + 6, P.maderaMed);
    l.marco(r.x - 3, y - 3, r.w + 6, r.h + 6, P.madera);
    l.rect(r.x, y, r.w, r.h, P.cremaClara);
  }

  // Reloj
  l.ovalo(3 * T + 12, 20, 8, 8, P.maderaMed);
  l.ovalo(3 * T + 12, 20, 6, 6, P.cremaClara);
  l.vline(3 * T + 12, 15, 5, P.tinta);
  l.hline(3 * T + 12, 20, 4, P.tinta);

  // Repisa con cositas
  l.rect(22 * T + 4, 30, 3 * T - 8, 3, P.madera);
  libros(l, 22 * T + 14, 30, [P.azul, P.mostaza]);
  planta(l, 23 * T + 10, 30, "colgante", 6, P.crema);
  vela(l, 24 * T + 4, 30);

  // Guirnalda de luces
  for (let x = 6; x < W - 6; x++) {
    const tramo = (x % (W / 2)) / (W / 2);
    const y = 8 + Math.round(Math.sin(tramo * Math.PI) * 6);
    l.px(x, y, P.sombra);
    if (x % 16 === 0) {
      const c = [P.luz, P.rosaClara, P.cielo][Math.floor(x / 16) % 3];
      l.rect(x - 1, y + 1, 3, 3, c);
      l.px(x, y + 1, P.luzClara);
    }
  }

  // Muros laterales vistos desde arriba, con las gateras
  for (const mx of [0, W - T]) {
    l.rect(mx, cara, T, H - cara, P.maderaOsc);
    l.vline(mx === 0 ? T - 2 : mx + 1, cara, H - cara, P.madera);
    l.vline(mx === 0 ? T - 1 : mx, cara, H - cara, P.maderaClara);
    const gy = oy + gateraFila * T;
    l.rect(mx, gy, T, T, P.pisoB);
    l.rect(mx === 0 ? 0 : W - 6, gy - 2, 6, T + 4, P.tinta);
    l.rect(mx === 0 ? 1 : W - 5, gy + 2, 4, T - 4, P.madera);
  }

  // Alfombra kilim a lo largo de la fila 4
  const ky = oy + 4 * T + 4;
  for (let x = T + 6; x < W - T - 6; x++)
    for (let j = 0; j < 16; j++) {
      let c: Color = P.terracota;
      if (j === 0 || j === 15) c = P.crema;
      else if (j === 1 || j === 14) c = P.terracotaOsc;
      else {
        const dx = Math.abs(((x - T) % 16) - 8);
        const dy = Math.abs(j - 7.5);
        if (dx + dy < 5) c = P.mostaza;
        if (dx + dy < 2.5) c = P.azul;
      }
      l.px(x, ky + j, c);
    }
  for (let j = 1; j < 16; j += 2) {
    l.px(T + 4, ky + j, P.crema);
    l.px(W - T - 5, ky + j, P.crema);
  }

  // Camino de alfombra en la fila central y alfombra redonda abajo
  const cy = oy + 9 * T + 5;
  l.rect(T + 4, cy, W - 2 * T - 8, 14, P.salvia);
  l.rect(T + 6, cy + 2, W - 2 * T - 12, 10, P.salviaClara);
  for (let x = T + 8; x < W - T - 8; x += 4) l.px(x, cy + 7, P.cremaClara);
  l.ovalo(13 * T + 12, oy + 14 * T + 12, 70, 10, P.lilaClara);
  l.ovalo(13 * T + 12, oy + 14 * T + 12, 64, 7, P.lila);
  l.ovalo(13 * T + 12, oy + 14 * T + 12, 58, 5, P.lilaClara);

  // Felpudo "HOLA"
  const fy = oy + 17 * T + 6;
  l.rect(12 * T + 6, fy, 3 * T - 12, 12, P.maderaClara);
  l.marco(12 * T + 6, fy, 3 * T - 12, 12, P.maderaMed);
  escribir(l, "HOLA", 13 * T + 12, fy + 4, P.maderaOsc);

  // Luz cálida de la estufa y las lámparas (tramado)
  const luz = (lx: number, ly: number, r: number, f: number) => {
    for (let y = ly - r; y < ly + r; y++)
      for (let x = lx - r; x < lx + r; x++) {
        const d = Math.hypot(x - lx, y - ly) / r;
        if (d < 1 && hash(x, y) > d * 0.9) l.tono(x, y, f * (1 - d));
      }
  };
  luz(3 * T, oy + 7 * T, 60, 0.28);
  luz(20 * T + 18, oy + 4 * T, 44, 0.2);
  luz(7 * T + 12, oy + 8 * T, 30, 0.18);
  return l;
}

/** Muro de abajo (fila 18): va delante de todo porque está más cerca de la cámara. */
export function muroInferior(ancho: number): Lienzo {
  const W = ancho * T;
  const l = new Lienzo(W, T);
  l.rect(0, 0, W, 6, P.maderaMed);
  l.hline(0, 0, W, P.maderaClara);
  l.rect(0, 6, W, T - 6, P.madera);
  for (let x = 4; x < W; x += 30) l.marco(x, 9, 24, 11, P.maderaOsc);
  return l;
}
