import { describe, expect, it } from "vitest";
import { MAPA_CASA } from "../mapa/mapas";
import { Grilla } from "../sistemas/grilla";
import { primerPasoBFS } from "./bfs";

// Para ir de G (1,1) a Q (1,3) hay que rodear el muro por la derecha.
const RODEO = `
#######
#G....#
####..#
#Q....#
#######
`;

describe("BFS", () => {
  it("rodea los muros en vez de chocar contra ellos", () => {
    const g = new Grilla(RODEO);
    expect(primerPasoBFS(g, { x: 1, y: 1 }, { x: 1, y: 3 })).toBe("derecha");
  });

  it("devuelve null si ya llegó", () => {
    const g = new Grilla(RODEO);
    expect(primerPasoBFS(g, { x: 1, y: 3 }, { x: 1, y: 3 })).toBeNull();
  });

  it("usa la gatera cuando es el camino más corto", () => {
    const g = new Grilla(MAPA_CASA);
    // De (2,9) a (25,9): por la gatera izquierda son 4 pasos; por el pasillo, 23.
    expect(primerPasoBFS(g, { x: 2, y: 9 }, { x: 25, y: 9 })).toBe("izquierda");
  });

  it("siguiendo sus pasos, siempre llega a Quesito en el mapa de la casa", () => {
    const g = new Grilla(MAPA_CASA);
    let c = { ...g.inicioGato };
    const meta = g.inicioRaton;
    for (let i = 0; i < 200 && (c.x !== meta.x || c.y !== meta.y); i++) {
      const d = primerPasoBFS(g, c, meta)!;
      c = g.vecino(c.x, c.y, d);
    }
    expect(c).toEqual(meta);
  });
});
