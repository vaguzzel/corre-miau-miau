import * as Phaser from "phaser";
import { crearSticker } from "../arte/texturas";
import { MASCOTAS } from "../config/mascotas";
import { cambiarIdioma, t } from "../i18n/textos";
import { completado, record } from "../sistemas/Guardado";
import { sonido } from "../sistemas/Sonido";

const SUBTITULO = { tomasito: "nivel1", begona: "nivel2", eren: "nivel3", violeta: "nivelFinal" } as const;

// Pantalla de título y selección de nivel. ESC en el juego vuelve aquí.
export class Inicio extends Phaser.Scene {
  private elegido = 0;
  private marcos: Phaser.GameObjects.Rectangle[] = [];

  constructor() {
    super("Inicio");
  }

  preload(): void {
    for (const m of MASCOTAS) if (!this.textures.exists(m.clave)) this.load.image(m.clave, m.foto);
  }

  create(): void {
    const { width, height } = this.scale;
    const fuente = "Trebuchet MS, sans-serif";
    this.registry.set("puntajeTotal", 0);

    // El juego usa filtro de píxel (pixelArt: true); las fotos van con filtro suave para verse nítidas.
    for (const m of MASCOTAS) this.textures.get(m.clave).setFilter(Phaser.Textures.FilterMode.LINEAR);

    this.add.text(width / 2, height * 0.12, t("titulo"), { fontFamily: fuente, fontSize: "60px", color: "#fbefd9", fontStyle: "bold" }).setOrigin(0.5);
    this.add.text(width / 2, height * 0.21, t("elegirNivel"), { fontFamily: fuente, fontSize: "24px", color: "#b5a594" }).setOrigin(0.5);

    this.marcos = [];
    const separacion = width / (MASCOTAS.length + 1);
    MASCOTAS.forEach((m, i) => {
      const x = separacion * (i + 1);
      const y = height * 0.5;
      const marco = this.add.rectangle(x, y + 36, 240, 350, 0x4a3325).setStrokeStyle(4, m.color, 0);
      this.marcos.push(marco);

      const foto = this.add.image(x, y, crearSticker(this, m.clave, m.color));
      foto.setScale(180 / foto.height);
      this.tweens.add({ targets: foto, y: y - 12, duration: 700, yoyo: true, repeat: -1, ease: "Sine.easeInOut", delay: i * 150 });

      this.add.text(x, y + 118, m.nombre, { fontFamily: fuente, fontSize: "28px", color: "#" + m.color.toString(16), fontStyle: "bold" }).setOrigin(0.5);
      this.add.text(x, y + 150, t(SUBTITULO[m.clave as keyof typeof SUBTITULO]), { fontFamily: fuente, fontSize: "17px", color: "#b5a594" }).setOrigin(0.5);
      const hecho = completado(m.clave);
      const mejor = record(m.clave);
      const detalle = [hecho ? t("completado") : "", mejor ? t("record", { p: mejor }) : ""].filter(Boolean).join("  ·  ");
      this.add.text(x, y + 178, detalle, { fontFamily: fuente, fontSize: "15px", color: "#f2b93b" }).setOrigin(0.5);

      marco.setInteractive({ useHandCursor: true });
      marco.on("pointerover", () => this.marcar(i));
      marco.on("pointerdown", () => this.jugar(i));
    });

    this.add.text(width / 2, height * 0.94, t("ayudaMenu"), { fontFamily: fuente, fontSize: "19px", color: "#fbefd9" }).setOrigin(0.5);
    const txtSonido = this.add
      .text(width - 16, 16, t(sonido.encendido ? "sonidoSi" : "sonidoNo"), { fontFamily: fuente, fontSize: "16px", color: "#b5a594" })
      .setOrigin(1, 0);

    this.marcar(this.elegido);
    const kb = this.input.keyboard!;
    kb.on("keydown-LEFT", () => this.marcar((this.elegido + MASCOTAS.length - 1) % MASCOTAS.length));
    kb.on("keydown-RIGHT", () => this.marcar((this.elegido + 1) % MASCOTAS.length));
    kb.on("keydown-A", () => this.marcar((this.elegido + MASCOTAS.length - 1) % MASCOTAS.length));
    kb.on("keydown-D", () => this.marcar((this.elegido + 1) % MASCOTAS.length));
    kb.on("keydown-SPACE", () => this.jugar(this.elegido));
    kb.on("keydown-ENTER", () => this.jugar(this.elegido));
    kb.on("keydown-I", () => {
      cambiarIdioma();
      this.scene.restart();
    });
    kb.on("keydown-N", () => txtSonido.setText(t(sonido.alternarSonido() ? "sonidoSi" : "sonidoNo")));
  }

  private marcar(i: number): void {
    if (i !== this.elegido) sonido.efecto("boton");
    this.elegido = i;
    this.marcos.forEach((m, j) => {
      m.setStrokeStyle(4, MASCOTAS[j].color, j === i ? 1 : 0);
      m.setFillStyle(j === i ? 0x5e4130 : 0x4a3325);
    });
  }

  private jugar(i: number): void {
    const m = MASCOTAS[i];
    sonido.efecto("boton");
    if (m.clave === "violeta") this.scene.start("Violeta");
    else this.scene.start("Juego", { nivel: m.clave });
  }
}
