import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { Book3D as Book } from "./books";
import { createBookTextures, createShadowTexture } from "./textures";

export type Mode = "entering" | "browsing" | "opening" | "open" | "closing";

export type SceneState = {
  mode: Mode;
  /** Book nearest the slider position (drives the "title · author" label). */
  centerIndex: number;
  /** Book that is opening/open/closing, or -1. */
  selectedIndex: number;
  panelVisible: boolean;
  pointer: boolean;
};

type Options = {
  container: HTMLElement;
  /** Element that receives wheel / drag input (the whole section). */
  inputElement: HTMLElement;
  books: Book[];
  onChange: (state: SceneState) => void;
};

type BookRig = {
  book: Book;
  group: THREE.Group;
  pivot: THREE.Group;
  materials: THREE.MeshStandardMaterial[];
  textures: THREE.Texture[];
  shadow: THREE.Object3D;
  shadowMaterial: THREE.MeshBasicMaterial;
  hover: number;
  opacity: number;
  restY: number;
};

type Tween = {
  get: () => number;
  set: (v: number) => void;
  from: number;
  to: number;
  duration: number;
  delay: number;
  elapsed: number;
  ease: (t: number) => number;
  onComplete?: () => void;
};

const SHELF_Y = -3.1;
const COVER_OPEN_ANGLE = 0.8 * Math.PI;
const PANEL_DELAY = 1.332;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smoothstep = (v: number, a: number, b: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
const easeInQuad = (t: number) => t * t;
const linear = (t: number) => t;

/** Shelf slot layout for a fractional slider position: the book under the slider widens to cover-width. */
function layout(books: Book[], position: number) {
  const COUNT = books.length;
  const widths = new Array<number>(COUNT);
  const coverness = new Array<number>(COUNT);
  for (let i = 0; i < COUNT; i++) {
    const c = Math.max(0, 1 - Math.abs(i - position));
    coverness[i] = c;
    widths[i] = lerp(0.82, books[i].width + 0.85, c);
  }
  const centres = new Array<number>(COUNT);
  let left = 0;
  for (let i = 0; i < COUNT; i++) {
    centres[i] = left + widths[i] / 2;
    left += widths[i];
  }
  const lo = Math.max(0, Math.min(COUNT - 1, Math.floor(position)));
  const hi = Math.max(0, Math.min(COUNT - 1, Math.floor(position) + 1));
  const anchor = lerp(centres[lo], centres[hi], position - Math.floor(position));
  return { centres, coverness, anchor };
}

function buildBook(book: Book): Omit<BookRig, "shadow" | "shadowMaterial"> {
  const tex = createBookTextures(book);
  const page = "#e8d8a8";
  const std = (params: THREE.MeshStandardMaterialParameters) =>
    new THREE.MeshStandardMaterial({ transparent: true, ...params });

  // Box face order: +x, -x, +y, -y, +z (front), -z (back).
  const backCover = [
    std({ color: page, roughness: 0.85 }),
    std({ color: book.spineColor, roughness: 0.6 }),
    std({ color: page, roughness: 0.85 }),
    std({ color: page, roughness: 0.85 }),
    std({ color: "#f3ead2", roughness: 0.7 }),
    std({ color: book.coverColor, roughness: 0.55 }),
  ];
  const pages = [0, 1, 2, 3, 4, 5].map((i) =>
    i === 4 ? std({ map: tex.firstPage, roughness: 0.92 }) : std({ color: page, roughness: 0.95 }),
  );
  const frontCover = [
    std({ color: page, roughness: 0.85 }),
    std({ color: book.spineColor, roughness: 0.6 }),
    std({ color: page, roughness: 0.85 }),
    std({ color: page, roughness: 0.85 }),
    std({ map: tex.cover, roughness: 0.55 }),
    std({ map: tex.insideCover, roughness: 0.85 }),
  ];
  const spine = [0, 1, 2, 3, 4, 5].map((i) =>
    i === 1 ? std({ map: tex.spine, roughness: 0.55 }) : std({ color: book.spineColor, roughness: 0.6 }),
  );

  const { width: w, height: h, spineThickness: t } = book;
  const pageBlock = Math.max(0.04, t - 0.1);
  const mesh = (geometry: THREE.BoxGeometry, materials: THREE.Material[], x: number, z: number) => {
    const m = new THREE.Mesh(geometry, materials);
    m.position.set(x, 0, z);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  };

  const group = new THREE.Group();
  const back = mesh(new THREE.BoxGeometry(w, h, 0.05), backCover, 0.03, -t / 2 + 0.025);
  const block = mesh(new THREE.BoxGeometry(w - 0.025, h - 0.025, pageBlock), pages, 0.0425, -t / 2 + 0.05 + pageBlock / 2);
  const spineMesh = mesh(new THREE.BoxGeometry(0.06, h, t), spine, 0.03 - w / 2 - 0.03, 0);
  // The front board hinges at the spine edge.
  const pivot = new THREE.Group();
  pivot.position.set(0.03 - w / 2, 0, t / 2 - 0.025);
  const front = mesh(new THREE.BoxGeometry(w, h, 0.05), frontCover, w / 2, 0);
  pivot.add(front);
  group.add(back, block, spineMesh, pivot);
  for (const m of [back, spineMesh, front]) m.userData.interactive = true;

  const restY = h / 2 + SHELF_Y;
  group.position.set(16, restY + 0.4, 0.1);

  return {
    book,
    group,
    pivot,
    materials: [...backCover, ...pages, ...frontCover, ...spine],
    textures: [tex.spine, tex.cover, tex.firstPage, tex.insideCover],
    hover: 0,
    opacity: 1,
    restY,
  };
}

export class HardbackScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(36, 1, 0.1, 80);
  private lights: {
    ambient: THREE.AmbientLight;
    key: THREE.DirectionalLight;
    fill: THREE.DirectionalLight;
    bounce: THREE.PointLight;
  };
  private ground: THREE.Mesh<THREE.PlaneGeometry, THREE.ShadowMaterial>;
  private shadowTexture: THREE.Texture;
  private envTarget: THREE.WebGLRenderTarget;
  private rigs: BookRig[] = [];
  private raycaster = new THREE.Raycaster();
  private pointerNdc = new THREE.Vector2(2, 2);
  private tweens: Tween[] = [];
  private frame = 0;
  private last = performance.now();
  private resizeObserver: ResizeObserver;

  private isMobile = false;
  private mode: Mode = "entering";
  private books: Book[];
  private count: number;
  /** Escalonado de la entrada: cuánto se demora cada libro respecto del anterior. */
  private enterStagger: number;
  private enterSpan: number;
  private position: number;
  private target: number;
  private enterProgress = 0;
  private openProgress = 0;
  private selected = -1;
  private hoverIndex = -1;
  private panelVisible = false;
  private centerIndex: number;
  private wheelTimer: ReturnType<typeof setTimeout> | null = null;
  private drag = { active: false, moved: false, startX: 0, startPosition: 0, pointerId: 0, downOnBook: -1 };
  private emitted = "";

  constructor(private options: Options) {
    const { container } = options;
    this.books = options.books;
    this.count = this.books.length;
    this.position = this.target = this.centerIndex = Math.floor(this.count / 2);
    // Con hasta 17 libros es el escalonado original (0,05 s); con más se comprime
    // para que todos lleguen dentro de los 2 s de la entrada.
    this.enterStagger = Math.min(0.1, 1.6 / Math.max(1, this.count - 1));
    this.enterSpan = Math.max(0.4, 2 - (this.count - 1) * this.enterStagger);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.VSMShadowMap;
    this.renderer.domElement.style.display = "block";
    this.renderer.domElement.style.width = "100%";
    this.renderer.domElement.style.height = "100%";
    container.appendChild(this.renderer.domElement);

    this.camera.position.set(0, 2.7, 11.95);
    this.camera.lookAt(0, -0.4, 0);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envTarget = pmrem.fromScene(new RoomEnvironment(), 0.04);
    pmrem.dispose();
    this.scene.environment = this.envTarget.texture;

    const ambient = new THREE.AmbientLight();
    const key = new THREE.DirectionalLight();
    key.position.set(5, 7, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -14, right: 14, top: 8, bottom: -8, near: 0.1, far: 30 });
    key.shadow.bias = -4e-4;
    key.shadow.normalBias = 0.02;
    key.shadow.radius = 14;
    key.shadow.blurSamples = 25;
    const fill = new THREE.DirectionalLight("#b8d0e8");
    fill.position.set(-6, 4, 3);
    const bounce = new THREE.PointLight("#ffc89a");
    bounce.position.set(0, -3, 4);
    this.lights = { ambient, key, fill, bounce };
    this.scene.add(ambient, key, fill, bounce);

    this.ground = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 30),
      new THREE.ShadowMaterial({ transparent: true, color: "#000000" }),
    );
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = SHELF_Y + 0.0005;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);

    this.shadowTexture = createShadowTexture();
    this.books.forEach((book, index) => {
      const rig = buildBook(book);
      rig.group.traverse((o) => (o.userData.index = index));
      const shadowMaterial = new THREE.MeshBasicMaterial({
        transparent: true,
        depthWrite: false,
        color: "#000000",
        alphaMap: this.shadowTexture,
      });
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), shadowMaterial);
      plane.rotation.x = -Math.PI / 2;
      plane.scale.set(book.width + 0.7, book.spineThickness + 0.7, 1);
      plane.position.x = -0.03;
      plane.renderOrder = -1;
      const shadow = new THREE.Object3D();
      shadow.position.y = SHELF_Y + 0.002;
      shadow.add(plane);
      this.scene.add(rig.group, shadow);
      this.rigs.push({ ...rig, shadow, shadowMaterial });
    });

    this.applyTheme();
    this.resize();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.bindInput();

    this.tween({
      get: () => this.enterProgress,
      set: (v) => (this.enterProgress = v),
      to: 1,
      duration: 2,
      ease: linear,
      onComplete: () => this.setMode("browsing"),
    });

    this.frame = requestAnimationFrame(this.tick);
    this.emit();
  }

  /** Same toggle as clicking a book: opens the given book while browsing, closes the open one. */
  activate(index: number) {
    if (this.mode === "browsing") this.open(index);
    else if (this.mode === "open") this.close();
  }

  close = () => {
    if (this.mode !== "open" && this.mode !== "opening") return;
    this.setMode("closing");
    this.cancelTweens("panel");
    this.panelVisible = false;
    this.cancelTweens("open");
    this.tween({
      tag: "open",
      get: () => this.openProgress,
      set: (v) => (this.openProgress = v),
      to: 0,
      duration: 1,
      ease: easeInOutCubic,
      onComplete: () => {
        this.selected = -1;
        this.setMode("browsing");
      },
    });
    this.emit();
  };

  dispose() {
    cancelAnimationFrame(this.frame);
    this.resizeObserver.disconnect();
    this.unbindInput();
    if (this.wheelTimer) clearTimeout(this.wheelTimer);
    for (const rig of this.rigs) {
      rig.materials.forEach((m) => m.dispose());
      rig.textures.forEach((t) => t.dispose());
      rig.shadowMaterial.dispose();
      rig.group.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose();
      });
    }
    this.shadowTexture.dispose();
    this.envTarget.dispose();
    this.ground.geometry.dispose();
    this.ground.material.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private open(index: number) {
    if (this.mode !== "browsing") return;
    this.setMode("opening");
    this.target = index;
    this.cancelTweens("slide");
    this.cancelTweens("open");
    this.openProgress = 0;

    const start = () => {
      this.selected = index;
      this.tween({ tag: "panel", get: () => 0, set: () => {}, to: 0, duration: 0, delay: PANEL_DELAY, ease: linear, onComplete: () => {
        this.panelVisible = true;
        this.emit();
      } });
      this.tween({
        tag: "open",
        get: () => this.openProgress,
        set: (v) => (this.openProgress = v),
        to: 1,
        duration: 1.85,
        ease: easeInOutCubic,
        onComplete: () => this.setMode("open"),
      });
      this.emit();
    };

    const distance = Math.abs(index - this.position);
    if (distance < 0.4) {
      this.position = index;
      start();
    } else {
      // Glide the shelf to the book first, then open it.
      this.tween({
        tag: "slide",
        get: () => this.position,
        set: (v) => (this.position = v),
        to: index,
        duration: Math.max(0.32, Math.min(0.7, 0.22 + 0.08 * distance)),
        ease: easeOutQuart,
        onComplete: () =>
          this.tween({ tag: "slide", get: () => 0, set: () => {}, to: 0, duration: 0, delay: 0.12, ease: linear, onComplete: start }),
      });
    }
  }

  // La app es oscura: sólo queda la iluminación nocturna de la referencia.
  private applyTheme() {
    const { ambient, key, fill, bounce } = this.lights;
    ambient.intensity = 0.42;
    ambient.color.set("#ffead0");
    key.intensity = 1.45;
    key.color.set("#ffd9a8");
    fill.intensity = 0.4;
    bounce.intensity = 0.35;
    this.scene.environmentIntensity = 0.12;
    this.ground.material.opacity = 0.4;
  }

  private resize() {
    const { clientWidth: width, clientHeight: height } = this.options.container;
    if (!width || !height) return;
    this.isMobile = window.innerWidth < 768;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  private tween(t: Omit<Tween, "from" | "elapsed" | "delay"> & { delay?: number; tag?: string }) {
    const tween: Tween & { tag?: string } = { ...t, from: t.get(), elapsed: 0, delay: t.delay ?? 0 };
    this.tweens.push(tween);
  }

  private cancelTweens(tag: string) {
    this.tweens = this.tweens.filter((t) => (t as Tween & { tag?: string }).tag !== tag);
  }

  private setMode(mode: Mode) {
    this.mode = mode;
    this.emit();
  }

  private emit() {
    const state: SceneState = {
      mode: this.mode,
      centerIndex: this.centerIndex,
      selectedIndex: this.selected,
      panelVisible: this.panelVisible,
      pointer: this.hoverIndex >= 0 && (this.mode === "browsing" || this.mode === "open"),
    };
    const key = JSON.stringify(state);
    if (key === this.emitted) return;
    this.emitted = key;
    this.options.onChange(state);
  }

  private tick = (now: number) => {
    this.frame = requestAnimationFrame(this.tick);
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    this.runTweens(dt);
    this.updatePointerHover();
    this.update(dt);
    this.renderer.render(this.scene, this.camera);
  };

  private runTweens(dt: number) {
    if (!this.tweens.length) return;
    const done: Tween[] = [];
    for (const t of [...this.tweens]) {
      if (t.delay > 0) {
        t.delay -= dt;
        if (t.delay > 0) continue;
        t.from = t.get();
      }
      t.elapsed += dt;
      const p = t.duration <= 0 ? 1 : clamp01(t.elapsed / t.duration);
      t.set(lerp(t.from, t.to, t.ease(p)));
      if (p >= 1) done.push(t);
    }
    if (!done.length) return;
    this.tweens = this.tweens.filter((t) => !done.includes(t));
    done.forEach((t) => t.onComplete?.());
  }

  private update(dt: number) {
    // Per-frame 0.16 damping, normalised to 60fps.
    const damp = 1 - Math.pow(1 - 0.16, dt * 60);
    if (this.mode === "browsing") {
      const delta = this.target - this.position;
      this.position = Math.abs(delta) < 5e-4 ? this.target : this.position + delta * damp;
    }
    const nearest = Math.max(0, Math.min(this.count - 1, Math.round(this.position)));
    if (nearest !== this.centerIndex) {
      this.centerIndex = nearest;
      this.emit();
    }

    const { centres, coverness, anchor } = layout(this.books, this.position);
    const enter = this.enterProgress;
    const open = this.openProgress;
    const isOpenPhase = this.mode === "opening" || this.mode === "open" || this.mode === "closing";
    const target = this.isMobile
      ? { x: 0.8, y: -0.25, z: -1.5 }
      : { x: -1.25, y: -1.5, z: 2.4 };
    const shelfDrop = isOpenPhase ? easeInOutCubic(smoothstep(open, 0.05, 0.95)) : 0;
    const baseShadow = 0.85;
    // En mobile la cámara mira más arriba mientras se navega, así el estante baja y no
    // choca con el título; al abrir vuelve al encuadre original del libro abierto.
    this.camera.lookAt(0, this.isMobile ? lerp(0.3, -0.4, shelfDrop) : -0.4, 0);

    this.rigs.forEach((rig, i) => {
      const { group, pivot, book } = rig;
      const c = coverness[i];
      const restX = centres[i] - anchor;
      const restZ = 0.18 * c;
      const restRot = 0.5 * Math.PI * (1 - c);

      const hovered = (this.mode === "browsing" || this.mode === "entering") && this.hoverIndex === i && i !== this.selected;
      rig.hover += ((hovered ? 1 : 0) - rig.hover) * damp;

      let x = restX;
      let y = rig.restY + 0.18 * rig.hover * (1 - 0.5 * c);
      let z = restZ + 0.12 * rig.hover * (1 - c);
      let rotY = restRot;
      let rotX = 0;
      let hinge = 0;
      let opacity = 1;

      if (this.mode === "entering") {
        const p = clamp01((2 * enter - this.enterStagger * i) / this.enterSpan);
        const k = easeInOutSine(p);
        x = lerp(16, restX, k);
        y = lerp(rig.restY + 0.4, rig.restY, k);
        z = lerp(0.1, restZ, k);
        rotY = lerp(0, restRot, easeInQuad(p));
      } else if (isOpenPhase && this.selected >= 0) {
        if (i === this.selected) {
          const move = smoothstep(open, 0, 0.6);
          const swing = smoothstep(open, 0.45, 1);
          x = lerp(restX, target.x, move);
          y = lerp(rig.restY, target.y + book.height / 2, move);
          z = lerp(restZ, target.z, move);
          rotY = lerp(restRot, 0, move);
          rotX = lerp(0, -0.26, move);
          hinge = COVER_OPEN_ANGLE * easeInOutCubic(swing);
        } else {
          const delay = clamp01(0.04 * Math.abs(i - this.selected));
          const away = smoothstep(open, delay, delay + 0.55);
          z = restZ - 3.2 * easeOutQuart(away);
          rotX = -0.18 * away;
          opacity = 1 - away;
        }
      }

      group.position.set(x, y, z);
      group.rotation.set(rotX, rotY, 0);
      pivot.rotation.y = -hinge;
      if (Math.abs(opacity - rig.opacity) > 1e-4) {
        rig.materials.forEach((m) => (m.opacity = opacity));
        rig.opacity = opacity;
      }
      group.visible = opacity > 0.02;

      const lift = clamp01(1 - (y - rig.restY) / 0.9);
      rig.shadow.position.x = x;
      rig.shadow.position.z = z;
      rig.shadow.rotation.y = rotY;
      rig.shadowMaterial.opacity = baseShadow * 0.4 * opacity * lift * (1 - shelfDrop);
    });
    this.ground.visible = shelfDrop < 0.99;
  }

  private updatePointerHover() {
    let index = -1;
    if (this.pointerNdc.x <= 1 && !this.drag.moved) {
      this.raycaster.setFromCamera(this.pointerNdc, this.camera);
      const targets: THREE.Object3D[] = [];
      for (const rig of this.rigs) {
        if (!rig.group.visible) continue;
        rig.group.traverse((o) => o.userData.interactive && targets.push(o));
      }
      const hit = this.raycaster.intersectObjects(targets, false)[0];
      if (hit) index = hit.object.userData.index as number;
    }
    if (index !== this.hoverIndex) {
      this.hoverIndex = index;
      this.emit();
    }
  }

  // ---- input -------------------------------------------------------------

  private setPointer(event: PointerEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointerNdc.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
  }

  private snapSoon() {
    if (this.wheelTimer) clearTimeout(this.wheelTimer);
    this.wheelTimer = setTimeout(() => {
      if (this.mode === "browsing") this.target = Math.max(0, Math.min(this.count - 1, Math.round(this.target)));
    }, 220);
  }

  private onWheel = (event: WheelEvent) => {
    if (this.mode !== "browsing") return;
    event.preventDefault();
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    this.target = Math.max(0, Math.min(this.count - 1, this.target + delta / 240));
    this.snapSoon();
  };

  private onPointerDown = (event: PointerEvent) => {
    if ((event.target as HTMLElement | null)?.closest("[data-no-drag]")) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    this.setPointer(event);
    this.updatePointerHover();
    this.drag = {
      active: true,
      moved: false,
      startX: event.clientX,
      startPosition: this.position,
      pointerId: event.pointerId,
      downOnBook: this.hoverIndex,
    };
  };

  private onPointerMove = (event: PointerEvent) => {
    this.setPointer(event);
    if (!this.drag.active || this.mode !== "browsing") return;
    const dx = event.clientX - this.drag.startX;
    if (!this.drag.moved && Math.abs(dx) > 4) {
      this.drag.moved = true;
      try {
        this.options.inputElement.setPointerCapture(event.pointerId);
      } catch {}
    }
    if (!this.drag.moved) return;
    const next = Math.max(0, Math.min(this.count - 1, this.drag.startPosition - dx / 50.4));
    this.position = next;
    this.target = next;
  };

  private onPointerUp = (event: PointerEvent) => {
    if (!this.drag.active) return;
    const { moved, downOnBook } = this.drag;
    this.drag.active = false;
    this.drag.moved = false;
    if (moved) {
      try {
        this.options.inputElement.releasePointerCapture(event.pointerId);
      } catch {}
      if (this.wheelTimer) clearTimeout(this.wheelTimer);
      this.target = Math.max(0, Math.min(this.count - 1, Math.round(this.target)));
      return;
    }
    this.setPointer(event);
    this.updatePointerHover();
    if (downOnBook >= 0 && downOnBook === this.hoverIndex) this.activate(downOnBook);
  };

  private onPointerLeave = () => {
    if (!this.drag.active) this.pointerNdc.set(2, 2);
  };

  private onKeyDown = (event: KeyboardEvent) => {
    if (this.mode === "open" && event.key === "Escape") {
      event.preventDefault();
      this.close();
      return;
    }
    if (this.mode !== "browsing") return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      this.target = Math.max(0, Math.round(this.position) - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      this.target = Math.min(this.count - 1, Math.round(this.position) + 1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      this.open(Math.max(0, Math.min(this.count - 1, Math.round(this.position))));
    }
  };

  private bindInput() {
    const el = this.options.inputElement;
    el.addEventListener("wheel", this.onWheel, { passive: false });
    el.addEventListener("pointerdown", this.onPointerDown);
    el.addEventListener("pointermove", this.onPointerMove);
    el.addEventListener("pointerup", this.onPointerUp);
    el.addEventListener("pointercancel", this.onPointerUp);
    el.addEventListener("pointerleave", this.onPointerLeave);
    window.addEventListener("keydown", this.onKeyDown);
  }

  private unbindInput() {
    const el = this.options.inputElement;
    el.removeEventListener("wheel", this.onWheel);
    el.removeEventListener("pointerdown", this.onPointerDown);
    el.removeEventListener("pointermove", this.onPointerMove);
    el.removeEventListener("pointerup", this.onPointerUp);
    el.removeEventListener("pointercancel", this.onPointerUp);
    el.removeEventListener("pointerleave", this.onPointerLeave);
    window.removeEventListener("keydown", this.onKeyDown);
  }
}
