import * as Phaser from "phaser";
import { ALTO_PARED, T } from "../arte/habitacion";
import { dibujarCorazon, mapaVioleta, RINCON } from "../arte/rincon";
import { crearSticker, crearTexturasBase, texturaDe } from "../arte/texturas";
import { MASCOTAS } from "../config/mascotas";
import niveles from "../config/niveles.json";
import { t } from "../i18n/textos";
import { Grilla, type Dir } from "../sistemas/grilla";
import { MovedorGrilla } from "../sistemas/MovedorGrilla";
import { sonido } from "../sistemas/Sonido";

const G = niveles.general;
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

/**
 * Nivel final: el rincón de Violeta. No hay persecución: Quesito junta los corazones
 * y se los lleva a Violeta. Al tocarla con todos los corazones, empieza la escena final.
 */
export class Violeta extends Phaser.Scene {
  private grilla!: Grilla;
  private quesito!: MovedorGrilla;
  private raton!: Phaser.GameObjects.Image;
  private sombra!: Phaser.GameObjects.Ellipse;
  private violeta!: Phaser.GameObjects.Image;
  private corazones = new Map<string, Phaser.GameObjects.Image>();
  private total = 0;
  private juntados = 0;
  private reloj = 0;
  private terminado = false;
  private avisoFalta = false;
  private contador!: Phaser.GameObjects.Text;
  private aviso!: Phaser.GameObjects.Text;
  private toque: { x: number; y: number } | null = null;

  constructor() {
    super("Violeta");
  }

  create(): void {
    this.grilla = new Grilla(mapaVioleta());
    this.corazones.clear();
    this.juntados = 0;
    this.terminado = false;
    this.avisoFalta = false;
    const W = this.grilla.ancho * T;
    const H = this.grilla.alto * T;

    // Mundo (con zoom) y una cámara aparte, sin zoom, para la interfaz.
    const mundo = this.add.layer();
    texturaDe(this, "rincon-piso", RINCON.piso(this.grilla.ancho, this.grilla.alto, 0));
    mundo.add(this.add.image(0, -ALTO_PARED, "rincon-piso").setOrigin(0).setDepth(-10000));
    for (const r of RINCON.fotos) {
      const f = this.add.image(r.x + r.w / 2, r.y + r.h / 2, r.clave);
      mundo.add(f.setScale(Math.min(r.w / f.width, r.h / f.height)).setDepth(-9999));
    }
    RINCON.muebles().forEach((m, i) => {
      texturaDe(this, `rincon-mueble-${i}`, m.lienzo);
      mundo.add(this.add.image(m.x, m.y, `rincon-mueble-${i}`).setOrigin(0).setDepth(m.profundidad));
    });
    texturaDe(this, "rincon-muro-abajo", RINCON.muroInferior(this.grilla.ancho));
    mundo.add(this.add.image(0, (this.grilla.alto - 1) * T, "rincon-muro-abajo").setOrigin(0).setDepth(100000));

    texturaDe(this, "corazon", dibujarCorazon());
    for (const o of this.grilla.objetos) {
      if (o.tipo !== "corazon") continue;
      const img = this.add.image((o.casilla.x + 0.5) * T, o.casilla.y * T + 17, "corazon").setOrigin(0.5, 1).setDepth(-5000);
      this.tweens.add({ targets: img, y: img.y - 3, duration: 600, yoyo: true, repeat: -1, ease: "Sine.easeInOut", delay: o.casilla.x * 40 });
      mundo.add(img);
      this.corazones.set(`${o.casilla.x},${o.casilla.y}`, img);
    }
    this.total = this.corazones.size;

    crearTexturasBase(this);
    const v = this.grilla.violeta!;
    const color = MASCOTAS.find((m) => m.clave === "violeta")!.color;
    const vx = (v.x + 0.5) * T;
    const vy = (v.y + 0.5) * T + 10;
    mundo.add(this.add.ellipse(vx, vy - 1, 30, 9, 0x2b170a, 0.3).setDepth(vy - 0.5));
    this.violeta = this.add.image(vx, vy, crearSticker(this, "violeta", color)).setOrigin(0.5, 1).setDepth(vy);
    this.violeta.setScale(40 / this.violeta.height);
    mundo.add(this.violeta);

    const r = this.grilla.inicioRaton;
    this.quesito = new MovedorGrilla(this.grilla, r.x, r.y);
    this.quesito.dir = "arriba";
    this.quesito.alLlegar = (x, y) => this.juntar(x, y);
    this.sombra = this.add.ellipse(0, 0, 14, 5, 0x2b170a, 0.3);
    this.raton = this.add.image(0, 0, "quesito-espalda-0").setOrigin(0.5, 1);
    mundo.add([this.sombra, this.raton]);

    const cam = this.cameras.main;
    cam.setBounds(0, -ALTO_PARED, W, H + ALTO_PARED);
    cam.setZoom(G.zoomCamara);
    cam.setRoundPixels(true);
    cam.startFollow(this.raton, true, 0.12, 0.12, 0, 10);

    const estilo = { fontFamily: "Trebuchet MS, sans-serif", fontSize: "22px", color: "#fbefd9", backgroundColor: "#5e4480cc", padding: { x: 12, y: 6 } };
    this.contador = this.add.text(12, 12, "", estilo);
    this.aviso = this.add
      .text(this.scale.width / 2, this.scale.height - 40, t("violetaInicio", { n: this.total }), { ...estilo, fontSize: "20px", align: "center", wordWrap: { width: this.scale.width * 0.7 } })
      .setOrigin(0.5, 1);
    const ui = this.cameras.add(0, 0, this.scale.width, this.scale.height);
    ui.ignore(mundo);
    cam.ignore([this.contador, this.aviso]);
    this.actualizarContador();

    this.input.keyboard!.on("keydown", (e: KeyboardEvent) => {
      if (e.code === "Escape") this.scene.start("Inicio");
      if (e.code === "KeyN") sonido.alternarSonido();
      const dir = TECLAS[e.code];
      if (dir && !this.terminado) this.quesito.pedir(dir);
    });
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => (this.toque = { x: p.x, y: p.y }));
    this.input.on("pointerup", (p: Phaser.Input.Pointer) => {
      if (!this.toque) return;
      const dx = p.x - this.toque.x;
      const dy = p.y - this.toque.y;
      this.toque = null;
      if (Math.hypot(dx, dy) < 24 || this.terminado) return;
      this.quesito.pedir(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "derecha" : "izquierda") : dy > 0 ? "abajo" : "arriba");
    });
    sonido.iniciarMusica();
  }

  update(_t: number, dtMs: number): void {
    const dt = dtMs / 1000;
    this.reloj += dt;
    if (!this.terminado) this.quesito.actualizar(dt, G.velocidadRaton * 0.85);

    const p = this.quesito.posicion();
    const rx = Math.round((p.x + 0.5) * T);
    const ry = Math.round((p.y + 0.5) * T + 9);
    const d = this.quesito.dir;
    const caminando = !this.quesito.detenido && !this.terminado;
    const paso = caminando ? Math.floor(this.reloj * 8) % 2 : 0;
    const vista = d === "arriba" ? "espalda" : d === "abajo" ? "frente" : "lado";
    this.raton.setTexture(`quesito-${vista}-${paso}`).setFlipX(d === "izquierda").setPosition(rx, ry).setDepth(ry);
    this.sombra.setPosition(rx, ry - 1).setDepth(ry - 0.5);
    // Violeta mueve la cabeza, contenta
    this.violeta.setRotation(Math.sin(this.reloj * 3) * 0.08);

    if (!this.terminado && this.cercaDeVioleta()) {
      if (this.juntados >= this.total) this.final();
      else if (!this.avisoFalta) {
        this.avisoFalta = true;
        this.mostrarAviso(t("violetaFalta"));
        sonido.efecto("guau");
        this.tweens.add({ targets: this.violeta, scale: this.violeta.scale * 1.15, duration: 120, yoyo: true, repeat: 1 });
      }
    } else if (!this.cercaDeVioleta()) this.avisoFalta = false;
  }

  private cercaDeVioleta(): boolean {
    const p = this.quesito.posicion();
    const v = this.grilla.violeta!;
    return Math.hypot(p.x - v.x, p.y - v.y) < 0.8;
  }

  private juntar(x: number, y: number): void {
    const k = `${x},${y}`;
    const img = this.corazones.get(k);
    if (!img) return;
    this.corazones.delete(k);
    this.juntados++;
    sonido.efecto("corazon");
    this.tweens.add({ targets: img, y: img.y - 14, scale: 1.8, alpha: 0, duration: 300, onComplete: () => img.destroy() });
    this.actualizarContador();
    if (this.juntados === this.total) this.mostrarAviso(t("violetaListo"));
  }

  private actualizarContador(): void {
    this.contador.setText(`♥ ${t("violetaFaltan", { h: this.juntados, n: this.total })}`);
  }

  private mostrarAviso(texto: string): void {
    this.aviso.setText(texto).setAlpha(1);
  }

  private final(): void {
    this.terminado = true;
    const total = (this.registry.get("puntajeTotal") as number | undefined) ?? 0;
    this.registry.set("puntajeTotal", total + this.juntados * G.puntos.corazon);
    this.cameras.main.fadeOut(600, 250, 240, 250);
    this.time.delayedCall(650, () => this.scene.start("Final"));
  }
}
