// Genera los íconos de la app (favicon y PWA) a partir del pixel art de Quesito: npm run iconos
import { mkdirSync } from "node:fs";
import { Lienzo } from "../src/arte/Lienzo";
import { P } from "../src/arte/paleta";
import { dibujarQueso, dibujarQuesito } from "../src/arte/personajes";
import { guardarPNG } from "./png";

const SALIDA = "public/iconos";
mkdirSync(SALIDA, { recursive: true });

/** Ícono de 32×32: Quesito sobre un cuadrado redondeado, con un trocito de queso. */
function icono(margen: number): Lienzo {
  const l = new Lienzo(32, 32);
  const r = 6 - margen / 2;
  for (let y = margen; y < 32 - margen; y++)
    for (let x = margen; x < 32 - margen; x++) {
      const dx = Math.max(0, Math.max(margen + r - x, x - (31 - margen - r)));
      const dy = Math.max(0, Math.max(margen + r - y, y - (31 - margen - r)));
      if (dx * dx + dy * dy <= r * r) l.px(x, y, y < 16 ? P.mostazaClara : P.mostaza);
    }
  l.pegar(dibujarQuesito("frente"), 5, 6);
  l.pegar(dibujarQueso(), 20, 21);
  return l;
}

guardarPNG(icono(0), `${SALIDA}/favicon.png`, 2);
guardarPNG(icono(0), `${SALIDA}/icono-192.png`, 6);
guardarPNG(icono(0), `${SALIDA}/icono-512.png`, 16);
guardarPNG(icono(0), `${SALIDA}/apple-touch-icon.png`, 6);
// Versión "maskable": con más margen, para que Android pueda recortarla en círculo
const enmascarable = new Lienzo(40, 40);
enmascarable.rect(0, 0, 40, 40, P.mostaza);
enmascarable.pegar(icono(0), 4, 4);
guardarPNG(enmascarable, `${SALIDA}/icono-maskable-512.png`, 13);
console.log(`Listo: íconos en ${SALIDA}/`);
