import * as Phaser from "phaser";

// Capa de interfaz encima del juego (no se mueve con la cámara).
export class Ayuda extends Phaser.Scene {
  constructor() {
    super("Ayuda");
  }

  create(): void {
    const estilo = { fontFamily: "Trebuchet MS, sans-serif", fontSize: "18px", color: "#fbefd9", backgroundColor: "#3a271bcc", padding: { x: 10, y: 6 } };
    this.add.text(12, 12, "Flechas o WASD: mover   ·   M: mapa completo", estilo);
    const aviso = this.add
      .text(this.scale.width / 2, this.scale.height - 30, "Mapa completo · el juego está en pausa · M para volver", estilo)
      .setOrigin(0.5)
      .setVisible(false);
    this.scene.get("Juego").events.on("mapa-completo", (activo: boolean) => aviso.setVisible(activo));
  }
}
