import * as Phaser from "phaser";
import { Inicio } from "./escenas/Inicio";

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
  scene: [Inicio],
});
