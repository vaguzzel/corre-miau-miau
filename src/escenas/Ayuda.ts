import * as Phaser from "phaser";

// Capa de interfaz encima del juego (no se mueve con la cámara).
export class Ayuda extends Phaser.Scene {
  constructor() {
    super("Ayuda");
  }

  create(): void {
    const { width, height } = this.scale;
    const estilo = { fontFamily: "Trebuchet MS, sans-serif", fontSize: "18px", color: "#fbefd9", backgroundColor: "#3a271bcc", padding: { x: 10, y: 6 } };
    this.add.text(12, 12, "Flechas o WASD: mover   ·   M: mapa completo   ·   ESPACIO: pausa", estilo);

    const pausa = this.add
      .text(width / 2, height / 2, "PAUSA\nESPACIO para seguir", { ...estilo, fontSize: "36px", align: "center", padding: { x: 28, y: 18 } })
      .setOrigin(0.5)
      .setVisible(false);

    const juego = this.scene.get("Juego");
    juego.events.on("pausa", (activa: boolean) => pausa.setVisible(activa));
  }
}
