import * as Phaser from "phaser";
import niveles from "../config/niveles.json";
import { MAPA_CASA } from "../mapa/mapas";
import { Despensa } from "../sistemas/Despensa";
import { Grilla, type Dir, type TipoObjeto } from "../sistemas/grilla";
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
  queso: 0xf6cb4f,
  quesoSombra: 0xc4922a,
  pepino: 0x3f7a3a,
  pepinoCentro: 0xe8f4d0,
  taza: 0xe07a6a,
  cafe: 0x6b4226,
  caja: 0xb88a55,
  cajaBorde: 0x6e4a2a,
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

// Prototipo con formas simples: laberinto, Quesito, queso y puntaje. El arte llega en la fase 4.
export class Juego extends Phaser.Scene {
  private grilla!: Grilla;
  private quesito!: MovedorGrilla;
  private despensa!: Despensa;
  private sprite!: Phaser.GameObjects.Container;
  private mini!: Phaser.Cameras.Scene2D.Camera;
  private dibujosObjetos = new Map<string, Phaser.GameObjects.GameObject>();
  private mapaCompleto = false;
  private pausado = false;
  private terminado = false;

  constructor() {
    super("Juego");
  }

  create(): void {
    // `create` también corre al reiniciar la escena, así que el estado se limpia aquí.
    this.mapaCompleto = false;
    this.pausado = false;
    this.terminado = false;
    this.dibujosObjetos.clear();

    this.grilla = new Grilla(MAPA_CASA);
    this.despensa = new Despensa(this.grilla.objetos, niveles.general.puntos);
    const anchoMundo = this.grilla.ancho * T;
    const altoMundo = this.grilla.alto * T;

    this.dibujarLaberinto();
    this.dibujarObjetos();

    const { x, y } = this.grilla.inicioRaton;
    this.quesito = new MovedorGrilla(this.grilla, x, y);
    this.quesito.alLlegar = (cx, cy) => this.comer(cx, cy);
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
      if (this.terminado) {
        if (e.code === "Space") this.scene.restart();
        return;
      }
      const dir = TECLAS[e.code];
      if (dir && !this.pausado) this.quesito.pedir(dir);
      if (e.code === "KeyM") this.alternarMapa();
      if (e.code === "Space") this.alternarPausa();
    });

    this.scene.launch("Ayuda");
    // La casilla de partida también tiene queso.
    this.time.delayedCall(0, () => this.comer(x, y));
  }

  update(_t: number, dtMs: number): void {
    if (this.pausado || this.terminado) return;
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

  private dibujarObjetos(): void {
    for (const { casilla, tipo } of this.grilla.objetos) {
      const cx = (casilla.x + 0.5) * T;
      const cy = (casilla.y + 0.5) * T;
      this.dibujosObjetos.set(`${casilla.x},${casilla.y}`, this.dibujoDe(tipo, cx, cy));
    }
  }

  private dibujoDe(tipo: TipoObjeto, cx: number, cy: number): Phaser.GameObjects.Graphics {
    const g = this.add.graphics({ x: cx, y: cy });
    switch (tipo) {
      case "queso":
        g.fillStyle(COLOR.quesoSombra).fillTriangle(-4, 4, 4, 4, 4, -2);
        g.fillStyle(COLOR.queso).fillTriangle(-4, 3, 4, 3, 4, -3);
        break;
      case "pepino":
        g.fillStyle(COLOR.pepino).fillCircle(0, 0, 7);
        g.fillStyle(COLOR.pepinoCentro).fillCircle(0, 0, 4.5);
        break;
      case "cafe":
        g.fillStyle(COLOR.taza).fillCircle(0, 0, 6.5);
        g.fillStyle(COLOR.cafe).fillCircle(0, 0, 4);
        break;
      case "caja":
        g.fillStyle(COLOR.caja).fillRect(-9, -7, 18, 15);
        g.lineStyle(1.5, COLOR.cajaBorde).strokeRect(-9, -7, 18, 15);
        break;
    }
    return g;
  }

  private comer(x: number, y: number): void {
    const tipo = this.despensa.comer(x, y);
    if (!tipo) return;
    const k = `${x},${y}`;
    const dibujo = this.dibujosObjetos.get(k);
    if (dibujo) {
      this.dibujosObjetos.delete(k);
      this.tweens.add({ targets: dibujo, scale: 1.8, alpha: 0, duration: 180, onComplete: () => dibujo.destroy() });
    }
    this.events.emit("puntaje", { puntaje: this.despensa.puntaje, restantes: this.despensa.restantes, tipo });
    if (this.despensa.ganado) this.ganar();
  }

  private ganar(): void {
    this.terminado = true;
    this.events.emit("ganaste", this.despensa.puntaje);
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
