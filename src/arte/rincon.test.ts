import { describe, expect, it } from "vitest";
import { Grilla } from "../sistemas/grilla";
import { mapaDistancias } from "../ia/bfs";
import { mapaVioleta, RINCON } from "./rincon";

describe("Rincón de Violeta", () => {
  const g = new Grilla(mapaVioleta());

  it("tiene 12 corazones, a Violeta y a Quesito", () => {
    expect(g.objetos.filter((o) => o.tipo === "corazon")).toHaveLength(12);
    expect(g.violeta).toEqual({ x: 9, y: 9 });
    expect(g.inicioRaton).toEqual({ x: 9, y: 11 });
  });

  it("se puede llegar a todos los corazones y a Violeta", () => {
    const dist = mapaDistancias(g, g.inicioRaton);
    for (const o of g.objetos.filter((o) => o.tipo === "corazon")) expect(dist[o.casilla.y * g.ancho + o.casilla.x]).toBeGreaterThan(0);
    expect(dist[g.violeta!.y * g.ancho + g.violeta!.x]).toBeGreaterThan(0);
  });

  it("dibuja un mueble por bloque", () => {
    expect(RINCON.muebles().length).toBe(13);
  });
});
