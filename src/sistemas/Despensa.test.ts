import { describe, expect, it } from "vitest";
import { MAPA_CASA } from "../mapa/mapas";
import { Despensa } from "./Despensa";
import { Grilla } from "./grilla";

const PUNTOS = { queso: 10, pepino: 50, cafe: 100, caja: 0 };

describe("Despensa", () => {
  it("suma puntos según lo que come y no come dos veces lo mismo", () => {
    const g = new Grilla(MAPA_CASA);
    const d = new Despensa(g.objetos, PUNTOS);
    expect(d.comer(1, 1)).toBe("pepino");
    expect(d.comer(2, 1)).toBe("queso");
    expect(d.comer(13, 9)).toBe("cafe");
    expect(d.comer(2, 1)).toBeNull();
    expect(d.puntaje).toBe(160);
  });

  it("las cajas no se comen", () => {
    const d = new Despensa([{ casilla: { x: 6, y: 6 }, tipo: "caja" }], PUNTOS);
    expect(d.comer(6, 6)).toBeNull();
    expect(d.puntaje).toBe(0);
  });

  it("se gana al comer todo el queso y los pepinos, sin necesitar el cafecito", () => {
    const g = new Grilla(MAPA_CASA);
    const d = new Despensa(g.objetos, PUNTOS);
    for (const o of g.objetos) if (o.tipo === "queso" || o.tipo === "pepino") d.comer(o.casilla.x, o.casilla.y);
    expect(d.restantes).toBe(0);
    expect(d.ganado).toBe(true);
  });
});
