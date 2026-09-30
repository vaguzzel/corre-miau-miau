import { describe, expect, it } from "vitest";
import { Grilla } from "../sistemas/grilla";
import { distanciaCuadrada, elegirAzar } from "./azar";

// Cruce en (3,2): se puede ir arriba, abajo, izquierda o derecha.
const CRUCE = `
#######
###.###
#Q.G..#
###.###
#######
`;

// Callejón: desde (1,1) solo se puede volver a la derecha.
const CALLEJON = `
#####
#QG.#
#####
`;

describe("IA al azar de Tomasito", () => {
  const g = new Grilla(CRUCE);

  it("nunca se devuelve si hay otra opción", () => {
    for (let i = 0; i < 200; i++) {
      const d = elegirAzar(g, { x: 3, y: 2 }, "derecha", { x: 1, y: 2 }, 0);
      expect(d).not.toBe("izquierda");
    }
  });

  it("con probabilidad 1 persigue: elige el camino más cerca de Quesito", () => {
    expect(elegirAzar(g, { x: 3, y: 2 }, "abajo", { x: 1, y: 2 }, 1)).toBe("izquierda");
  });

  it("usa todas las opciones libres cuando va al azar", () => {
    const vistas = new Set<string>();
    let semilla = 0;
    const azar = () => ((semilla = (semilla * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < 300; i++) vistas.add(elegirAzar(g, { x: 3, y: 2 }, "derecha", { x: 1, y: 2 }, 0, azar));
    expect([...vistas].sort()).toEqual(["abajo", "arriba", "derecha"]);
  });

  it("en un callejón sin salida se devuelve", () => {
    const c = new Grilla(CALLEJON);
    expect(elegirAzar(c, { x: 1, y: 1 }, "izquierda", { x: 3, y: 1 }, 0)).toBe("derecha");
  });

  it("la distancia considera el atajo por las gateras", () => {
    const tunel = new Grilla("#####\n=Q.G=\n#####");
    expect(distanciaCuadrada(tunel, { x: 0, y: 1 }, { x: 4, y: 1 })).toBe(1);
  });
});
