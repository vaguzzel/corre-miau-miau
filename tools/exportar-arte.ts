// Exporta el pixel art a PNG para revisarlo fuera del juego: npm run arte
import { mkdirSync } from "node:fs";
import { Lienzo } from "../src/arte/Lienzo";
import { ALTO_PARED, BLOQUES, muroInferior, mueblesLiving, pisoLiving, T } from "../src/arte/living";
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

// 2) El living completo, tal como se verá con "mapa completo".
const g = new Grilla(MAPA_CASA);
const living = pisoLiving(g.ancho, g.alto, g.gateras[0].y);
const oy = ALTO_PARED;
for (const o of g.objetos) {
  const spr = o.tipo === "queso" ? dibujarQueso() : o.tipo === "pepino" ? dibujarPepino() : o.tipo === "cafe" ? dibujarCafe() : dibujarCaja();
  living.pegar(spr, o.casilla.x * T + 12 - Math.floor(spr.ancho / 2), oy + o.casilla.y * T + 16 - spr.alto);
}
const muebles = mueblesLiving().sort((a, b) => a.profundidad - b.profundidad);
for (const m of muebles) living.pegar(m.lienzo, m.x, m.y + oy);
living.pegar(dibujarQuesito("frente"), g.inicioRaton.x * T + 1, oy + g.inicioRaton.y * T - 4);
living.pegar(muroInferior(g.ancho), 0, oy + (g.alto - 1) * T);
guardarPNG(living, `${SALIDA}/living.png`, 2);

// 3) Un recorte ampliado, como se ve con la cámara del juego (zoom x3).
const recorte = new Lienzo(16 * T, 9 * T);
recorte.pegar(living, -1 * T, -(oy + 0));
guardarPNG(recorte, `${SALIDA}/living-camara.png`, 3);

console.log(`Listo: ${BLOQUES.length} muebles exportados en ${SALIDA}/`);
