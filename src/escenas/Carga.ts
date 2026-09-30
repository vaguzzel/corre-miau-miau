import * as Phaser from "phaser";
import { MASCOTAS } from "../config/mascotas";

/**
 * Carga las fotos y decide dónde empezar.
 * Con `?nivel=begona` (o tomasito, eren, violeta, final) en la dirección se salta directo a ese nivel:
 * útil para probar un nivel sin pasar por el menú.
 */
export class Carga extends Phaser.Scene {
  constructor() {
    super("Carga");
  }

  preload(): void {
    for (const m of MASCOTAS) this.load.image(m.clave, m.foto);
  }

  create(): void {
    for (const m of MASCOTAS) this.textures.get(m.clave).setFilter(Phaser.Textures.FilterMode.LINEAR);
    const nivel = new URLSearchParams(window.location.search).get("nivel");
    if (nivel === "tomasito" || nivel === "begona" || nivel === "eren") this.scene.start("Juego", { nivel });
    else if (nivel === "violeta") this.scene.start("Violeta");
    else if (nivel === "final") this.scene.start("Final");
    else this.scene.start("Inicio");
  }
}
