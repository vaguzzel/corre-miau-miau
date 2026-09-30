import { describe, expect, it } from "vitest";
import { MAPA_CASA } from "../mapa/mapas";
import { Grilla } from "./grilla";
import { MovedorGrilla } from "./MovedorGrilla";

const MINI = `
#######
#Q...G#
#.###.#
=.....=
#######
`;

describe("Grilla", () => {
  it("lee el mapa de la casa con el tamaño del plan", () => {
    const g = new Grilla(MAPA_CASA);
    expect(g.ancho).toBe(27);
    expect(g.alto).toBe(19);
    expect(g.inicioRaton).toEqual({ x: 13, y: 14 });
    expect(g.inicioGato).toEqual({ x: 13, y: 4 });
    expect(g.gateras).toEqual([{ x: 0, y: 9 }, { x: 26, y: 9 }]);
    expect(g.objetos.filter((o) => o.tipo === "pepino")).toHaveLength(4);
    expect(g.objetos.filter((o) => o.tipo === "cafe")).toHaveLength(1);
    expect(g.objetos.filter((o) => o.tipo === "caja")).toHaveLength(2);
  });

  it("todas las casillas libres del mapa de la casa están conectadas", () => {
    const g = new Grilla(MAPA_CASA);
    const visto = new Set<string>([`${g.inicioRaton.x},${g.inicioRaton.y}`]);
    const cola = [g.inicioRaton];
    while (cola.length) {
      const c = cola.shift()!;
      for (const d of ["arriba", "abajo", "izquierda", "derecha"] as const) {
        const v = g.vecino(c.x, c.y, d);
        const k = `${v.x},${v.y}`;
        if (!g.esMuro(v.x, v.y) && !visto.has(k)) {
          visto.add(k);
          cola.push(v);
        }
      }
    }
    let libres = 0;
    for (let y = 0; y < g.alto; y++) for (let x = 0; x < g.ancho; x++) if (!g.esMuro(x, y)) libres++;
    expect(visto.size).toBe(libres);
  });

  it("las gateras conectan un borde con el otro", () => {
    const g = new Grilla(MINI);
    expect(g.vecino(0, 3, "izquierda")).toEqual({ x: 6, y: 3 });
    expect(g.puedeMover(0, 3, "izquierda")).toBe(true);
  });

  it("rechaza mapas con filas de distinto largo", () => {
    expect(() => new Grilla("#Q#\n#G##")).toThrow();
  });
});

describe("MovedorGrilla", () => {
  it("avanza de forma suave y se detiene contra un muro", () => {
    const g = new Grilla(MINI);
    const m = new MovedorGrilla(g, 1, 1);
    m.pedir("derecha");
    m.actualizar(0.5, 1);
    expect(m.posicion()).toEqual({ x: 1.5, y: 1 });
    m.actualizar(10, 1);
    expect(m.posicion()).toEqual({ x: 5, y: 1 });
    expect(m.detenido).toBe(true);
  });

  it("guarda el giro pedido y lo aplica en el próximo cruce", () => {
    const g = new Grilla(MINI);
    const m = new MovedorGrilla(g, 1, 1);
    m.pedir("derecha");
    m.actualizar(0.5, 1);
    m.pedir("abajo"); // en (2,1) hay muro abajo: debe esperar hasta (5,1)
    m.actualizar(3.5, 1);
    expect(m.posicion()).toEqual({ x: 5, y: 1 });
    m.actualizar(1, 1);
    expect(m.posicion()).toEqual({ x: 5, y: 2 });
    expect(m.dir).toBe("abajo");
  });

  it("se da vuelta de inmediato a mitad de camino", () => {
    const g = new Grilla(MINI);
    const m = new MovedorGrilla(g, 1, 1);
    m.pedir("derecha");
    m.actualizar(1.25, 1);
    m.pedir("izquierda");
    expect(m.posicion().x).toBeCloseTo(2.25);
    m.actualizar(0.25, 1);
    expect(m.posicion().x).toBeCloseTo(2);
  });

  it("cruza la gatera y aparece al otro lado", () => {
    const g = new Grilla(MINI);
    const m = new MovedorGrilla(g, 1, 3);
    const llegadas: string[] = [];
    m.alLlegar = (x, y) => llegadas.push(`${x},${y}`);
    m.pedir("izquierda");
    m.actualizar(2, 1);
    expect(llegadas).toEqual(["0,3", "6,3"]);
  });
});
