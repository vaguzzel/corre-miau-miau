import * as Phaser from "phaser";
import { ALTO_PARED, muroInferior, mueblesLiving, pisoLiving, RETRATOS, T } from "../arte/living";
import { crearSticker, crearTexturasBase, texturaDe } from "../arte/texturas";
import { MASCOTAS } from "../config/mascotas";
import niveles from "../config/niveles.json";
import { elegirAzar } from "../ia/azar";
import { elegirHuida } from "../ia/huir";
import { MAPA_CASA } from "../mapa/mapas";
import { Despensa } from "../sistemas/Despensa";
import { Escondites } from "../sistemas/Escondites";
import { Grilla, OPUESTA, type Dir, type TipoObjeto } from "../sistemas/grilla";
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
  // Objetos especiales
  private escondites!: Escondites;
  private asustado = 0;
  private volviendo = 0;
  private turbo = 0;
  private claveCafe = "";
  private cafeVisible = false;
  private cafeRestante = 0;
  private cafeUsado = false;
  private totalComible = 0;
  private polvo = 0;
  private ultimoEfecto = "";
  private avisosVistos = new Set<string>();

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
    this.totalComible = this.despensa.restantes;
    const cajas = this.grilla.objetos.filter((o) => o.tipo === "caja").map((o) => o.casilla);
    this.escondites = new Escondites(cajas, niveles.general.cajaUsosPorVida, niveles.general.cajaSeg);
    const cafe = this.grilla.objetos.find((o) => o.tipo === "cafe")!.casilla;
    this.claveCafe = `${cafe.x},${cafe.y}`;
    this.cafeVisible = false;
    this.cafeUsado = false;
    this.ultimoEfecto = "";
    const anchoMundo = this.grilla.ancho * T;
    const altoMundo = this.grilla.alto * T;

    // Todo lo que se ve en el mundo va en una capa ordenada por profundidad (y-sort).
    this.mundo = this.add.layer();
    this.dibujarHabitacion();
    this.dibujarObjetos();
    // El cafecito aparece recién a mitad del nivel.
    this.dibujosObjetos.get(this.claveCafe)?.setVisible(false);

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

    // Relojes de los objetos especiales
    if (this.turbo > 0) this.turbo -= dt;
    if (this.escondites.actualizar(dt)) this.avisar("asomo", "Se acabó el escondite: Quesito quedó a la vista.");
    if (this.cafeVisible) {
      this.cafeRestante -= dt;
      if (this.cafeRestante <= 0) this.ocultarCafe();
    }

    // Quesito
    this.quesito.actualizar(dt, g.velocidadRaton * (this.turbo > 0 ? g.turbo : 1));
    if (this.fase !== "jugando") return; // pudo ganar justo en este paso
    if (this.escondites.escondido && this.quesito.progreso > 0) this.escondites.salir();
    if (this.turbo > 0 && !this.quesito.detenido) this.soltarPolvo(dt);

    // Gato
    if (this.volviendo > 0) {
      this.volviendo -= dt;
      if (this.volviendo <= 0) this.gatoVuelve();
    } else {
      if (this.asustado > 0) {
        this.asustado -= dt;
        if (this.asustado <= 0) this.avisar("", "Tomasito ya no tiene miedo.");
      } else if (NIVEL.siesta) this.actualizarSiesta(dt);
      if (this.siestaRestante <= 0) {
        const enGatera = this.grilla.gateras.some((c) => c.x === this.gato.x && c.y === this.gato.y);
        const miedo = this.asustado > 0 ? g.gatoAsustadoVelocidad : 1;
        this.gato.actualizar(dt, g.velocidadRaton * NIVEL.velocidadGato * miedo * (enGatera ? g.velocidadGateraGato : 1));
      }
    }

    this.actualizarSprites(!this.quesito.detenido);
    this.informarEfectos();
    if (this.volviendo <= 0 && !this.escondites.escondido && this.seTocan()) {
      if (this.asustado > 0) this.tocarGatoAsustado();
      else this.atrapado();
    }
  }

  // ---------- ciclo de vida ----------

  /** Pone a los dos personajes en su casilla de inicio y hace la cuenta regresiva. */
  private nuevaVida(): void {
    const r = this.grilla.inicioRaton;
    const gi = this.grilla.inicioGato;
    this.quesito = new MovedorGrilla(this.grilla, r.x, r.y);
    this.quesito.dir = "abajo";
    this.quesito.alLlegar = (x, y) => this.comer(x, y);
    this.crearGato(gi.x, gi.y);
    this.siestaRestante = 0;
    this.proximaSiesta = this.sortearSiesta();
    this.escondites.reiniciar();
    this.asustado = 0;
    this.volviendo = 0;
    this.turbo = 0;

    this.spriteGato.setScale(ALTO_GATO / this.spriteGato.height).setAlpha(1).clearTint();
    this.sombraGato.setVisible(true);
    this.spriteRaton.setScale(1).setAlpha(1);
    this.actualizarSprites(false);
    this.comer(r.x, r.y);

    if (!this.mapaCompleto) this.cameras.main.startFollow(this.spriteRaton, true, 0.12, 0.12, 0, 10);

    this.fase = "listo";
    this.avisar(
      "inicio",
      "Come todo el queso sin que Tomasito te atrape.  Pepino: lo asusta.  Caja: te escondes.  Cafecito (aparece a la mitad): turbo.",
    );
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

  private crearGato(x: number, y: number): void {
    this.gato = new MovedorGrilla(this.grilla, x, y);
    this.gato.alLlegar = (cx, cy) => this.gato.pedir(this.decidirGato(cx, cy));
    this.gato.pedir(this.decidirGato(x, y));
  }

  /** Asustado: huye. Quesito escondido: el gato no lo ve y pasea al azar. Si no: persigue. */
  private decidirGato(x: number, y: number): Dir {
    const raton = { x: this.quesito.x, y: this.quesito.y };
    if (this.asustado > 0) return elegirHuida(this.grilla, { x, y }, this.gato.dir, raton);
    const prob = this.escondites.escondido ? 0 : NIVEL.probPerseguir;
    return elegirAzar(this.grilla, { x, y }, this.gato.dir, raton, prob);
  }

  /** Pepino: el gato se asusta, despierta si dormía y se da vuelta de inmediato. */
  private asustarGato(): void {
    if (this.volviendo > 0) return;
    this.asustado = NIVEL.pepinoSeg;
    this.siestaRestante = 0;
    this.events.emit("siesta", false);
    this.gato.pedir(OPUESTA[this.gato.dir]);
    this.avisar("pepino", "¡Pepino! Tomasito se asustó y huye. Tócalo para mandarlo a su cama (+200).");
  }

  /** Quesito toca al gato asustado: puntos extra y el gato vuelve a su cama un rato. */
  private tocarGatoAsustado(): void {
    const g = niveles.general;
    this.despensa.sumar(g.puntosTocarGato);
    this.events.emit("puntaje", { puntaje: this.despensa.puntaje, restantes: this.despensa.restantes });
    this.textoFlotante(this.spriteGato.x, this.spriteGato.y - 34, `+${g.puntosTocarGato}`);
    this.asustado = 0;
    this.volviendo = g.gatoVuelveSeg;
    this.sombraGato.setVisible(false);
    this.tweens.add({ targets: this.spriteGato, alpha: 0, scale: this.spriteGato.scale * 0.3, duration: 300 });
    this.avisar("cama", "¡Tomasito corrió a su cama! Vuelve en unos segundos.");
  }

  private gatoVuelve(): void {
    const gi = this.grilla.inicioGato;
    this.crearGato(gi.x, gi.y);
    this.spriteGato.clearTint().setScale(ALTO_GATO / this.spriteGato.height).setAlpha(0);
    this.sombraGato.setVisible(true);
    this.tweens.add({ targets: this.spriteGato, alpha: 1, duration: 400 });
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
    if (this.escondites?.escondido) {
      // Dentro de la caja: se dibuja justo detrás de ella, así solo se le ven las orejas.
      const baseCaja = Math.round(p.y * T + 17);
      this.spriteRaton.setTexture("quesito-frente-0").setFlipX(false);
      this.spriteRaton.setPosition(rx, baseCaja - 3 + Math.round(Math.sin(this.reloj * 3))).setDepth(baseCaja - 1);
      this.sombraRaton.setVisible(false);
    } else {
      this.spriteRaton.setTexture(`quesito-${vista}-${paso}`).setFlipX(d === "izquierda");
      this.spriteRaton.setPosition(rx, ry - (caminando ? paso : 0)).setDepth(ry);
      this.sombraRaton.setVisible(true).setPosition(rx, ry - 1).setDepth(ry - 0.5);
    }

    const q = this.gato.posicion();
    const gx = (q.x + 0.5) * T;
    const gy = (q.y + 0.5) * T + 10;
    const durmiendo = this.siestaRestante > 0;
    const miedo = this.asustado > 0;
    // Cabeza flotante: rebota al caminar, se inclina al dormir y tiembla si está asustado.
    const temblor = miedo ? Math.sin(this.reloj * 60) * 0.12 : 0;
    this.spriteGato.setPosition(gx, gy - 4 - (durmiendo ? 0 : Math.abs(Math.sin(this.reloj * 9)) * 2));
    this.spriteGato.setRotation(durmiendo ? 0.35 : Math.sin(this.reloj * 4.5) * 0.06 + temblor);
    this.spriteGato.setFlipX(this.gato.dir === "derecha").setDepth(gy);
    if (miedo) {
      this.spriteGato.setTint(0x9fc6ff);
      // Los últimos 2 segundos parpadea: el susto se le está pasando.
      if (this.volviendo <= 0) this.spriteGato.setAlpha(this.asustado < 2 && Math.floor(this.reloj * 8) % 2 ? 0.45 : 1);
    } else if (this.volviendo <= 0) {
      this.spriteGato.clearTint();
      if (this.fase !== "atrapado") this.spriteGato.setAlpha(1);
    }
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

  /** Quesito llega a una casilla: se come lo que haya, o se mete en la caja. */
  private comer(x: number, y: number): void {
    const k = `${x},${y}`;
    if (this.escondites.entrar(x, y)) return this.entrarCaja(k);
    if (k === this.claveCafe && !this.cafeVisible) return; // el cafecito todavía no aparece (o ya se fue)

    const tipo = this.despensa.comer(x, y);
    if (!tipo) return;
    const dibujo = this.dibujosObjetos.get(k);
    if (dibujo) {
      this.dibujosObjetos.delete(k);
      this.tweens.add({ targets: dibujo, scale: 1.6, alpha: 0, y: dibujo.y - 4, duration: 160, onComplete: () => dibujo.destroy() });
    }
    this.events.emit("puntaje", { puntaje: this.despensa.puntaje, restantes: this.despensa.restantes, tipo: tipo as TipoObjeto });

    if (tipo === "pepino") this.asustarGato();
    if (tipo === "cafe") {
      this.cafeVisible = false;
      this.turbo = niveles.general.turboSeg;
      this.avisar("cafe", "¡Cafecito! Quesito corre más rápido por 5 segundos.");
    }
    if (!this.cafeUsado && this.despensa.restantes <= this.totalComible * niveles.general.cafeApareceAlQuedar) this.mostrarCafe();
    if (this.despensa.ganado) this.terminar(true);
  }

  private entrarCaja(k: string): void {
    this.quesito.detener();
    const caja = this.dibujosObjetos.get(k);
    if (caja) this.tweens.add({ targets: caja, angle: { from: -8, to: 0 }, duration: 250, ease: "Back.easeOut" });
    const usos = this.escondites.usosDe(Number(k.split(",")[0]), Number(k.split(",")[1]));
    this.avisar(
      "caja",
      `Quesito se escondió en la caja: el gato ya no lo ve. Quédate quieto hasta 4 s; muévete para salir. (Esta caja: ${usos} uso${usos === 1 ? "" : "s"} más)`,
      true,
    );
  }

  /** El cafecito aparece una sola vez por nivel, cuando queda la mitad del queso, y dura unos segundos. */
  private mostrarCafe(): void {
    this.cafeUsado = true;
    this.cafeVisible = true;
    this.cafeRestante = niveles.general.cafeDuraSeg;
    const img = this.dibujosObjetos.get(this.claveCafe);
    if (img) {
      img.setVisible(true).setScale(0);
      this.tweens.add({ targets: img, scale: 1, duration: 400, ease: "Back.easeOut" });
    }
    this.avisar("cafe-aparece", `¡Apareció un cafecito en el centro! Se va en ${niveles.general.cafeDuraSeg} segundos.`, true);
  }

  private ocultarCafe(): void {
    this.cafeVisible = false;
    const img = this.dibujosObjetos.get(this.claveCafe);
    if (img) this.tweens.add({ targets: img, scale: 0, duration: 250, onComplete: () => img.setVisible(false) });
  }

  // ---------- avisos y efectos ----------

  /**
   * Muestra un mensaje en pantalla. Con `clave`, el mensaje solo sale la primera vez en la sesión
   * (sirve de tutorial); `siempre` lo muestra de nuevo cada vez.
   */
  private avisar(clave: string, texto: string, siempre = false): void {
    if (clave && !siempre && this.avisosVistos.has(clave)) return;
    if (clave) this.avisosVistos.add(clave);
    this.events.emit("aviso", texto);
  }

  /** Mantiene al día el cartelito de efectos activos (turbo, pepino, escondite). */
  private informarEfectos(): void {
    const partes: string[] = [];
    if (this.turbo > 0) partes.push(`☕ Turbo ${Math.ceil(this.turbo)} s`);
    if (this.asustado > 0) partes.push(`🥒 Tomasito asustado ${Math.ceil(this.asustado)} s`);
    if (this.escondites.escondido) partes.push(`📦 Escondido ${Math.ceil(this.escondites.restante)} s`);
    if (this.volviendo > 0) partes.push(`Tomasito en su cama ${Math.ceil(this.volviendo)} s`);
    if (this.cafeVisible) partes.push(`Cafecito disponible ${Math.ceil(this.cafeRestante)} s`);
    const texto = partes.join("   ·   ");
    if (texto !== this.ultimoEfecto) {
      this.ultimoEfecto = texto;
      this.events.emit("efectos", texto);
    }
  }

  private textoFlotante(x: number, y: number, texto: string): void {
    const t = this.add
      .text(x, y, texto, { fontFamily: "Trebuchet MS, sans-serif", fontSize: "11px", color: "#ffffff", stroke: "#2b1d16", strokeThickness: 3, fontStyle: "bold" })
      .setOrigin(0.5)
      .setResolution(4)
      .setDepth(200000);
    this.mundo.add(t);
    this.tweens.add({ targets: t, y: y - 16, alpha: 0, duration: 1000, onComplete: () => t.destroy() });
  }

  /** Estela de polvo detrás de Quesito mientras dura el turbo. */
  private soltarPolvo(dt: number): void {
    this.polvo -= dt;
    if (this.polvo > 0) return;
    this.polvo = 0.06;
    const p = this.add.ellipse(this.spriteRaton.x, this.spriteRaton.y - 2, 6, 3, 0xfff6d6, 0.8).setDepth(this.spriteRaton.depth - 1);
    this.mundo.add(p);
    this.tweens.add({ targets: p, alpha: 0, scale: 2, duration: 350, onComplete: () => p.destroy() });
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
