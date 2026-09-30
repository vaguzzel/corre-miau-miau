import { describe, expect, it } from "vitest";
import { MAPA_CASA } from "../mapa/mapas";
import { Grilla } from "../sistemas/grilla";
import { BLOQUES, mueblesLiving } from "./living";

describe("Muebles del living", () => {
  it("cubren exactamente los muros interiores del mapa, sin tapar pasillos", () => {
    const g = new Grilla(MAPA_CASA);
    const cubiertas = new Set<string>();
    for (const [bx, by, bw, bh] of BLOQUES)
      for (let y = by; y < by + bh; y++)
        for (let x = bx; x < bx + bw; x++) {
          expect(g.esMuro(x, y), `el mueble en (${x},${y}) tapa un pasillo`).toBe(true);
          cubiertas.add(`${x},${y}`);
        }
    for (let y = 1; y < g.alto - 1; y++)
      for (let x = 1; x < g.ancho - 1; x++) if (g.esMuro(x, y)) expect(cubiertas.has(`${x},${y}`), `al muro (${x},${y}) le falta mueble`).toBe(true);
  });

  it("dibuja un sprite por bloque, con la profundidad en su base", () => {
    const m = mueblesLiving();
    expect(m).toHaveLength(BLOQUES.length);
    m.forEach((s, i) => expect(s.profundidad).toBe((BLOQUES[i][1] + BLOQUES[i][3]) * 24));
  });
});
