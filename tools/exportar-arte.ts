// Exporta el pixel art a PNG para revisarlo fuera del juego: npm run arte
import { mkdirSync } from "node:fs";
import { COCINA } from "../src/arte/cocina";
import { ALTO_PARED, T, type Habitacion } from "../src/arte/habitacion";
import { Lienzo } from "../src/arte/Lienzo";
import { crearJardin } from "../src/arte/jardin";
import { LIVING } from "../src/arte/living";
import { dibujarCorazon, mapaVioleta, RINCON } from "../src/arte/rincon";
import { dibujarCafe, dibujarCaja, dibujarPepino, dibujarQueso, dibujarQuesito } from "../src/arte/personajes";
import { MAPA_CASA } from "../src/mapa/mapas";
import { Grilla } from "../src/sistemas/grilla";
import { guardarPNG } from "./png";

const SALIDA = "tools/salida";
mkdirSync(SALIDA, { recursive: true });

// 1) Hoja con Quesito y los objetos, con fondo de piso para ver el contorno.
const piezas = [dibujarQuesito("frente"), dibujarQuesito("frente", 1), dibujarQuesito("lado"), dibujarQuesito("lado", 1), dibujarQuesito("espalda"), dibujarQueso(), dibujarPepino(), dibujarCafe(), dibujarCaja()];
const hoja = new Lienzo(piezas.reduce((a, p) => a + p.ancho + 4, 4), 30);
hoja.rect(0, 0, hoja.ancho, hoja.alto, 0xd6a26b);
let x = 4;
for (const p of piezas) {
  hoja.pegar(p, x, 26 - p.alto);
  x += p.ancho + 4;
}
guardarPNG(hoja, `${SALIDA}/personajes.png`, 6);

/** Dibuja una habitación completa, tal como se ve con "mapa completo". */
export function componer(h: Habitacion, conObjetos = true): Lienzo {
  const g = new Grilla(MAPA_CASA);
  const l = h.piso(g.ancho, g.alto, g.gateras[0].y);
  const oy = ALTO_PARED;
  if (conObjetos)
    for (const o of g.objetos) {
      const spr = o.tipo === "queso" ? dibujarQueso() : o.tipo === "pepino" ? dibujarPepino() : o.tipo === "cafe" ? dibujarCafe() : dibujarCaja();
      l.pegar(spr, o.casilla.x * T + 12 - Math.floor(spr.ancho / 2), oy + o.casilla.y * T + 16 - spr.alto);
    }
  for (const m of h.muebles().sort((a, b) => a.profundidad - b.profundidad)) l.pegar(m.lienzo, m.x, m.y + oy);
  l.pegar(dibujarQuesito("frente"), g.inicioRaton.x * T + 1, oy + g.inicioRaton.y * T - 4);
  l.pegar(h.muroInferior(g.ancho), 0, oy + (g.alto - 1) * T);
  return l;
}

const grilla = new Grilla(MAPA_CASA);
for (const [nombre, h] of [["living", LIVING], ["cocina", COCINA], ["jardin", crearJardin((x, y) => grilla.esMuro(x, y))]] as [string, Habitacion][]) {
  const l = componer(h);
  guardarPNG(l, `${SALIDA}/${nombre}.png`, 2);
  const recorte = new Lienzo(16 * T, 9 * T);
  recorte.pegar(l, -1 * T, -ALTO_PARED);
  guardarPNG(recorte, `${SALIDA}/${nombre}-camara.png`, 3);
}
// El rincón de Violeta tiene su propio mapa
{
  const gv = new Grilla(mapaVioleta());
  const l = RINCON.piso(gv.ancho, gv.alto, 0);
  for (const o of gv.objetos) if (o.tipo === "corazon") l.pegar(dibujarCorazon(), o.casilla.x * T + 7, ALTO_PARED + o.casilla.y * T + 6);
  for (const m of RINCON.muebles().sort((a, b) => a.profundidad - b.profundidad)) l.pegar(m.lienzo, m.x, m.y + ALTO_PARED);
  l.pegar(dibujarQuesito("espalda"), gv.inicioRaton.x * T + 1, ALTO_PARED + gv.inicioRaton.y * T - 4);
  l.pegar(RINCON.muroInferior(gv.ancho), 0, ALTO_PARED + (gv.alto - 1) * T);
  guardarPNG(l, `${SALIDA}/rincon.png`, 2);
}

console.log(`Listo: arte exportado en ${SALIDA}/`);
