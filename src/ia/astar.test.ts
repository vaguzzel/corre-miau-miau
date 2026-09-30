import { describe, expect, it } from "vitest";
import { MAPA_CASA } from "../mapa/mapas";
import { Grilla } from "../sistemas/grilla";
import { primerPasoBFS } from "./bfs";
import { casillaAdelante, primerPasoAEstrella } from "./astar";
import { HorarioModos } from "./modos";

const RODEO = `
#######
#G....#
####..#
#Q....#
#######
`;

describe("A*", () => {
  it("rodea los muros igual que BFS", () => {
    const g = new Grilla(RODEO);
    expect(primerPasoAEstrella(g, { x: 1, y: 1 }, { x: 1, y: 3 })).toBe("derecha");
  });

  it("siguiendo sus pasos llega por un camino tan corto como el de BFS", () => {
    const g = new Grilla(MAPA_CASA);
    const contar = (paso: typeof primerPasoBFS) => {
      let c = { ...g.inicioGato };
      let n = 0;
      while ((c.x !== g.inicioRaton.x || c.y !== g.inicioRaton.y) && n < 300) {
        c = g.vecino(c.x, c.y, paso(g, c, g.inicioRaton)!);
        n++;
      }
      return n;
    };
    expect(contar(primerPasoAEstrella)).toBe(contar(primerPasoBFS));
  });

  it("usa la gatera cuando es más corta", () => {
    const g = new Grilla(MAPA_CASA);
    expect(primerPasoAEstrella(g, { x: 2, y: 9 }, { x: 25, y: 9 })).toBe("izquierda");
  });

  it("apunta varias casillas delante de Quesito, sin atravesar muros", () => {
    const g = new Grilla(MAPA_CASA);
    expect(casillaAdelante(g, { x: 13, y: 14 }, "derecha", 4)).toEqual({ x: 17, y: 14 });
    expect(casillaAdelante(g, { x: 1, y: 1 }, "arriba", 4)).toEqual({ x: 1, y: 1 });
  });
});

describe("Horario de modos", () => {
  it("alterna patrullar y cazar según los tiempos y termina cazando para siempre", () => {
    const h = new HorarioModos([["patrullar", 2], ["cazar", 3], ["patrullar", 1], ["cazar", -1]]);
    expect(h.modo).toBe("patrullar");
    expect(h.actualizar(2.1)).toBe(true);
    expect(h.modo).toBe("cazar");
    h.actualizar(3);
    expect(h.modo).toBe("patrullar");
    h.actualizar(1);
    expect(h.modo).toBe("cazar");
    expect(h.actualizar(1000)).toBe(false);
    expect(h.modo).toBe("cazar");
  });
});
