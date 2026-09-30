import * as Phaser from "phaser";
import niveles from "../config/niveles.json";
import { elegirAzar } from "../ia/azar";
import { MAPA_CASA } from "../mapa/mapas";
import { Despensa } from "../sistemas/Despensa";
import { Grilla, type Dir, type TipoObjeto } from "../sistemas/grilla";
import { MovedorGrilla } from "../sistemas/MovedorGrilla";

const T = niveles.general.tamCasilla;
const NIVEL = niveles.tomasito;
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

/** listo: cuenta regresiva · jugando · atrapado: animación tras perder una vida · fin: ganó o perdió */
type Fase = "listo" | "jugando" | "atrapado" | "fin";

// Prototipo con formas simples: laberinto, Quesito, Tomasito, queso, vidas y puntaje. El arte llega en la fase 4.
export class Juego extends Phaser.Scene {
  private grilla!: Grilla;
  private quesito!: MovedorGrilla;
  private gato!: MovedorGrilla;
  private despensa!: Despensa;
  private spriteRaton!: Phaser.GameObjects.Container;
  private spriteGato!: Phaser.GameObjects.Container;
  private caraGato!: Phaser.GameObjects.Image;
  private mini!: Phaser.Cameras.Scene2D.Camera;
  private dibujosObjetos = new Map<string, Phaser.GameObjects.Graphics>();
  private fase: Fase = "listo";
  private vidas = 0;
  private mapaCompleto = false;
  private pausado = false;
  private siestaRestante = 0;
  private proximaSiesta = 0;

  constructor() {
    super("Juego");
  }

  create(): void {
    // `create` también corre al reiniciar la escena, así que el estado se limpia aquí.
    this.mapaCompleto = false;
    this.pausado = false;
    this.vidas = niveles.general.vidas;
    this.dibujosObjetos.clear();

    this.grilla = new Grilla(MAPA_CASA);
    this.despensa = new Despensa(this.grilla.objetos, niveles.general.puntos);
    const anchoMundo = this.grilla.ancho * T;
    const altoMundo = this.grilla.alto * T;

    this.dibujarLaberinto();
    this.dibujarObjetos();

    this.spriteRaton = this.add.container(0, 0, [
      this.add.circle(0, 0, 9, COLOR.borde),
      this.add.circle(0, 0, 7, COLOR.quesito),
      this.add.circle(3, -2, 1.5, 0x2a2330),
    ]);
    this.caraGato = this.add.image(0, -6, "tomasito");
    this.caraGato.setScale(36 / Math.max(this.caraGato.width, this.caraGato.height));
    this.spriteGato = this.add.container(0, 0, [this.add.ellipse(0, 8, 22, 7, 0x2b170a, 0.3), this.caraGato]);

    const cam = this.cameras.main;
    cam.setBounds(0, 0, anchoMundo, altoMundo);
    cam.setZoom(niveles.general.zoomCamara);
    cam.setRoundPixels(true);

    // Mini-mapa: una segunda cámara que ve todo el laberinto en chico.
    const anchoMini = 162;
    const zoomMini = anchoMini / anchoMundo;
    this.mini = this.cameras
      .add(this.scale.width - anchoMini - 12, 12, anchoMini, Math.round(altoMundo * zoomMini))
      .setZoom(zoomMini)
      .setBackgroundColor(COLOR.gatera);
    this.mini.centerOn(anchoMundo / 2, altoMundo / 2);

    this.input.keyboard!.on("keydown", (e: KeyboardEvent) => this.alApretar(e));

    this.scene.launch("Ayuda");
    this.time.delayedCall(0, () => this.nuevaVida());
  }

  update(_t: number, dtMs: number): void {
    if (this.pausado || this.fase !== "jugando") return;
    const dt = dtMs / 1000;
    const g = niveles.general;

    this.quesito.actualizar(dt, g.velocidadRaton);
    if (this.fase !== "jugando") return; // pudo ganar justo en este paso

    if (NIVEL.siesta) this.actualizarSiesta(dt);
    if (this.siestaRestante <= 0) {
      const enGatera = this.grilla.gateras.some((c) => c.x === this.gato.x && c.y === this.gato.y);
      this.gato.actualizar(dt, g.velocidadRaton * NIVEL.velocidadGato * (enGatera ? g.velocidadGateraGato : 1));
    }

    this.actualizarSprites();
    if (this.seTocan()) this.atrapado();
  }

  // ---------- ciclo de vida ----------

  /** Pone a los dos personajes en su casilla de inicio y hace la cuenta regresiva. */
  private nuevaVida(): void {
    const r = this.grilla.inicioRaton;
    const gi = this.grilla.inicioGato;
    this.quesito = new MovedorGrilla(this.grilla, r.x, r.y);
    this.quesito.alLlegar = (x, y) => this.comer(x, y);
    this.gato = new MovedorGrilla(this.grilla, gi.x, gi.y);
    this.gato.alLlegar = (x, y) => this.gato.pedir(this.decidirGato(x, y));
    this.gato.pedir(this.decidirGato(gi.x, gi.y));
    this.siestaRestante = 0;
    this.proximaSiesta = this.sortearSiesta();

    this.spriteGato.setScale(1).setAlpha(1);
    this.spriteRaton.setScale(1).setAlpha(1);
    this.actualizarSprites();
    this.comer(r.x, r.y);

    const cam = this.cameras.main;
    if (!this.mapaCompleto) cam.startFollow(this.spriteRaton, true, 0.12, 0.12);

    this.fase = "listo";
    this.events.emit("vidas", this.vidas);
    this.events.emit("listo", true);
    this.time.delayedCall(niveles.general.esperaInicioSeg * 1000, () => {
      this.events.emit("listo", false);
      if (this.fase === "listo") this.fase = "jugando";
    });
  }

  private atrapado(): void {
    this.fase = "atrapado";
    this.vidas--;
    this.events.emit("vidas", this.vidas);
    // Tomasito celebra y Quesito desaparece.
    this.tweens.add({ targets: this.spriteGato, scale: 1.35, duration: 180, yoyo: true, repeat: 2 });
    this.tweens.add({ targets: this.spriteRaton, scale: 0.2, alpha: 0, duration: 400 });
    this.time.delayedCall(1600, () => {
      if (this.vidas > 0) this.nuevaVida();
      else this.terminar(false);
    });
  }

  private terminar(gano: boolean): void {
    this.fase = "fin";
    this.events.emit(gano ? "ganaste" : "perdiste", this.despensa.puntaje);
  }

  private alApretar(e: KeyboardEvent): void {
    if (e.code === "Escape") {
      this.scene.stop("Ayuda");
      this.scene.start("Inicio");
      return;
    }
    if (this.fase === "fin") {
      if (e.code === "Space") this.scene.restart();
      return;
    }
    const dir = TECLAS[e.code];
    if (dir && !this.pausado && this.fase !== "atrapado") this.quesito.pedir(dir);
    if (e.code === "KeyM") this.alternarMapa();
    if (e.code === "Space") this.alternarPausa();
  }

  // ---------- gato ----------

  private decidirGato(x: number, y: number): Dir {
    return elegirAzar(this.grilla, { x, y }, this.gato.dir, { x: this.quesito.x, y: this.quesito.y }, NIVEL.probPerseguir);
  }

  private sortearSiesta(): number {
    const [min, max] = NIVEL.siestaCadaSeg;
    return min + Math.random() * (max - min);
  }

  /** Tomasito, cada tanto, se detiene a dormir una siesta corta. */
  private actualizarSiesta(dt: number): void {
    if (this.siestaRestante > 0) {
      this.siestaRestante -= dt;
      if (this.siestaRestante <= 0) {
        this.proximaSiesta = this.sortearSiesta();
        this.events.emit("siesta", false);
      }
      return;
    }
    this.proximaSiesta -= dt;
    if (this.proximaSiesta <= 0) {
      this.siestaRestante = NIVEL.siestaSeg;
      this.events.emit("siesta", true);
    }
  }

  /** ¿Están lo bastante cerca como para que el gato atrape a Quesito? */
  private seTocan(): boolean {
    const a = this.quesito.posicion();
    const b = this.gato.posicion();
    let dx = Math.abs(a.x - b.x);
    dx = Math.min(dx, this.grilla.ancho - dx);
    return Math.hypot(dx, a.y - b.y) < niveles.general.radioAtrapar;
  }

  // ---------- dibujo ----------

  private actualizarSprites(): void {
    const p = this.quesito.posicion();
    this.spriteRaton.setPosition((p.x + 0.5) * T, (p.y + 0.5) * T);
    this.spriteRaton.scaleX = this.quesito.dir === "izquierda" ? -Math.abs(this.spriteRaton.scaleX) : Math.abs(this.spriteRaton.scaleX);

    const q = this.gato.posicion();
    this.spriteGato.setPosition((q.x + 0.5) * T, (q.y + 0.5) * T);
    this.caraGato.setFlipX(this.gato.dir === "derecha");
    // Cabeza flotante: rebota al caminar, quieta al dormir.
    const t = this.time.now / 1000;
    this.caraGato.y = this.siestaRestante > 0 ? -4 : -6 - Math.abs(Math.sin(t * 9)) * 2;
    this.caraGato.rotation = this.siestaRestante > 0 ? 0.35 : Math.sin(t * 4.5) * 0.06;

    // Orden de dibujo por profundidad: el que está más abajo se dibuja delante.
    this.spriteRaton.setDepth(this.spriteRaton.y);
    this.spriteGato.setDepth(this.spriteGato.y);
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
    if (this.despensa.ganado) this.terminar(true);
  }

  // ---------- vista y pausa ----------

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
      cam.pan(this.spriteRaton.x, this.spriteRaton.y, 300, "Sine.easeInOut", false, (_c: Phaser.Cameras.Scene2D.Camera, avance: number) => {
        if (avance === 1 && !this.mapaCompleto) cam.startFollow(this.spriteRaton, true, 0.12, 0.12);
      });
      this.mini.setVisible(true);
    }
  }

  private alternarPausa(): void {
    this.pausado = !this.pausado;
    this.events.emit("pausa", this.pausado);
  }
}
