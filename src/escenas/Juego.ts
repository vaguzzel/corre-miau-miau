import * as Phaser from "phaser";
import niveles from "../config/niveles.json";
import { MAPA_CASA } from "../mapa/mapas";
import { Grilla, type Dir } from "../sistemas/grilla";
import { MovedorGrilla } from "../sistemas/MovedorGrilla";

const T = niveles.general.tamCasilla;
const COLOR = {
  piso: 0xd8a977,
  pisoAlt: 0xd1a06b,
  muro: 0x8e5b3a,
  muroTapa: 0xa87447,
  gatera: 0x3a271b,
  quesito: 0xf2b93b,
  borde: 0xffffff,
};

const TECLAS: Record<string, Dir> = {
  ArrowUp: "arriba",
  ArrowDown: "abajo",
  ArrowLeft: "izquierda",
  ArrowRight: "derecha",
  KeyW: "arriba",
  KeyS: "abajo",
  KeyA: "izquierda",
  KeyD: "derecha",
};

// Fase 1: prototipo con cuadrados. Laberinto, movimiento de Quesito, cámara y mapa completo.
export class Juego extends Phaser.Scene {
  private grilla!: Grilla;
  private quesito!: MovedorGrilla;
  private sprite!: Phaser.GameObjects.Container;
  private mini!: Phaser.Cameras.Scene2D.Camera;
  private mapaCompleto = false;
  private pausado = false;

  constructor() {
    super("Juego");
  }

  create(): void {
    this.grilla = new Grilla(MAPA_CASA);
    const anchoMundo = this.grilla.ancho * T;
    const altoMundo = this.grilla.alto * T;

    this.dibujarLaberinto();

    const { x, y } = this.grilla.inicioRaton;
    this.quesito = new MovedorGrilla(this.grilla, x, y);
    this.sprite = this.add.container(0, 0, [
      this.add.circle(0, 0, 9, COLOR.borde),
      this.add.circle(0, 0, 7, COLOR.quesito),
      this.add.circle(3, -2, 1.5, 0x2a2330),
    ]);
    this.actualizarSprite();

    const cam = this.cameras.main;
    cam.setBounds(0, 0, anchoMundo, altoMundo);
    cam.setZoom(niveles.general.zoomCamara);
    cam.startFollow(this.sprite, true, 0.12, 0.12);
    cam.setRoundPixels(true);

    // Mini-mapa: una segunda cámara que ve todo el laberinto en chico.
    const anchoMini = 162;
    const zoomMini = anchoMini / anchoMundo;
    this.mini = this.cameras
      .add(this.scale.width - anchoMini - 12, 12, anchoMini, Math.round(altoMundo * zoomMini))
      .setZoom(zoomMini)
      .setBackgroundColor(COLOR.gatera);
    this.mini.centerOn(anchoMundo / 2, altoMundo / 2);

    this.input.keyboard!.on("keydown", (e: KeyboardEvent) => {
      const dir = TECLAS[e.code];
      if (dir && !this.pausado) this.quesito.pedir(dir);
      if (e.code === "KeyM") this.alternarMapa();
      if (e.code === "Space") this.alternarPausa();
    });

    this.scene.launch("Ayuda");
  }

  update(_t: number, dtMs: number): void {
    if (this.pausado) return;
    this.quesito.actualizar(dtMs / 1000, niveles.general.velocidadRaton);
    this.actualizarSprite();
  }

  private actualizarSprite(): void {
    const p = this.quesito.posicion();
    this.sprite.setPosition((p.x + 0.5) * T, (p.y + 0.5) * T);
    this.sprite.setScale(this.quesito.dir === "izquierda" ? -1 : 1, 1);
  }

  private dibujarLaberinto(): void {
    const g = this.add.graphics();
    for (let y = 0; y < this.grilla.alto; y++) {
      for (let x = 0; x < this.grilla.ancho; x++) {
        const px = x * T;
        const py = y * T;
        if (this.grilla.esMuro(x, y)) {
          // Cara frontal más oscura y tapa encima: un adelanto de la vista 3/4.
          g.fillStyle(COLOR.muro).fillRect(px, py, T, T);
          if (!this.grilla.esMuro(x, y + 1)) g.fillStyle(COLOR.muroTapa).fillRect(px, py, T, T - 6);
          else g.fillStyle(COLOR.muroTapa).fillRect(px, py, T, T);
        } else {
          g.fillStyle((x + y) % 2 ? COLOR.piso : COLOR.pisoAlt).fillRect(px, py, T, T);
        }
      }
    }
    for (const c of this.grilla.gateras) g.fillStyle(COLOR.gatera).fillRect(c.x * T, c.y * T, T, T);
  }

  private alternarMapa(): void {
    this.mapaCompleto = !this.mapaCompleto;
    const cam = this.cameras.main;
    const anchoMundo = this.grilla.ancho * T;
    const altoMundo = this.grilla.alto * T;
    if (this.mapaCompleto) {
      cam.stopFollow();
      const zoom = Math.min(this.scale.width / anchoMundo, this.scale.height / altoMundo);
      cam.zoomTo(zoom, 300, "Sine.easeInOut");
      cam.pan(anchoMundo / 2, altoMundo / 2, 300, "Sine.easeInOut");
      this.mini.setVisible(false);
    } else {
      cam.zoomTo(niveles.general.zoomCamara, 300, "Sine.easeInOut");
      cam.pan(this.sprite.x, this.sprite.y, 300, "Sine.easeInOut", false, (_c: Phaser.Cameras.Scene2D.Camera, avance: number) => {
        if (avance === 1) cam.startFollow(this.sprite, true, 0.12, 0.12);
      });
      this.mini.setVisible(true);
    }
    this.events.emit("mapa-completo", this.mapaCompleto);
  }

  private alternarPausa(): void {
    this.pausado = !this.pausado;
    this.events.emit("pausa", this.pausado);
  }
}
