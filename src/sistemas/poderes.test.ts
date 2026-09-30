import { describe, expect, it } from "vitest";
import { mapaDistancias } from "../ia/bfs";
import { elegirHuida } from "../ia/huir";
import { MAPA_CASA } from "../mapa/mapas";
import { Escondites } from "./Escondites";
import { Grilla } from "./grilla";
import { MovedorGrilla } from "./MovedorGrilla";

// Cruce en (3,2) con Quesito a la izquierda en (1,2).
const CRUCE = `
#######
###.###
#Q.G..#
###.###
#######
`;

// El gato en (3,2) viene bajando; Quesito está abajo a la izquierda en (2,3).
const HUIDA = `
#######
###.###
#..G..#
##Q####
#######
`;

describe("Gato asustado (huir)", () => {
  it("elige el camino que lo aleja más de Quesito", () => {
    const g = new Grilla(HUIDA);
    // Izquierda lo deja a 1 paso de Quesito; derecha, a 3.
    expect(elegirHuida(g, { x: 3, y: 2 }, "abajo", { x: 2, y: 3 })).toBe("derecha");
  });

  it("mapaDistancias mide pasos reales por los pasillos", () => {
    const g = new Grilla(MAPA_CASA);
    const dist = mapaDistancias(g, g.inicioRaton);
    expect(dist[g.inicioRaton.y * g.ancho + g.inicioRaton.x]).toBe(0);
    expect(dist[0]).toBe(-1); // (0,0) es muro
    expect(dist[g.inicioGato.y * g.ancho + g.inicioGato.x]).toBeGreaterThan(10);
  });
});

describe("Cajas de cartón", () => {
  const cajas = [{ x: 6, y: 6 }];

  it("se puede entrar 2 veces por vida y los usos vuelven al reiniciar", () => {
    const e = new Escondites(cajas, 2, 4);
    expect(e.entrar(6, 6)).toBe(true);
    e.salir();
    expect(e.entrar(6, 6)).toBe(true);
    e.salir();
    expect(e.entrar(6, 6)).toBe(false);
    e.reiniciar();
    expect(e.usosDe(6, 6)).toBe(2);
  });

  it("después del tiempo máximo, Quesito queda a la vista", () => {
    const e = new Escondites(cajas, 2, 4);
    e.entrar(6, 6);
    expect(e.actualizar(3)).toBe(false);
    expect(e.escondido).toBe(true);
    expect(e.actualizar(1.5)).toBe(true);
    expect(e.escondido).toBe(false);
  });

  it("una casilla sin caja no esconde", () => {
    const e = new Escondites(cajas, 2, 4);
    expect(e.entrar(1, 1)).toBe(false);
  });

  it("detener deja a Quesito quieto dentro de la caja hasta que pida otra dirección", () => {
    const g = new Grilla(CRUCE);
    const m = new MovedorGrilla(g, 1, 2);
    m.alLlegar = (x) => {
      if (x === 2) m.detener();
    };
    m.pedir("derecha");
    m.actualizar(3, 1);
    expect(m.posicion()).toEqual({ x: 2, y: 2 });
    m.pedir("derecha");
    m.actualizar(1, 1);
    expect(m.posicion()).toEqual({ x: 3, y: 2 });
  });
});
