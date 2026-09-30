import * as Phaser from "phaser";
import { ALTO_PARED, muroInferior, mueblesLiving, pisoLiving, RETRATOS, T } from "../arte/living";
import { crearSticker, crearTexturasBase, texturaDe } from "../arte/texturas";
import { MASCOTAS } from "../config/mascotas";
import niveles from "../config/niveles.json";
import { elegirAzar } from "../ia/azar";
import { MAPA_CASA } from "../mapa/mapas";
import { Despensa } from "../sistemas/Despensa";
import { Grilla, type Dir, type TipoObjeto } from "../sistemas/grilla";
import { MovedorGrilla } from "../sistemas/MovedorGrilla";

const NIVEL = niveles.tomasito;
const COLOR_GATO = MASCOTAS.find((m) => m.clave === "tomasito")!.color;
const MINI = { fondo: 0x3a271b, muro: 0xa87447, piso: 0xe3c49a, raton: 0xf2b93b };
/** Alto en pantalla (píxeles de mundo) de la cabeza del gato y de Quesito. */
const ALTO_GATO = 38;

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

// Nivel 1: el living de Tomasito, en pixel art con vista 3/4.
export class Juego extends Phaser.Scene {
  private grilla!: Grilla;
  private quesito!: MovedorGrilla;
  private gato!: MovedorGrilla;
  private despensa!: Despensa;
  private mundo!: Phaser.GameObjects.Layer;
  private spriteRaton!: Phaser.GameObjects.Image;
  private sombraRaton!: Phaser.GameObjects.Ellipse;
  private spriteGato!: Phaser.GameObjects.Image;
  private sombraGato!: Phaser.GameObjects.Ellipse;
  private marcaRaton!: Phaser.GameObjects.Arc;
  private marcaGato!: Phaser.GameObjects.Arc;
  private mini!: Phaser.Cameras.Scene2D.Camera;
  private dibujosObjetos = new Map<string, Phaser.GameObjects.Image>();
  private fase: Fase = "listo";
  private vidas = 0;
  private mapaCompleto = false;
  private pausado = false;
  private siestaRestante = 0;
  private proximaSiesta = 0;
  private reloj = 0;

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

    // Todo lo que se ve en el mundo va en una capa ordenada por profundidad (y-sort).
    this.mundo = this.add.layer();
    this.dibujarHabitacion();
    this.dibujarObjetos();

    crearTexturasBase(this);
    this.sombraRaton = this.add.ellipse(0, 0, 14, 5, 0x2b170a, 0.3);
    this.spriteRaton = this.add.image(0, 0, "quesito-frente-0").setOrigin(0.5, 1);
    this.sombraGato = this.add.ellipse(0, 0, 26, 8, 0x2b170a, 0.3);
    this.spriteGato = this.add.image(0, 0, crearSticker(this, "tomasito", COLOR_GATO)).setOrigin(0.5, 1);
    this.spriteGato.setScale(ALTO_GATO / this.spriteGato.height);
    this.mundo.add([this.sombraRaton, this.spriteRaton, this.sombraGato, this.spriteGato]);

    const cam = this.cameras.main;
    cam.setBounds(0, -ALTO_PARED, anchoMundo, altoMundo + ALTO_PARED);
    cam.setZoom(niveles.general.zoomCamara);
    cam.setRoundPixels(true);

    this.crearMiniMapa(anchoMundo, altoMundo);

    this.input.keyboard!.on("keydown", (e: KeyboardEvent) => this.alApretar(e));
    this.scene.launch("Ayuda");
    this.time.delayedCall(0, () => this.nuevaVida());
  }

  update(_t: number, dtMs: number): void {
    if (!this.quesito) return; // la primera vida parte un instante después de crear la escena
    const dt = dtMs / 1000;
    this.reloj += dt;
    if (this.pausado || this.fase !== "jugando") {
      this.actualizarSprites(false);
      return;
    }
    const g = niveles.general;

    this.quesito.actualizar(dt, g.velocidadRaton);
    if (this.fase !== "jugando") return; // pudo ganar justo en este paso

    if (NIVEL.siesta) this.actualizarSiesta(dt);
    if (this.siestaRestante <= 0) {
      const enGatera = this.grilla.gateras.some((c) => c.x === this.gato.x && c.y === this.gato.y);
      this.gato.actualizar(dt, g.velocidadRaton * NIVEL.velocidadGato * (enGatera ? g.velocidadGateraGato : 1));
    }

    this.actualizarSprites(!this.quesito.detenido);
    if (this.seTocan()) this.atrapado();
  }

  // ---------- ciclo de vida ----------

  /** Pone a los dos personajes en su casilla de inicio y hace la cuenta regresiva. */
  private nuevaVida(): void {
    const r = this.grilla.inicioRaton;
    const gi = this.grilla.inicioGato;
    this.quesito = new MovedorGrilla(this.grilla, r.x, r.y);
    this.quesito.dir = "abajo";
    this.quesito.alLlegar = (x, y) => this.comer(x, y);
    this.gato = new MovedorGrilla(this.grilla, gi.x, gi.y);
    this.gato.alLlegar = (x, y) => this.gato.pedir(this.decidirGato(x, y));
    this.gato.pedir(this.decidirGato(gi.x, gi.y));
    this.siestaRestante = 0;
    this.proximaSiesta = this.sortearSiesta();

    this.spriteGato.setScale(ALTO_GATO / this.spriteGato.height).setAlpha(1);
    this.spriteRaton.setScale(1).setAlpha(1);
    this.actualizarSprites(false);
    this.comer(r.x, r.y);

    if (!this.mapaCompleto) this.cameras.main.startFollow(this.spriteRaton, true, 0.12, 0.12, 0, 10);

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
    const escala = this.spriteGato.scale;
    this.tweens.add({ targets: this.spriteGato, scale: escala * 1.3, duration: 180, yoyo: true, repeat: 2 });
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

  /** Coloca a los personajes. Los pies van en el centro de la casilla y la profundidad es la altura de los pies. */
  private actualizarSprites(caminando: boolean): void {
    const p = this.quesito.posicion();
    const rx = Math.round((p.x + 0.5) * T);
    const ry = Math.round((p.y + 0.5) * T + 9);
    const d = this.quesito.dir;
    const vista = d === "arriba" ? "espalda" : d === "abajo" ? "frente" : "lado";
    const paso = caminando ? Math.floor(this.reloj * 8) % 2 : 0;
    this.spriteRaton.setTexture(`quesito-${vista}-${paso}`).setFlipX(d === "izquierda");
    this.spriteRaton.setPosition(rx, ry - (caminando ? paso : 0)).setDepth(ry);
    this.sombraRaton.setPosition(rx, ry - 1).setDepth(ry - 0.5);

    const q = this.gato.posicion();
    const gx = (q.x + 0.5) * T;
    const gy = (q.y + 0.5) * T + 10;
    const durmiendo = this.siestaRestante > 0;
    // Cabeza flotante: rebota al caminar y se inclina al dormir.
    this.spriteGato.setPosition(gx, gy - 4 - (durmiendo ? 0 : Math.abs(Math.sin(this.reloj * 9)) * 2));
    this.spriteGato.setRotation(durmiendo ? 0.35 : Math.sin(this.reloj * 4.5) * 0.06);
    this.spriteGato.setFlipX(this.gato.dir === "derecha").setDepth(gy);
    this.sombraGato.setPosition(gx, gy - 1).setDepth(gy - 0.5);

    this.marcaRaton.setPosition(rx, ry - 9);
    this.marcaGato.setPosition(gx, gy - 10);
  }

  /** Piso, paredes, retratos y muebles. Cada mueble se ordena por su base para que los personajes pasen por delante o por detrás. */
  private dibujarHabitacion(): void {
    const { ancho, alto } = this.grilla;
    texturaDe(this, "living-piso", pisoLiving(ancho, alto, this.grilla.gateras[0].y));
    this.mundo.add(this.add.image(0, -ALTO_PARED, "living-piso").setOrigin(0).setDepth(-10000));

    // Retratos de la familia con las fotos en alta resolución
    for (const r of RETRATOS) {
      const foto = this.add.image(r.x + r.w / 2, r.y + r.h / 2, r.clave);
      foto.setScale(Math.min(r.w / foto.width, r.h / foto.height)).setDepth(-9999);
      this.mundo.add(foto);
    }

    mueblesLiving().forEach((m, i) => {
      texturaDe(this, `living-mueble-${i}`, m.lienzo);
      this.mundo.add(this.add.image(m.x, m.y, `living-mueble-${i}`).setOrigin(0).setDepth(m.profundidad));
    });

    texturaDe(this, "living-muro-abajo", muroInferior(ancho));
    this.mundo.add(this.add.image(0, (alto - 1) * T, "living-muro-abajo").setOrigin(0).setDepth(100000));
  }

  private dibujarObjetos(): void {
    crearTexturasBase(this);
    for (const { casilla, tipo } of this.grilla.objetos) {
      const img = this.add.image((casilla.x + 0.5) * T, casilla.y * T + 17, `obj-${tipo}`).setOrigin(0.5, 1);
      // Lo plano va pegado al piso; la caja tiene altura y se ordena con los personajes.
      img.setDepth(tipo === "caja" ? casilla.y * T + 17 : -5000);
      this.mundo.add(img);
      this.dibujosObjetos.set(`${casilla.x},${casilla.y}`, img);
    }
  }

  /** Mini-mapa: una segunda cámara que solo ve un dibujo simplificado del laberinto y dos puntos. */
  private crearMiniMapa(anchoMundo: number, altoMundo: number): void {
    const g = this.add.graphics();
    g.fillStyle(MINI.piso).fillRect(0, 0, anchoMundo, altoMundo);
    for (let y = 0; y < this.grilla.alto; y++)
      for (let x = 0; x < this.grilla.ancho; x++) if (this.grilla.esMuro(x, y)) g.fillStyle(MINI.muro).fillRect(x * T, y * T, T, T);
    this.marcaRaton = this.add.circle(0, 0, 16, MINI.raton).setStrokeStyle(6, 0xffffff);
    this.marcaGato = this.add.circle(0, 0, 18, COLOR_GATO).setStrokeStyle(6, 0xffffff);
    const soloMini = [g, this.marcaRaton, this.marcaGato];

    const anchoMini = 162;
    const zoomMini = anchoMini / anchoMundo;
    this.mini = this.cameras
      .add(this.scale.width - anchoMini - 12, 12, anchoMini, Math.round(altoMundo * zoomMini))
      .setZoom(zoomMini)
      .setBackgroundColor(MINI.fondo);
    this.mini.centerOn(anchoMundo / 2, altoMundo / 2);
    this.mini.ignore(this.mundo);
    this.cameras.main.ignore(soloMini);
  }

  private comer(x: number, y: number): void {
    const tipo = this.despensa.comer(x, y);
    if (!tipo) return;
    const k = `${x},${y}`;
    const dibujo = this.dibujosObjetos.get(k);
    if (dibujo) {
      this.dibujosObjetos.delete(k);
      this.tweens.add({ targets: dibujo, scale: 1.6, alpha: 0, y: dibujo.y - 4, duration: 160, onComplete: () => dibujo.destroy() });
    }
    this.events.emit("puntaje", { puntaje: this.despensa.puntaje, restantes: this.despensa.restantes, tipo: tipo as TipoObjeto });
    if (this.despensa.ganado) this.terminar(true);
  }

  // ---------- vista y pausa ----------

  private alternarMapa(): void {
    this.mapaCompleto = !this.mapaCompleto;
    const cam = this.cameras.main;
    const anchoMundo = this.grilla.ancho * T;
    const altoTotal = this.grilla.alto * T + ALTO_PARED;
    if (this.mapaCompleto) {
      cam.stopFollow();
      const zoom = Math.min(this.scale.width / anchoMundo, this.scale.height / altoTotal);
      cam.zoomTo(zoom, 300, "Sine.easeInOut");
      cam.pan(anchoMundo / 2, altoTotal / 2 - ALTO_PARED, 300, "Sine.easeInOut");
      this.mini.setVisible(false);
    } else {
      cam.zoomTo(niveles.general.zoomCamara, 300, "Sine.easeInOut");
      cam.pan(this.spriteRaton.x, this.spriteRaton.y, 300, "Sine.easeInOut", false, (_c: Phaser.Cameras.Scene2D.Camera, avance: number) => {
        if (avance === 1 && !this.mapaCompleto) cam.startFollow(this.spriteRaton, true, 0.12, 0.12, 0, 10);
      });
      this.mini.setVisible(true);
    }
  }

  private alternarPausa(): void {
    this.pausado = !this.pausado;
    this.events.emit("pausa", this.pausado);
  }
}
