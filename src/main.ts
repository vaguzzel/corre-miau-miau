import * as Phaser from "phaser";
import { Ayuda } from "./escenas/Ayuda";
import { Inicio } from "./escenas/Inicio";
import { Juego } from "./escenas/Juego";

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
  scene: [Inicio, Juego, Ayuda],
});
