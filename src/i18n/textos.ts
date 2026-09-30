import { leer, guardar } from "../sistemas/Guardado";

// Todos los textos del juego, en español e inglés. Las {llaves} se reemplazan con valores.
const ES = {
  titulo: "Corre Miau Miau",
  elegirNivel: "Elige un nivel",
  ayudaMenu: "← → elegir   ·   ESPACIO o ENTER jugar   ·   I: English   ·   N: sonido",
  nivel1: "Nivel 1 · El living",
  nivel2: "Nivel 2 · La cocina",
  nivel3: "Nivel 3 · El jardín",
  nivelFinal: "Final · Su rincón",
  record: "Récord: {p}",
  completado: "★ Completado",
  controles: "Flechas/WASD: mover  ·  M: mapa  ·  ESPACIO: pausa  ·  N: sonido  ·  ESC: menú",
  puntos: "PUNTOS {p}   ·   quedan {q}",
  vidas: "VIDAS {v}",
  pausa: "PAUSA\nESPACIO para seguir  ·  ESC para el menú",
  listo: "¡Listo!",
  siesta: "{g} está durmiendo una siesta… zzz",
  patrulla: "{g} fue a revisar su rincón",
  caza: "¡{g} te está cazando!",
  ganasteNivel: "¡Quesito se comió todo!\n{p} puntos\n\nESPACIO: siguiente nivel  ·  ESC: menú",
  ganasteUltimo: "¡Quesito se comió todo!\n{p} puntos\n\nESPACIO: ir con Violeta",
  perdiste: "GAME OVER\n{g} atrapó a Quesito\n{p} puntos\n\nESPACIO: intentar de nuevo  ·  ESC: menú",
  nuevoRecord: "¡Nuevo récord!",
  avisoInicio: "Come todo el queso sin que {g} te atrape.  Pepino: lo asusta.  Caja: te escondes.  Cafecito (aparece a la mitad): turbo.",
  avisoPepino: "¡Pepino! {g} se asustó y huye. Tócalo para mandarlo a su cama (+200).",
  avisoSinMiedo: "{g} ya no tiene miedo.",
  avisoCama: "¡{g} corrió a su cama! Vuelve en unos segundos.",
  avisoCaja: "Quesito se escondió en la caja: {g} ya no lo ve. Quédate quieto hasta 4 s; muévete para salir. (Esta caja: {u} uso(s) más)",
  avisoAsomo: "Se acabó el escondite: Quesito quedó a la vista.",
  avisoCafe: "¡Cafecito! Quesito corre más rápido por 5 segundos.",
  avisoCafeAparece: "¡Apareció un cafecito en el centro! Se va en {s} segundos.",
  avisoVidaExtra: "¡Vida extra!",
  efTurbo: "Turbo {s} s",
  efAsustado: "{g} asustado {s} s",
  efEscondido: "Escondido {s} s",
  efCama: "{g} en su cama {s} s",
  efCafe: "Cafecito disponible {s} s",
  violetaTitulo: "El rincón de Violeta",
  violetaInicio: "Aquí no hay persecución: junta los {n} corazones y llévaselos a Violeta.",
  violetaFaltan: "Corazones: {h} / {n}",
  violetaListo: "¡Tienes todos los corazones! Llévaselos a Violeta.",
  violetaFalta: "Violeta te mira con curiosidad… faltan corazones.",
  guau: "¡Guau!",
  duda: "¿?",
  fin: "¡Juego completado!",
  finTotal: "Puntaje total: {p}",
  finCreditos: "Corre Miau Miau · un juego de Valentina con Tomasito, Begoña, Eren y Violeta\nCódigo y pixel art hechos con ayuda de Claude · Phaser 4 + TypeScript",
  finVolver: "ESPACIO: volver al menú",
  sonidoSi: "Sonido: sí",
  sonidoNo: "Sonido: no",
};

type Clave = keyof typeof ES;

const EN: Record<Clave, string> = {
  titulo: "Corre Miau Miau",
  elegirNivel: "Choose a level",
  ayudaMenu: "← → choose   ·   SPACE or ENTER play   ·   I: Español   ·   N: sound",
  nivel1: "Level 1 · The living room",
  nivel2: "Level 2 · The kitchen",
  nivel3: "Level 3 · The garden",
  nivelFinal: "Finale · Her corner",
  record: "Best: {p}",
  completado: "★ Completed",
  controles: "Arrows/WASD: move  ·  M: map  ·  SPACE: pause  ·  N: sound  ·  ESC: menu",
  puntos: "SCORE {p}   ·   {q} left",
  vidas: "LIVES {v}",
  pausa: "PAUSED\nSPACE to continue  ·  ESC for the menu",
  listo: "Ready!",
  siesta: "{g} is taking a nap… zzz",
  patrulla: "{g} went to check on their corner",
  caza: "{g} is hunting you!",
  ganasteNivel: "Quesito ate everything!\n{p} points\n\nSPACE: next level  ·  ESC: menu",
  ganasteUltimo: "Quesito ate everything!\n{p} points\n\nSPACE: go see Violeta",
  perdiste: "GAME OVER\n{g} caught Quesito\n{p} points\n\nSPACE: try again  ·  ESC: menu",
  nuevoRecord: "New best score!",
  avisoInicio: "Eat all the cheese without {g} catching you.  Cucumber: scares them.  Box: you hide.  Coffee (shows up halfway): turbo.",
  avisoPepino: "Cucumber! {g} got scared and runs away. Touch them to send them to bed (+200).",
  avisoSinMiedo: "{g} is not scared anymore.",
  avisoCama: "{g} ran to bed! They'll be back in a few seconds.",
  avisoCaja: "Quesito hid in the box: {g} can't see him. Stay still up to 4 s; move to get out. (This box: {u} more use(s))",
  avisoAsomo: "Hiding time is over: Quesito is visible again.",
  avisoCafe: "Coffee! Quesito runs faster for 5 seconds.",
  avisoCafeAparece: "A coffee appeared in the middle! It leaves in {s} seconds.",
  avisoVidaExtra: "Extra life!",
  efTurbo: "Turbo {s} s",
  efAsustado: "{g} scared {s} s",
  efEscondido: "Hidden {s} s",
  efCama: "{g} in bed {s} s",
  efCafe: "Coffee available {s} s",
  violetaTitulo: "Violeta's corner",
  violetaInicio: "No chasing here: collect the {n} hearts and bring them to Violeta.",
  violetaFaltan: "Hearts: {h} / {n}",
  violetaListo: "You have all the hearts! Bring them to Violeta.",
  violetaFalta: "Violeta looks at you curiously… some hearts are missing.",
  guau: "Woof!",
  duda: "?",
  fin: "Game complete!",
  finTotal: "Total score: {p}",
  finCreditos: "Corre Miau Miau · a game by Valentina with Tomasito, Begoña, Eren and Violeta\nCode and pixel art made with help from Claude · Phaser 4 + TypeScript",
  finVolver: "SPACE: back to the menu",
  sonidoSi: "Sound: on",
  sonidoNo: "Sound: off",
};

const IDIOMAS = { es: ES, en: EN };
export type Idioma = keyof typeof IDIOMAS;

let idioma: Idioma = leer<string>("idioma", "es") === "en" ? "en" : "es";

export function idiomaActual(): Idioma {
  return idioma;
}

export function cambiarIdioma(): Idioma {
  idioma = idioma === "es" ? "en" : "es";
  guardar("idioma", idioma);
  return idioma;
}

/** Texto traducido, con las {llaves} reemplazadas. */
export function t(clave: Clave, valores: Record<string, string | number> = {}): string {
  return IDIOMAS[idioma][clave].replace(/\{(\w+)\}/g, (_, k: string) => String(valores[k] ?? `{${k}}`));
}
