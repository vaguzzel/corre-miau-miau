import * as Phaser from "phaser";
import { dibujarCorazon } from "../arte/rincon";
import { escribir } from "../arte/letras";
import { Lienzo } from "../arte/Lienzo";
import { P } from "../arte/paleta";
import { crearSticker, crearTexturasBase, texturaDe } from "../arte/texturas";
import { MASCOTAS } from "../config/mascotas";
import { t } from "../i18n/textos";
import { marcarCompletado, registrarPuntaje } from "../sistemas/Guardado";
import { sonido } from "../sistemas/Sonido";

/** Fondo de la escena final, visto de lado (320×180 px, se amplía ×4). */
function fondoFinal(): Lienzo {
  const l = new Lienzo(320, 180);
  for (let y = 0; y < 118; y++) for (let x = 0; x < 320; x++) l.px(x, y, (x + y) % 16 === 0 ? 0xd8c0e2 : x % 16 === 8 && y % 16 === 8 ? P.rosa : 0xe6d3ec);
  // Ventana con cortinas
  l.rect(30, 18, 70, 56, P.cremaClara);
  l.rect(34, 22, 29, 48, P.cielo);
  l.rect(67, 22, 29, 48, P.cielo);
  for (let i = 0; i < 12; i++) l.px(40 + i, 40 - i, P.cremaClara);
  l.rect(20, 12, 12, 70, P.lila);
  l.rect(98, 12, 12, 70, P.lila);
  l.hline(16, 12, 98, P.lilaOsc);
  l.rect(28, 74, 74, 4, P.cremaClara);
  // Marco para la foto de Violeta
  l.rect(206, 24, 48, 42, P.maderaMed);
  l.rect(210, 28, 40, 34, P.cremaClara);
  escribir(l, "VIOLETA", 230, 70, P.lilaOsc);
  // Zócalo y piso
  l.rect(0, 112, 320, 6, P.cremaClara);
  for (let y = 118; y < 180; y++) {
    const fila = Math.floor((y - 118) / 6);
    for (let x = 0; x < 320; x++) {
      let c = fila % 2 ? 0xe3c49a : 0xd9b88c;
      if ((y - 118) % 6 === 5 || (x + fila * 37) % 70 === 0) c = 0xc49c6e;
      l.px(x, y, c);
    }
  }
  l.ovalo(160, 158, 120, 12, P.lilaClara);
  l.ovalo(160, 158, 110, 8, 0xdcc6ea);
  // Cama de Violeta
  l.ovalo(262, 150, 44, 12, 0x9676b3);
  l.rect(218, 128, 88, 22, 0xb99ad0);
  l.ovalo(262, 128, 42, 8, P.cremaClara);
  escribir(l, "VIOLETA", 262, 138, P.cremaClara);
  // Huesito
  l.rect(200, 162, 12, 3, P.cremaClara);
  l.ovalo(199, 162, 2, 2, P.cremaClara);
  l.ovalo(213, 164, 2, 2, P.cremaClara);
  return l;
}

/**
 * Escena final: Quesito se acerca, Violeta ladra, Quesito duda, vuelve con cariño y se abrazan.
 * Es la misma idea que una máquina de estados, pero en forma de "línea de tiempo".
 */
export class Final extends Phaser.Scene {
  constructor() {
    super("Final");
  }

  create(): void {
    const { width } = this.scale;
    const Z = 4;
    this.listo = false;
    this.cameras.main.fadeIn(600, 250, 240, 250);
    texturaDe(this, "final-fondo", fondoFinal());
    this.add.image(0, 0, "final-fondo").setOrigin(0).setScale(Z);
    const foto = this.add.image(230 * Z, 45 * Z, "violeta");
    foto.setScale(Math.min((40 * Z) / foto.width, (34 * Z) / foto.height));

    crearTexturasBase(this);
    texturaDe(this, "corazon", dibujarCorazon());
    const suelo = 150 * Z;
    const color = MASCOTAS.find((m) => m.clave === "violeta")!.color;
    const violeta = this.add.image(width * 0.66, suelo, crearSticker(this, "violeta", color)).setOrigin(0.5, 1);
    violeta.setScale(190 / violeta.height);
    const raton = this.add.image(width * 0.08, suelo, "quesito-lado-0").setOrigin(0.5, 1).setScale(Z);

    const estilo = { fontFamily: "Trebuchet MS, sans-serif", fontSize: "30px", color: "#4a3627", backgroundColor: "#fffbf2", padding: { x: 14, y: 8 } };
    const burbuja = (x: number, y: number, texto: string) => {
      const b = this.add.text(x, y, texto, estilo).setOrigin(0.5).setScale(0);
      this.tweens.add({ targets: b, scale: 1, duration: 250, ease: "Back.easeOut" });
      return b;
    };

    // Patitas de Quesito mientras camina
    const caminar = this.time.addEvent({ delay: 130, loop: true, callback: () => raton.setTexture(raton.texture.key === "quesito-lado-0" ? "quesito-lado-1" : "quesito-lado-0") });
    const linea: [number, () => void][] = [
      [0, () => this.tweens.add({ targets: raton, x: width * 0.36, duration: 2200, ease: "Sine.easeInOut" })],
      [2300, () => {
        caminar.paused = true;
        sonido.efecto("guau");
        const b = burbuja(violeta.x, suelo - 230, t("guau"));
        this.tweens.add({ targets: violeta, scaleX: violeta.scaleX * 1.12, scaleY: violeta.scaleY * 1.06, duration: 140, yoyo: true, repeat: 3 });
        this.time.delayedCall(1300, () => b.destroy());
      }],
      [3700, () => {
        const b = burbuja(raton.x, suelo - 110, t("duda"));
        raton.setFlipX(true);
        this.tweens.add({ targets: raton, x: width * 0.26, duration: 600 });
        this.tweens.add({ targets: raton, angle: 6, duration: 60, yoyo: true, repeat: 5 });
        this.time.delayedCall(1300, () => b.destroy());
      }],
      [5300, () => {
        raton.setFlipX(false);
        caminar.paused = false;
        const b = burbuja(raton.x + 60, suelo - 110, "♥");
        this.tweens.add({ targets: [raton, b], x: `+=${width * 0.25}`, duration: 1800, ease: "Sine.easeInOut" });
        this.time.delayedCall(1800, () => b.destroy());
      }],
      [7200, () => {
        caminar.paused = true;
        sonido.efecto("ganar");
        this.tweens.add({ targets: raton, y: suelo - 10, duration: 450, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
        this.tweens.add({ targets: violeta, angle: -10, duration: 500, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
        this.time.addEvent({
          delay: 180,
          repeat: 24,
          callback: () => {
            const c = this.add.image(width * 0.55 + (Math.random() - 0.5) * 220, suelo - 120, "corazon").setScale(Z * 0.8);
            this.tweens.add({ targets: c, y: c.y - 220, alpha: 0, duration: 1800, ease: "Sine.easeOut", onComplete: () => c.destroy() });
          },
        });
      }],
      [8600, () => this.mostrarCreditos()],
    ];
    for (const [ms, fn] of linea) this.time.delayedCall(ms, fn);

    this.input.keyboard!.on("keydown-SPACE", () => this.volver());
    this.input.keyboard!.on("keydown-ESC", () => this.volver());
    this.input.on("pointerdown", () => this.volver());
    marcarCompletado("violeta");
  }

  private listo = false;

  private mostrarCreditos(): void {
    const { width } = this.scale;
    const total = (this.registry.get("puntajeTotal") as number | undefined) ?? 0;
    registrarPuntaje("total", total);
    const e = { fontFamily: "Trebuchet MS, sans-serif", color: "#4a3627", align: "center" };
    const panel = this.add.rectangle(width / 2, 150, 860, 250, 0xfffbf2, 0.94).setStrokeStyle(4, 0xb48ce0).setAlpha(0);
    this.tweens.add({ targets: panel, alpha: 1, duration: 500 });
    const titulo = this.add.text(width / 2, 70, t("fin"), { ...e, fontSize: "56px", fontStyle: "bold", color: "#6b3fa0" }).setOrigin(0.5).setAlpha(0);
    const puntos = this.add.text(width / 2, 130, t("finTotal", { p: total }), { ...e, fontSize: "28px" }).setOrigin(0.5).setAlpha(0);
    const creditos = this.add
      .text(width / 2, 185, t("finCreditos"), { ...e, fontSize: "18px" })
      .setOrigin(0.5)
      .setAlpha(0);
    const volver = this.add.text(width / 2, 245, t("finVolver"), { ...e, fontSize: "20px" }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: [titulo, puntos, creditos, volver], alpha: 1, duration: 700, delay: this.tweens.stagger(250, {}) });
    this.listo = true;
  }

  private volver(): void {
    if (!this.listo) return;
    this.registry.set("puntajeTotal", 0);
    this.scene.start("Inicio");
  }
}
