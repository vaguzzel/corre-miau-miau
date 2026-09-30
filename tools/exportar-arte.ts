// Exporta el pixel art a PNG para revisarlo fuera del juego: npm run arte
import { mkdirSync } from "node:fs";
import { Lienzo } from "../src/arte/Lienzo";
import { dibujarCafe, dibujarCaja, dibujarPepino, dibujarQueso, dibujarQuesito } from "../src/arte/personajes";
import { guardarPNG } from "./png";

const SALIDA = "tools/salida";
mkdirSync(SALIDA, { recursive: true });

// Hoja con Quesito y los objetos, con fondo de piso para ver el contorno.
const piezas = [dibujarQuesito("frente"), dibujarQuesito("frente", 1), dibujarQuesito("lado"), dibujarQuesito("lado", 1), dibujarQuesito("espalda"), dibujarQueso(), dibujarPepino(), dibujarCafe(), dibujarCaja()];
const hoja = new Lienzo(piezas.reduce((a, p) => a + p.ancho + 4, 4), 30);
hoja.rect(0, 0, hoja.ancho, hoja.alto, 0xd6a26b);
let x = 4;
for (const p of piezas) {
  hoja.pegar(p, x, 26 - p.alto);
  x += p.ancho + 4;
}
guardarPNG(hoja, `${SALIDA}/personajes.png`, 6);
console.log("Listo: tools/salida/personajes.png");
