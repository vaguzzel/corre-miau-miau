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

    const puntaje = this.add.text(12, height - 12, "", { ...estilo, fontSize: "22px" }).setOrigin(0, 1);
    const mostrarPuntaje = (p: number, quedan: number) => puntaje.setText(`PUNTOS ${String(p).padStart(6, "0")}   ·   quedan ${quedan}`);

    const cartel = (texto: string) =>
      this.add.text(width / 2, height / 2, texto, { ...estilo, fontSize: "36px", align: "center", padding: { x: 28, y: 18 } }).setOrigin(0.5).setVisible(false);
    const pausa = cartel("PAUSA\nESPACIO para seguir");
    const victoria = cartel("");

    const juego = this.scene.get("Juego");
    const alPausar = (activa: boolean) => pausa.setVisible(activa);
    const alPuntuar = (d: { puntaje: number; restantes: number }) => mostrarPuntaje(d.puntaje, d.restantes);
    const alGanar = (p: number) => victoria.setText(`¡Quesito se comió todo!\n${p} puntos\n\nESPACIO para jugar de nuevo`).setVisible(true);
    juego.events.on("pausa", alPausar);
    juego.events.on("puntaje", alPuntuar);
    juego.events.on("ganaste", alGanar);

    // Al reiniciar el juego esta escena se vuelve a crear: sacamos los oyentes viejos.
    this.events.once("shutdown", () => {
      juego.events.off("pausa", alPausar);
      juego.events.off("puntaje", alPuntuar);
      juego.events.off("ganaste", alGanar);
    });
  }
}
