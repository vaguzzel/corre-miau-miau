import * as Phaser from "phaser";
import { MASCOTAS } from "../config/mascotas";

/** Niveles que ya se pueden jugar. Los demás aparecen como "próximamente". */
const DISPONIBLES = new Set(["tomasito"]);
const SUBTITULO: Record<string, string> = {
  tomasito: "Nivel 1 · El living",
  begona: "Nivel 2 · La cocina",
  eren: "Nivel 3 · El jardín",
  violeta: "Final · Su rincón",
};

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

    // El juego usa filtro de píxel (pixelArt: true); las fotos van con filtro suave para verse nítidas.
    for (const m of MASCOTAS) this.textures.get(m.clave).setFilter(Phaser.Textures.FilterMode.LINEAR);

    this.add.text(width / 2, height * 0.13, "Corre Miau Miau", { fontFamily: fuente, fontSize: "56px", color: "#fbefd9", fontStyle: "bold" }).setOrigin(0.5);
    this.add.text(width / 2, height * 0.22, "Elige un nivel", { fontFamily: fuente, fontSize: "24px", color: "#b5a594" }).setOrigin(0.5);

    this.marcos = [];
    const separacion = width / (MASCOTAS.length + 1);
    MASCOTAS.forEach((m, i) => {
      const x = separacion * (i + 1);
      const y = height * 0.52;
      const disponible = DISPONIBLES.has(m.clave);

      const marco = this.add.rectangle(x, y + 30, 230, 330, 0x4a3325).setStrokeStyle(4, m.color, 0);
      this.marcos.push(marco);

      const foto = this.add.image(x, y, m.clave);
      foto.setScale(170 / Math.max(foto.width, foto.height));
      if (disponible) {
        this.tweens.add({ targets: foto, y: y - 12, duration: 700, yoyo: true, repeat: -1, ease: "Sine.easeInOut", delay: i * 150 });
      } else {
        foto.setAlpha(0.35);
      }

      this.add.text(x, y + 120, m.nombre, { fontFamily: fuente, fontSize: "28px", color: "#" + m.color.toString(16), fontStyle: "bold" }).setOrigin(0.5);
      this.add.text(x, y + 152, disponible ? SUBTITULO[m.clave] : "Próximamente", { fontFamily: fuente, fontSize: "17px", color: "#b5a594" }).setOrigin(0.5);

      marco.setInteractive({ useHandCursor: disponible });
      marco.on("pointerover", () => this.marcar(i));
      marco.on("pointerdown", () => this.jugar(i));
    });

    this.add
      .text(width / 2, height * 0.93, "← → para elegir   ·   ESPACIO o ENTER para jugar", { fontFamily: fuente, fontSize: "20px", color: "#fbefd9" })
      .setOrigin(0.5);

    this.marcar(this.elegido);
    const kb = this.input.keyboard!;
    kb.on("keydown-LEFT", () => this.marcar((this.elegido + MASCOTAS.length - 1) % MASCOTAS.length));
    kb.on("keydown-RIGHT", () => this.marcar((this.elegido + 1) % MASCOTAS.length));
    kb.on("keydown-SPACE", () => this.jugar(this.elegido));
    kb.on("keydown-ENTER", () => this.jugar(this.elegido));
  }

  private marcar(i: number): void {
    this.elegido = i;
    this.marcos.forEach((m, j) => {
      m.setStrokeStyle(4, MASCOTAS[j].color, j === i ? 1 : 0);
      m.setFillStyle(j === i ? 0x5e4130 : 0x4a3325);
    });
  }

  private jugar(i: number): void {
    const m = MASCOTAS[i];
    if (!DISPONIBLES.has(m.clave)) {
      this.cameras.main.shake(120, 0.004);
      return;
    }
    this.scene.start("Juego", { nivel: m.clave });
  }
}
