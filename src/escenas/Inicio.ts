import * as Phaser from "phaser";
import { MASCOTAS } from "../config/mascotas";

// Fase 0: pantalla de prueba que confirma que Phaser corre y que las fotos cargan.
export class Inicio extends Phaser.Scene {
  constructor() {
    super("Inicio");
  }

  preload(): void {
    for (const m of MASCOTAS) this.load.image(m.clave, m.foto);
  }

  create(): void {
    const { width, height } = this.scale;

    // El juego usa filtro de píxel (pixelArt: true); las fotos van con filtro suave para verse nítidas.
    for (const m of MASCOTAS) this.textures.get(m.clave).setFilter(Phaser.Textures.FilterMode.LINEAR);

    this.add
      .text(width / 2, height * 0.2, "Corre Miau Miau", {
        fontFamily: "Trebuchet MS, sans-serif",
        fontSize: "48px",
        color: "#fbefd9",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const separacion = width / (MASCOTAS.length + 1);
    MASCOTAS.forEach((m, i) => {
      const x = separacion * (i + 1);
      const y = height * 0.55;
      const foto = this.add.image(x, y, m.clave);
      foto.setScale(170 / Math.max(foto.width, foto.height));

      // Cabeza flotante: rebote suave, cada una desfasada.
      this.tweens.add({
        targets: foto,
        y: y - 14,
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
        delay: i * 150,
      });

      this.add
        .text(x, height * 0.75, m.nombre, { fontFamily: "Trebuchet MS, sans-serif", fontSize: "26px", color: "#" + m.color.toString(16) })
        .setOrigin(0.5);
    });

    this.add
      .text(width / 2, height * 0.9, `Fase 0 lista · Phaser ${Phaser.VERSION}`, {
        fontFamily: "Trebuchet MS, sans-serif",
        fontSize: "18px",
        color: "#b5a594",
      })
      .setOrigin(0.5);
  }
}
