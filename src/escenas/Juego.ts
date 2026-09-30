import * as Phaser from "phaser";
import { ALTO_PARED, T } from "../arte/habitacion";
import { crearSticker, crearTexturasBase, texturaDe } from "../arte/texturas";
import { MASCOTAS } from "../config/mascotas";
import niveles from "../config/niveles.json";
import { t } from "../i18n/textos";
import { casillaAdelante, primerPasoAEstrella } from "../ia/astar";
import { elegirAzar } from "../ia/azar";
import { primerPasoBFS } from "../ia/bfs";
import { elegirHuida } from "../ia/huir";
import { HorarioModos } from "../ia/modos";
import { MAPA_CASA } from "../mapa/mapas";
import { NIVELES, type ClaveNivel, type DefNivel } from "../niveles/niveles";
import { Despensa } from "../sistemas/Despensa";
import { Escondites } from "../sistemas/Escondites";
import { Grilla, OPUESTA, type Dir } from "../sistemas/grilla";
import { marcarCompletado, registrarPuntaje } from "../sistemas/Guardado";
import { MovedorGrilla } from "../sistemas/MovedorGrilla";
import { sonido } from "../sistemas/Sonido";

const G = niveles.general;
const MINI_RATON = 0xf2b93b;
/** Alto en pantalla (píxeles de mundo) de la cabeza del gato. */
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

/** Un nivel con persecución: Tomasito (living), Begoña (cocina) o Eren (jardín). */
export class Juego extends Phaser.Scene {
  private nivel!: DefNivel;
  private grilla!: Grilla;
  private quesito!: MovedorGrilla;
  private gato!: MovedorGrilla;
  private despensa!: Despensa;
  private escondites!: Escondites;
  private horario!: HorarioModos;
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
  private proximaVidaExtra = 0;
  private mapaCompleto = false;
  private pausado = false;
  private siestaRestante = 0;
  private proximaSiesta = 0;
  private reloj = 0;
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
  private toque: { x: number; y: number } | null = null;

  constructor() {
    super("Juego");
  }

  init(datos: { nivel?: ClaveNivel }): void {
    this.nivel = NIVELES[datos.nivel ?? "tomasito"];
  }

  create(): void {
    // `create` también corre al reiniciar la escena, así que el estado se limpia aquí.
    this.mapaCompleto = false;
    this.pausado = false;
    this.vidas = G.vidas;
    this.proximaVidaExtra = G.vidaExtraCada;
    this.dibujosObjetos.clear();
    this.quesito = undefined as unknown as MovedorGrilla;

    this.grilla = new Grilla(MAPA_CASA);
    this.despensa = new Despensa(this.grilla.objetos, G.puntos);
    this.totalComible = this.despensa.restantes;
    const cajas = this.grilla.objetos.filter((o) => o.tipo === "caja").map((o) => o.casilla);
    this.escondites = new Escondites(cajas, G.cajaUsosPorVida, G.cajaSeg);
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
    this.dibujosObjetos.get(this.claveCafe)?.setVisible(false);

    crearTexturasBase(this);
    const color = MASCOTAS.find((m) => m.clave === this.nivel.clave)!.color;
    this.sombraRaton = this.add.ellipse(0, 0, 14, 5, 0x2b170a, 0.3);
    this.spriteRaton = this.add.image(0, 0, "quesito-frente-0").setOrigin(0.5, 1);
    this.sombraGato = this.add.ellipse(0, 0, 26, 8, 0x2b170a, 0.3);
    this.spriteGato = this.add.image(0, 0, crearSticker(this, this.nivel.clave, color)).setOrigin(0.5, 1);
    this.spriteGato.setScale(ALTO_GATO / this.spriteGato.height);
    this.mundo.add([this.sombraRaton, this.spriteRaton, this.sombraGato, this.spriteGato]);

    const cam = this.cameras.main;
    cam.setBounds(0, -ALTO_PARED, anchoMundo, altoMundo + ALTO_PARED);
    cam.setZoom(G.zoomCamara);
    cam.setRoundPixels(true);
    this.crearMiniMapa(anchoMundo, altoMundo, color);

    this.input.keyboard!.on("keydown", (e: KeyboardEvent) => this.alApretar(e));
    this.prepararToque();
    this.scene.launch("Ayuda", { gato: this.nivel.gato });
    sonido.iniciarMusica();
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

    // Relojes de los objetos especiales
    if (this.turbo > 0) this.turbo -= dt;
    if (this.escondites.actualizar(dt)) this.avisar("asomo", t("avisoAsomo"));
    if (this.cafeVisible) {
      this.cafeRestante -= dt;
      if (this.cafeRestante <= 0) this.ocultarCafe();
    }

    // Quesito
    this.quesito.actualizar(dt, G.velocidadRaton * (this.turbo > 0 ? G.turbo : 1));
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
        if (this.asustado <= 0) this.avisar("", t("avisoSinMiedo", { g: this.nivel.gato }));
      } else {
        if (this.nivel.config.siesta) this.actualizarSiesta(dt);
        if (this.horario.actualizar(dt)) this.cambioDeModo();
      }
      if (this.siestaRestante <= 0) {
        const enGatera = this.grilla.gateras.some((c) => c.x === this.gato.x && c.y === this.gato.y);
        const miedo = this.asustado > 0 ? G.gatoAsustadoVelocidad : 1;
        this.gato.actualizar(dt, G.velocidadRaton * this.nivel.config.velocidadGato * miedo * (enGatera ? G.velocidadGateraGato : 1));
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
    this.horario = new HorarioModos(this.nivel.config.modos);
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
    this.avisar(`inicio-${this.nivel.clave}`, t("avisoInicio", { g: this.nivel.gato }));
    this.events.emit("vidas", this.vidas);
    this.events.emit("listo", true);
    this.time.delayedCall(G.esperaInicioSeg * 1000, () => {
      this.events.emit("listo", false);
      if (this.fase === "listo") this.fase = "jugando";
    });
  }

  private atrapado(): void {
    this.fase = "atrapado";
    this.vidas--;
    sonido.efecto("atrapado");
    this.events.emit("vidas", this.vidas);
    // El gato celebra y Quesito desaparece.
    const escala = this.spriteGato.scale;
    this.tweens.add({ targets: this.spriteGato, scale: escala * 1.3, duration: 180, yoyo: true, repeat: 2 });
    this.tweens.add({ targets: this.spriteRaton, scale: 0.2, alpha: 0, duration: 400 });
    this.cameras.main.shake(200, 0.004);
    this.time.delayedCall(1600, () => {
      if (this.vidas > 0) this.nuevaVida();
      else this.terminar(false);
    });
  }

  private terminar(gano: boolean): void {
    this.fase = "fin";
    const record = registrarPuntaje(this.nivel.clave, this.despensa.puntaje);
    if (gano) {
      marcarCompletado(this.nivel.clave);
      sonido.efecto("ganar");
      const total = (this.registry.get("puntajeTotal") as number | undefined) ?? 0;
      this.registry.set("puntajeTotal", total + this.despensa.puntaje);
    }
    this.events.emit(gano ? "ganaste" : "perdiste", { puntaje: this.despensa.puntaje, record, ultimo: this.nivel.siguiente === "violeta" });
  }

  private irAlMenu(): void {
    this.scene.stop("Ayuda");
    this.scene.start("Inicio");
  }

  private alApretar(e: KeyboardEvent): void {
    if (e.code === "KeyN") {
      this.events.emit("sonido", sonido.alternarSonido());
      return;
    }
    if (e.code === "Escape") return this.irAlMenu();
    if (this.fase === "fin") {
      if (e.code === "Space") this.despuesDelFinal();
      return;
    }
    const dir = TECLAS[e.code];
    if (dir && !this.pausado && this.fase !== "atrapado") this.quesito.pedir(dir);
    if (e.code === "KeyM") this.alternarMapa();
    if (e.code === "Space") this.alternarPausa();
  }

  /** Tras ganar: siguiente nivel (o Violeta). Tras perder: reintentar. */
  private despuesDelFinal(): void {
    if (!this.despensa.ganado) {
      this.scene.restart({ nivel: this.nivel.clave });
      return;
    }
    this.scene.stop("Ayuda");
    if (this.nivel.siguiente === "violeta") this.scene.start("Violeta");
    else this.scene.start("Juego", { nivel: this.nivel.siguiente });
  }

  // ---------- controles táctiles ----------

  /** Deslizar el dedo mueve a Quesito; los botones de la interfaz hacen el resto. */
  private prepararToque(): void {
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      this.toque = { x: p.x, y: p.y };
    });
    this.input.on("pointerup", (p: Phaser.Input.Pointer) => {
      if (!this.toque) return;
      const dx = p.x - this.toque.x;
      const dy = p.y - this.toque.y;
      this.toque = null;
      if (Math.hypot(dx, dy) < 24) {
        if (this.fase === "fin") this.despuesDelFinal();
        return;
      }
      const dir: Dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "derecha" : "izquierda") : dy > 0 ? "abajo" : "arriba";
      if (!this.pausado && this.fase !== "atrapado" && this.fase !== "fin") this.quesito.pedir(dir);
    });
    const ayuda = this.scene.get("Ayuda");
    ayuda.events.off("boton");
    ayuda.events.on("boton", (b: string) => {
      if (b === "pausa" && this.fase !== "fin") this.alternarPausa();
      if (b === "mapa") this.alternarMapa();
      if (b === "sonido") this.events.emit("sonido", sonido.alternarSonido());
      if (b === "menu") this.irAlMenu();
    });
  }

  // ---------- gato ----------

  private crearGato(x: number, y: number): void {
    this.gato = new MovedorGrilla(this.grilla, x, y);
    this.gato.alLlegar = (cx, cy) => this.gato.pedir(this.decidirGato(cx, cy));
    this.gato.pedir(this.decidirGato(x, y));
  }

  /**
   * Cerebro del gato. Por orden de prioridad:
   * asustado → huye · Quesito escondido → pasea al azar · patrullando → va a su rincón · cazando → según su IA.
   */
  private decidirGato(x: number, y: number): Dir {
    const aqui = { x, y };
    const raton = { x: this.quesito.x, y: this.quesito.y };
    const atras = OPUESTA[this.gato.dir];
    const c = this.nivel.config;
    if (this.asustado > 0) return elegirHuida(this.grilla, aqui, this.gato.dir, raton);
    if (this.escondites.escondido) return elegirAzar(this.grilla, aqui, this.gato.dir, raton, 0);
    if (this.horario.modo === "patrullar") {
      const esquina = { x: c.esquina[0], y: c.esquina[1] };
      return primerPasoBFS(this.grilla, aqui, esquina, atras) ?? elegirAzar(this.grilla, aqui, this.gato.dir, raton, 0);
    }
    switch (c.ia) {
      case "azar":
        return elegirAzar(this.grilla, aqui, this.gato.dir, raton, c.probPerseguir);
      case "bfs":
        return primerPasoBFS(this.grilla, aqui, raton, atras) ?? elegirAzar(this.grilla, aqui, this.gato.dir, raton, 0);
      case "astar": {
        const meta = casillaAdelante(this.grilla, raton, this.quesito.dir, c.adelanto ?? 4);
        const destino = meta.x === x && meta.y === y ? raton : meta;
        return primerPasoAEstrella(this.grilla, aqui, destino, atras) ?? elegirAzar(this.grilla, aqui, this.gato.dir, raton, 0);
      }
    }
  }

  /** Al cambiar entre patrullar y cazar, el gato se da vuelta (como en Pac-Man): así se nota el cambio. */
  private cambioDeModo(): void {
    this.gato.pedir(OPUESTA[this.gato.dir]);
    const clave = this.horario.modo === "patrullar" ? "patrulla" : "caza";
    this.avisar(`${clave}-${this.nivel.clave}`, t(clave, { g: this.nivel.gato }), true);
  }

  /** Pepino: el gato se asusta, despierta si dormía y se da vuelta de inmediato. */
  private asustarGato(): void {
    if (this.volviendo > 0) return;
    this.asustado = this.nivel.config.pepinoSeg;
    this.siestaRestante = 0;
    this.events.emit("siesta", false);
    this.gato.pedir(OPUESTA[this.gato.dir]);
    sonido.efecto("pepino");
    this.avisar("pepino", t("avisoPepino", { g: this.nivel.gato }));
  }

  /** Quesito toca al gato asustado: puntos extra y el gato vuelve a su cama un rato. */
  private tocarGatoAsustado(): void {
    this.sumarPuntos(G.puntosTocarGato);
    this.textoFlotante(this.spriteGato.x, this.spriteGato.y - 34, `+${G.puntosTocarGato}`);
    this.asustado = 0;
    this.volviendo = G.gatoVuelveSeg;
    this.sombraGato.setVisible(false);
    sonido.efecto("tocarGato");
    this.tweens.add({ targets: this.spriteGato, alpha: 0, scale: this.spriteGato.scale * 0.3, duration: 300 });
    this.avisar("cama", t("avisoCama", { g: this.nivel.gato }));
  }

  private gatoVuelve(): void {
    const gi = this.grilla.inicioGato;
    this.crearGato(gi.x, gi.y);
    this.spriteGato.clearTint().setScale(ALTO_GATO / this.spriteGato.height).setAlpha(1);
    this.sombraGato.setVisible(true);
  }

  private sortearSiesta(): number {
    const [min, max] = this.nivel.config.siestaCadaSeg;
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
      this.siestaRestante = this.nivel.config.siestaSeg;
      this.events.emit("siesta", true);
    }
  }

  /** ¿Están lo bastante cerca como para que el gato atrape a Quesito? */
  private seTocan(): boolean {
    const a = this.quesito.posicion();
    const b = this.gato.posicion();
    let dx = Math.abs(a.x - b.x);
    dx = Math.min(dx, this.grilla.ancho - dx);
    return Math.hypot(dx, a.y - b.y) < G.radioAtrapar;
  }

  // ---------- comer y objetos especiales ----------

  private sumarPuntos(p: number): void {
    this.despensa.sumar(p);
    this.revisarVidaExtra();
    this.events.emit("puntaje", { puntaje: this.despensa.puntaje, restantes: this.despensa.restantes });
  }

  /** Una vida extra cada 10.000 puntos. */
  private revisarVidaExtra(): void {
    while (this.despensa.puntaje >= this.proximaVidaExtra) {
      this.proximaVidaExtra += G.vidaExtraCada;
      this.vidas++;
      sonido.efecto("vidaExtra");
      this.events.emit("vidas", this.vidas);
      this.avisar("", t("avisoVidaExtra"));
    }
  }

  /** Quesito llega a una casilla: se come lo que haya, o se mete en la caja. */
  private comer(x: number, y: number): void {
    const k = `${x},${y}`;
    if (this.escondites.entrar(x, y)) return this.entrarCaja(k, x, y);
    if (k === this.claveCafe && !this.cafeVisible) return; // el cafecito todavía no aparece (o ya se fue)

    const tipo = this.despensa.comer(x, y);
    if (!tipo) return;
    const dibujo = this.dibujosObjetos.get(k);
    if (dibujo) {
      this.dibujosObjetos.delete(k);
      this.tweens.add({ targets: dibujo, scale: 1.6, alpha: 0, y: dibujo.y - 4, duration: 160, onComplete: () => dibujo.destroy() });
    }
    if (tipo === "queso") sonido.efecto("comer");
    this.revisarVidaExtra();
    this.events.emit("puntaje", { puntaje: this.despensa.puntaje, restantes: this.despensa.restantes });

    if (tipo === "pepino") this.asustarGato();
    if (tipo === "cafe") {
      this.cafeVisible = false;
      this.turbo = G.turboSeg;
      sonido.efecto("cafe");
      this.avisar("cafe", t("avisoCafe"));
    }
    if (!this.cafeUsado && this.despensa.restantes <= this.totalComible * G.cafeApareceAlQuedar) this.mostrarCafe();
    if (this.despensa.ganado) this.terminar(true);
  }

  private entrarCaja(k: string, x: number, y: number): void {
    this.quesito.detener();
    sonido.efecto("caja");
    const caja = this.dibujosObjetos.get(k);
    if (caja) this.tweens.add({ targets: caja, angle: { from: -8, to: 0 }, duration: 250, ease: "Back.easeOut" });
    this.avisar("caja", t("avisoCaja", { g: this.nivel.gato, u: this.escondites.usosDe(x, y) }), true);
  }

  /** El cafecito aparece una sola vez por nivel, cuando queda la mitad del queso, y dura unos segundos. */
  private mostrarCafe(): void {
    this.cafeUsado = true;
    this.cafeVisible = true;
    this.cafeRestante = G.cafeDuraSeg;
    const img = this.dibujosObjetos.get(this.claveCafe);
    if (img) {
      img.setVisible(true).setScale(0);
      this.tweens.add({ targets: img, scale: 1, duration: 400, ease: "Back.easeOut" });
    }
    this.avisar("cafe-aparece", t("avisoCafeAparece", { s: G.cafeDuraSeg }), true);
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
    const g = this.nivel.gato;
    const partes: string[] = [];
    if (this.turbo > 0) partes.push("☕ " + t("efTurbo", { s: Math.ceil(this.turbo) }));
    if (this.asustado > 0) partes.push("🥒 " + t("efAsustado", { g, s: Math.ceil(this.asustado) }));
    if (this.escondites.escondido) partes.push("📦 " + t("efEscondido", { s: Math.ceil(this.escondites.restante) }));
    if (this.volviendo > 0) partes.push(t("efCama", { g, s: Math.ceil(this.volviendo) }));
    if (this.cafeVisible) partes.push(t("efCafe", { s: Math.ceil(this.cafeRestante) }));
    const texto = partes.join("   ·   ");
    if (texto !== this.ultimoEfecto) {
      this.ultimoEfecto = texto;
      this.events.emit("efectos", texto);
    }
  }

  private textoFlotante(x: number, y: number, texto: string): void {
    const txt = this.add
      .text(x, y, texto, { fontFamily: "Trebuchet MS, sans-serif", fontSize: "11px", color: "#ffffff", stroke: "#2b1d16", strokeThickness: 3, fontStyle: "bold" })
      .setOrigin(0.5)
      .setResolution(4)
      .setDepth(200000);
    this.mundo.add(txt);
    this.tweens.add({ targets: txt, y: y - 16, alpha: 0, duration: 1000, onComplete: () => txt.destroy() });
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

  // ---------- dibujo ----------

  /** Coloca a los personajes. Los pies van en el centro de la casilla y la profundidad es la altura de los pies. */
  private actualizarSprites(caminando: boolean): void {
    const p = this.quesito.posicion();
    const rx = Math.round((p.x + 0.5) * T);
    const ry = Math.round((p.y + 0.5) * T + 9);
    const d = this.quesito.dir;
    const vista = d === "arriba" ? "espalda" : d === "abajo" ? "frente" : "lado";
    const paso = caminando ? Math.floor(this.reloj * 8) % 2 : 0;
    if (this.escondites.escondido) {
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
      this.spriteGato.setAlpha(this.asustado < 2 && Math.floor(this.reloj * 8) % 2 ? 0.45 : 1);
    } else if (this.volviendo <= 0) {
      this.spriteGato.clearTint();
      if (this.fase !== "atrapado") this.spriteGato.setAlpha(1);
    }
    this.sombraGato.setPosition(gx, gy - 1).setDepth(gy - 0.5);

    this.marcaRaton.setPosition(rx, ry - 9);
    this.marcaGato.setPosition(gx, gy - 10).setVisible(this.volviendo <= 0);
  }

  /** Piso, paredes, fotos y muebles. Cada mueble se ordena por su base para que los personajes pasen por delante o por detrás. */
  private dibujarHabitacion(): void {
    const { ancho, alto } = this.grilla;
    const hab = this.nivel.habitacion(this.grilla);
    const c = this.nivel.clave;
    texturaDe(this, `${c}-piso`, hab.piso(ancho, alto, this.grilla.gateras[0].y));
    this.mundo.add(this.add.image(0, -ALTO_PARED, `${c}-piso`).setOrigin(0).setDepth(-10000));

    for (const r of hab.fotos) {
      const foto = this.add.image(r.x + r.w / 2, r.y + r.h / 2, r.clave);
      foto.setScale(Math.min(r.w / foto.width, r.h / foto.height)).setDepth(-9999);
      this.mundo.add(foto);
    }

    hab.muebles().forEach((m, i) => {
      texturaDe(this, `${c}-mueble-${i}`, m.lienzo);
      this.mundo.add(this.add.image(m.x, m.y, `${c}-mueble-${i}`).setOrigin(0).setDepth(m.profundidad));
    });

    texturaDe(this, `${c}-muro-abajo`, hab.muroInferior(ancho));
    this.mundo.add(this.add.image(0, (alto - 1) * T, `${c}-muro-abajo`).setOrigin(0).setDepth(100000));
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
  private crearMiniMapa(anchoMundo: number, altoMundo: number, colorGato: number): void {
    const hab = this.nivel.habitacion(this.grilla);
    const g = this.add.graphics();
    g.fillStyle(hab.mini.piso).fillRect(0, 0, anchoMundo, altoMundo);
    for (let y = 0; y < this.grilla.alto; y++)
      for (let x = 0; x < this.grilla.ancho; x++) if (this.grilla.esMuro(x, y)) g.fillStyle(hab.mini.muro).fillRect(x * T, y * T, T, T);
    this.marcaRaton = this.add.circle(0, 0, 16, MINI_RATON).setStrokeStyle(6, 0xffffff);
    this.marcaGato = this.add.circle(0, 0, 18, colorGato).setStrokeStyle(6, 0xffffff);
    const soloMini = [g, this.marcaRaton, this.marcaGato];

    const anchoMini = 162;
    const zoomMini = anchoMini / anchoMundo;
    this.mini = this.cameras
      .add(this.scale.width - anchoMini - 12, 12, anchoMini, Math.round(altoMundo * zoomMini))
      .setZoom(zoomMini)
      .setBackgroundColor(0x3a271b);
    this.mini.centerOn(anchoMundo / 2, altoMundo / 2);
    this.mini.ignore(this.mundo);
    this.cameras.main.ignore(soloMini);
  }

  // ---------- vista y pausa ----------

  private alternarMapa(): void {
    this.mapaCompleto = !this.mapaCompleto;
    const cam = this.cameras.main;
    const anchoMundo = this.grilla.ancho * T;
    const altoTotal = this.grilla.alto * T + ALTO_PARED;
    if (this.mapaCompleto) {
      cam.stopFollow();
      // Sin límites, para poder centrar el mapa aunque la pantalla sea más ancha que él.
      cam.removeBounds();
      const zoom = Math.min(this.scale.width / anchoMundo, this.scale.height / altoTotal);
      cam.zoomTo(zoom, 300, "Sine.easeInOut");
      cam.pan(anchoMundo / 2, altoTotal / 2 - ALTO_PARED, 300, "Sine.easeInOut");
      this.mini.setVisible(false);
    } else {
      cam.zoomTo(G.zoomCamara, 300, "Sine.easeInOut");
      cam.pan(this.spriteRaton.x, this.spriteRaton.y, 300, "Sine.easeInOut", false, (_c: Phaser.Cameras.Scene2D.Camera, avance: number) => {
        if (avance === 1 && !this.mapaCompleto) {
          cam.setBounds(0, -ALTO_PARED, anchoMundo, this.grilla.alto * T + ALTO_PARED);
          cam.startFollow(this.spriteRaton, true, 0.12, 0.12, 0, 10);
        }
      });
      this.mini.setVisible(true);
    }
  }

  private alternarPausa(): void {
    this.pausado = !this.pausado;
    this.events.emit("pausa", this.pausado);
  }
}
