import * as Phaser from "phaser";
import { t } from "../i18n/textos";
import { sonido } from "../sistemas/Sonido";

interface DatosFinal {
  puntaje: number;
  record: boolean;
  ultimo: boolean;
}

// Capa de interfaz encima del juego (no se mueve con la cámara): puntaje, vidas, avisos y botones.
export class Ayuda extends Phaser.Scene {
  private gato = "";

  constructor() {
    super("Ayuda");
  }

  init(datos: { gato?: string }): void {
    this.gato = datos.gato ?? "";
  }

  create(): void {
    const { width, height } = this.scale;
    const estilo = { fontFamily: "Trebuchet MS, sans-serif", fontSize: "18px", color: "#fbefd9", backgroundColor: "#3a271bcc", padding: { x: 10, y: 6 } };
    const g = this.gato;
    this.add.text(12, 12, t("controles"), { ...estilo, fontSize: "16px" });

    const puntaje = this.add.text(12, height - 12, t("puntos", { p: "000000", q: "" }), { ...estilo, fontSize: "22px" }).setOrigin(0, 1);
    const vidas = this.add.text(width - 12, height - 12, "", { ...estilo, fontSize: "22px", color: "#f2b93b" }).setOrigin(1, 1);
    const siesta = this.add.text(width / 2, 100, t("siesta", { g }), { ...estilo, color: "#9fc6e8" }).setOrigin(0.5, 0).setVisible(false);
    const efectos = this.add.text(width / 2, 58, "", { ...estilo, fontSize: "20px", color: "#ffe7a0" }).setOrigin(0.5, 0).setVisible(false);
    const aviso = this.add
      .text(width / 2, height - 70, "", { ...estilo, fontSize: "20px", align: "center", wordWrap: { width: width * 0.7 } })
      .setOrigin(0.5, 1)
      .setVisible(false);
    let quitarAviso: Phaser.Time.TimerEvent | null = null;

    const cartel = (texto: string) =>
      this.add.text(width / 2, height / 2, texto, { ...estilo, fontSize: "34px", align: "center", padding: { x: 28, y: 18 } }).setOrigin(0.5).setVisible(false);
    const pausa = cartel(t("pausa"));
    const listo = cartel(t("listo"));
    const final = cartel("");

    // Botones grandes para jugar con el dedo (también sirven con el mouse)
    const botones: [string, string][] = [["pausa", "⏸"], ["mapa", "🗺"], ["sonido", sonido.encendido ? "🔊" : "🔇"], ["menu", "✕"]];
    const objetos = botones.map(([id, icono], i) => {
      const b = this.add
        .text(width - 12 - i * 58, 150, icono, { ...estilo, fontSize: "26px", padding: { x: 12, y: 6 } })
        .setOrigin(1, 0)
        .setInteractive({ useHandCursor: true });
      b.on("pointerdown", (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => {
        e.stopPropagation();
        sonido.efecto("boton");
        this.events.emit("boton", id);
      });
      return b;
    });

    const juego = this.scene.get("Juego");
    const oyentes: Record<string, (...a: never[]) => void> = {
      pausa: (activa: boolean) => pausa.setVisible(activa),
      listo: (activo: boolean) => listo.setVisible(activo),
      siesta: (activa: boolean) => siesta.setVisible(activa),
      sonido: (encendido: boolean) => objetos[2].setText(encendido ? "🔊" : "🔇"),
      efectos: (texto: string) => efectos.setText(texto).setVisible(texto !== ""),
      aviso: (texto: string) => {
        aviso.setText(texto).setVisible(true).setAlpha(1);
        quitarAviso?.remove();
        quitarAviso = this.time.delayedCall(4500, () => this.tweens.add({ targets: aviso, alpha: 0, duration: 400 }));
      },
      vidas: (n: number) => vidas.setText(t("vidas", { v: "● ".repeat(Math.max(0, n)).trim() || "—" })),
      puntaje: (d: { puntaje: number; restantes: number }) => puntaje.setText(t("puntos", { p: String(d.puntaje).padStart(6, "0"), q: d.restantes })),
      ganaste: (d: DatosFinal) => {
        const texto = t(d.ultimo ? "ganasteUltimo" : "ganasteNivel", { p: d.puntaje });
        final.setText((d.record ? t("nuevoRecord") + "\n" : "") + texto).setVisible(true);
      },
      perdiste: (d: DatosFinal) => final.setText((d.record ? t("nuevoRecord") + "\n" : "") + t("perdiste", { g, p: d.puntaje })).setVisible(true),
    };
    for (const [evento, fn] of Object.entries(oyentes)) juego.events.on(evento, fn);

    // Al reiniciar el juego esta escena se vuelve a crear: sacamos los oyentes viejos.
    this.events.once("shutdown", () => {
      for (const [evento, fn] of Object.entries(oyentes)) juego.events.off(evento, fn);
    });
  }
}
