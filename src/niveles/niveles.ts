import { COCINA } from "../arte/cocina";
import type { Habitacion } from "../arte/habitacion";
import { crearJardin } from "../arte/jardin";
import { LIVING } from "../arte/living";
import config from "../config/niveles.json";
import type { Modo } from "../ia/modos";
import type { Grilla } from "../sistemas/grilla";

export type ClaveNivel = "tomasito" | "begona" | "eren";
export type TipoIA = "azar" | "bfs" | "astar";

/** Parámetros de dificultad de un nivel (vienen de niveles.json). */
export interface ConfigNivel {
  velocidadGato: number;
  ia: TipoIA;
  probPerseguir: number;
  adelanto?: number;
  pepinoSeg: number;
  siesta: boolean;
  siestaCadaSeg: number[];
  siestaSeg: number;
  esquina: number[];
  modos: [Modo, number][];
}

export interface DefNivel {
  clave: ClaveNivel;
  numero: number;
  /** Nombre del gato que persigue */
  gato: string;
  /** Qué sigue al ganar */
  siguiente: ClaveNivel | "violeta";
  config: ConfigNivel;
  habitacion: (g: Grilla) => Habitacion;
}

const cfg = (clave: ClaveNivel) => config[clave] as unknown as ConfigNivel;

export const NIVELES: Record<ClaveNivel, DefNivel> = {
  tomasito: { clave: "tomasito", numero: 1, gato: "Tomasito", siguiente: "begona", config: cfg("tomasito"), habitacion: () => LIVING },
  begona: { clave: "begona", numero: 2, gato: "Begoña", siguiente: "eren", config: cfg("begona"), habitacion: () => COCINA },
  eren: { clave: "eren", numero: 3, gato: "Eren", siguiente: "violeta", config: cfg("eren"), habitacion: (g) => crearJardin((x, y) => g.esMuro(x, y)) },
};
