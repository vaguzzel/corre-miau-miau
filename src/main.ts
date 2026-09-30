import * as Phaser from "phaser";
import { Ayuda } from "./escenas/Ayuda";
import { Carga } from "./escenas/Carga";
import { Final } from "./escenas/Final";
import { Inicio } from "./escenas/Inicio";
import { Juego } from "./escenas/Juego";
import { Violeta } from "./escenas/Violeta";

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "juego",
  backgroundColor: "#3a271b",
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720,
  },
  scene: [Carga, Inicio, Juego, Ayuda, Violeta, Final],
});
