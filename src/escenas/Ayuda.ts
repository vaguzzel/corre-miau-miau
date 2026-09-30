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

    const puntaje = this.add.text(12, height - 12, "PUNTOS 000000", { ...estilo, fontSize: "22px" }).setOrigin(0, 1);
    const vidas = this.add.text(width - 12, height - 12, "", { ...estilo, fontSize: "22px", color: "#f2b93b" }).setOrigin(1, 1);
    const siesta = this.add.text(width / 2, 60, "Tomasito está durmiendo una siesta… zzz", { ...estilo, color: "#9fc6e8" }).setOrigin(0.5, 0).setVisible(false);

    const cartel = (texto: string) =>
      this.add.text(width / 2, height / 2, texto, { ...estilo, fontSize: "36px", align: "center", padding: { x: 28, y: 18 } }).setOrigin(0.5).setVisible(false);
    const pausa = cartel("PAUSA\nESPACIO para seguir");
    const listo = cartel("¡Listo!");
    const final = cartel("");

    const juego = this.scene.get("Juego");
    const oyentes: Record<string, (...a: never[]) => void> = {
      pausa: (activa: boolean) => pausa.setVisible(activa),
      listo: (activo: boolean) => listo.setVisible(activo),
      siesta: (activa: boolean) => siesta.setVisible(activa),
      vidas: (n: number) => vidas.setText(`VIDAS ${"● ".repeat(Math.max(0, n)).trim() || "—"}`),
      puntaje: (d: { puntaje: number; restantes: number }) =>
        puntaje.setText(`PUNTOS ${String(d.puntaje).padStart(6, "0")}   ·   quedan ${d.restantes}`),
      ganaste: (p: number) => final.setText(`¡Quesito se comió todo!\n${p} puntos\n\nESPACIO para jugar de nuevo`).setVisible(true),
      perdiste: (p: number) => final.setText(`GAME OVER\nTomasito atrapó a Quesito\n${p} puntos\n\nESPACIO para intentarlo de nuevo`).setVisible(true),
    };
    for (const [evento, fn] of Object.entries(oyentes)) juego.events.on(evento, fn);

    // Al reiniciar el juego esta escena se vuelve a crear: sacamos los oyentes viejos.
    this.events.once("shutdown", () => {
      for (const [evento, fn] of Object.entries(oyentes)) juego.events.off(evento, fn);
    });
  }
}
