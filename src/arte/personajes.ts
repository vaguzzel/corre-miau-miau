import { Lienzo } from "./Lienzo";
import { P } from "./paleta";
import { cilindro, clara, osc } from "./primitivas";

export type VistaQuesito = "frente" | "espalda" | "lado";

/** Quesito, el ratón protagonista (22×22 px). "lado" mira a la derecha; para la izquierda se voltea. */
export function dibujarQuesito(vista: VistaQuesito, paso = 0): Lienzo {
  const l = new Lienzo(22, 22);
  const cuerpo = P.grisClaro;
  const oreja = P.gris;
  const pie = paso ? 1 : 0;

  if (vista === "lado") {
    // Cola rosada que sale hacia atrás
    l.linea(5, 16, 2, 14, P.rosa);
    l.linea(2, 14, 1, 10, P.rosa);
    l.px(2, 9, P.rosa);
    // Patitas
    l.rect(6 + pie, 19, 2, 2, oreja);
    l.rect(11 - pie, 19, 2, 2, oreja);
    // Cuerpo y guatita
    l.ovalo(9, 15, 5.5, 4.5, cuerpo);
    l.ovalo(10, 17, 3.5, 2, P.crema);
    // Cabeza
    l.ovalo(15, 10, 5, 4.5, cuerpo);
    l.ovalo(12.5, 13, 2, 1.5, cuerpo);
    // Oreja grande
    l.ovalo(12, 5, 3.5, 3.5, oreja);
    l.ovalo(12, 5, 2, 2, P.rosaClara);
    // Pañuelo amarillo
    l.rect(10, 12, 3, 5, P.queso);
    l.px(11, 14, P.quesoOsc);
    l.px(10, 16, P.quesoOsc);
    // Cara
    l.rect(16, 8, 2, 2, P.tinta);
    l.px(16, 8, P.blanco);
    l.px(20, 11, P.rosa);
    l.px(19, 11, P.rosa);
    l.px(17, 12, P.rosaClara);
    l.linea(18, 12, 21, 13, P.gris);
    l.linea(18, 11, 21, 10, P.gris);
    l.px(14, 7, clara(cuerpo, 0.5));
  } else {
    const frente = vista === "frente";
    // Orejas
    for (const ox of [5, 16]) {
      l.ovalo(ox, 5, 3.5, 3.5, oreja);
      if (frente) l.ovalo(ox, 5, 2, 2, P.rosaClara);
    }
    // Patitas
    l.rect(7, 19 - pie, 2, 2, oreja);
    l.rect(13, 19 - (1 - pie), 2, 2, oreja);
    // Cuerpo
    l.ovalo(11, 16, 5.5, 3.5, cuerpo);
    if (frente) l.ovalo(11, 17, 3, 2, P.crema);
    else {
      l.linea(11, 19, 14, 21, P.rosa);
      l.px(15, 21, P.rosa);
    }
    // Cabeza
    l.ovalo(11, 9, 6.5, 5.5, cuerpo);
    l.px(8, 5, clara(cuerpo, 0.5));
    l.px(9, 5, clara(cuerpo, 0.5));
    // Pañuelo
    l.rect(6, 13, 11, 2, P.queso);
    if (frente) {
      l.hline(9, 15, 5, P.queso);
      l.hline(10, 16, 3, P.queso);
      l.px(11, 17, P.queso);
      l.px(8, 13, P.quesoOsc);
      l.px(12, 14, P.quesoOsc);
      l.px(14, 13, P.quesoOsc);
      // Cara
      l.rect(8, 8, 2, 2, P.tinta);
      l.rect(13, 8, 2, 2, P.tinta);
      l.px(8, 8, P.blanco);
      l.px(13, 8, P.blanco);
      l.px(7, 11, P.rosaClara);
      l.px(15, 11, P.rosaClara);
      l.rect(11, 10, 1, 2, P.rosa);
      l.px(10, 12, P.gris);
      l.px(12, 12, P.gris);
      l.linea(4, 10, 8, 11, P.gris);
      l.linea(18, 10, 14, 11, P.gris);
    } else {
      l.ovalo(11, 8, 3, 2, osc(cuerpo, 0.92));
      l.rect(10, 13, 3, 3, P.quesoOsc);
    }
  }
  l.contorno(P.tinta);
  return l;
}

/** Trocito de queso (cuña) */
export function dibujarQueso(): Lienzo {
  const l = new Lienzo(12, 10);
  for (let j = 0; j < 6; j++) l.hline(10 - Math.floor(j * 1.7), 1 + j, Math.floor(j * 1.7) + 1, P.queso);
  l.rect(1, 7, 10, 2, P.quesoOsc);
  l.px(7, 5, P.quesoOsc);
  l.px(9, 3, P.quesoOsc);
  l.px(4, 8, osc(P.quesoOsc));
  l.hline(9, 1, 2, P.cremaClara);
  l.contorno(P.tinta);
  return l;
}

/** Rodaja de pepino (power-up) */
export function dibujarPepino(): Lienzo {
  const l = new Lienzo(16, 12);
  l.ovalo(8, 7, 6.5, 3.5, P.hojaOsc);
  l.ovalo(8, 5.5, 6.5, 3.5, P.hoja);
  l.ovalo(8, 5.5, 5, 2.5, P.hojaClara);
  l.ovalo(8, 5.5, 3.5, 1.5, P.cremaClara);
  for (const [x, y] of [[6, 5], [8, 4], [10, 5], [8, 6], [6, 6], [10, 6]]) l.px(x, y, P.hojaClara);
  l.contorno(P.tinta);
  return l;
}

/** Cafecito (turbo) */
export function dibujarCafe(): Lienzo {
  const l = new Lienzo(16, 16);
  l.ovalo(8, 13, 7, 2, P.cremaClara);
  l.hline(3, 14, 10, P.crema);
  cilindro(l, 8, 12, 4, 1.5, 6, P.terracotaClara, P.maderaOsc);
  l.rect(12, 7, 2, 1, P.terracotaClara);
  l.rect(13, 8, 1, 2, P.terracotaClara);
  l.contorno(P.tinta);
  // Vapor (sin contorno)
  l.px(7, 3, P.cremaClara);
  l.px(8, 2, P.cremaClara);
  l.px(7, 1, P.cremaClara);
  l.px(10, 3, P.cremaClara);
  l.px(9, 1, P.cremaClara);
  return l;
}

/** Caja de cartón (escondite), abierta arriba */
export function dibujarCaja(): Lienzo {
  const l = new Lienzo(22, 22);
  const carton = 0xc99a62;
  // Cara frontal
  l.rect(3, 11, 16, 9, carton);
  l.hline(3, 19, 16, osc(carton, 0.75));
  l.vline(18, 11, 9, osc(carton, 0.85));
  l.rect(3, 14, 16, 2, 0xe8d7b0);
  // Boca abierta
  l.rect(3, 6, 16, 5, osc(carton, 0.55));
  l.rect(4, 7, 14, 3, osc(carton, 0.45));
  // Solapas
  for (let j = 0; j < 4; j++) {
    l.hline(3 - j, 6 - j, 5, clara(carton, 0.15));
    l.hline(15 + j, 6 - j, 5, clara(carton, 0.15));
  }
  l.contorno(P.tinta);
  return l;
}
