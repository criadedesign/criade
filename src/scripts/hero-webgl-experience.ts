import {
  criadeOrangeFragmentShader,
  criadeVertexShader,
} from '../shaders/criadeSculpture.glsl';

interface ActiveExperience {
  dispose: () => void;
}

let activeInstance: ActiveExperience | null = null;
let bootGeneration = 0;

function canUseWebGL(): boolean {
  try {
    const testCanvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (testCanvas.getContext('webgl2') || testCanvas.getContext('webgl'))
    );
  } catch {
    return false;
  }
}

/**
 * Modo A: Integração nativa com Spline WebGL (@splinetool/runtime)
 * Ativado automaticamente quando `data-spline-url` contém uma cena `.splinecode`.
 */
async function mountSplineRuntime(
  container: HTMLElement,
  canvas: HTMLCanvasElement,
  fallbackEl: HTMLElement | null,
  splineUrl: string,
  reducedMotion: boolean
): Promise<ActiveExperience> {
  const { Application } = await import('@splinetool/runtime');
  const splineApp = new Application(canvas);
  await splineApp.load(splineUrl);

  canvas.classList.remove('opacity-0');
  canvas.classList.add('opacity-100');
  fallbackEl?.classList.add('opacity-0');

  if (reducedMotion) {
    splineApp.stop();
  }

  const io = new IntersectionObserver(
    (entries) => {
      const visible = entries[0]?.isIntersecting ?? false;
      if (!visible || document.hidden || reducedMotion) {
        splineApp.stop();
      } else {
        splineApp.play();
      }
    },
    { threshold: 0.02 }
  );
  io.observe(container);

  const onVisibility = () => {
    if (document.hidden || reducedMotion) {
      splineApp.stop();
    } else {
      splineApp.play();
    }
  };
  document.addEventListener('visibilitychange', onVisibility);

  return {
    dispose: () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      splineApp.dispose();
    },
  };
}

/**
 * Modo B (Padrão): Modelo .glb Otimizado + Shaders GLSL de Estúdio + Otimização GPU Adaptativa
 */
async function mountCustomGLBShaderEngine(
  hero: HTMLElement,
  container: HTMLElement,
  canvas: HTMLCanvasElement,
  fallbackEl: HTMLElement | null,
  modelUrl: string,
  reducedMotion: boolean
): Promise<ActiveExperience> {
  const [THREE, { GLTFLoader }] = await Promise.all([
    import('three'),
    import('three/examples/jsm/loaders/GLTFLoader.js'),
  ]);

  const isMobile = window.matchMedia('(max-width: 1023px)').matches;
  const maxDpr = isMobile ? 1.5 : 2.0;
  let currentDpr = Math.min(window.devicePixelRatio || 1, maxDpr);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    stencil: false,
    depth: true,
    powerPreference: 'high-performance',
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(currentDpr);

  const scene = new THREE.Scene();

  // Câmera de retrato editorial (55mm equiv.) evitando distorção de lente grande-angular
  const camera = new THREE.PerspectiveCamera(34, 1, 0.5, 15);
  camera.position.set(0, 0, 3.52);

  // Uniforms monocromáticos em sRGB calibrado: 100% na cor laranja da Criade (#F47721)
  const sharedUniforms = {
    uTime: { value: 0 },
    uPointer: { value: new THREE.Vector2(0, 0) },
    uHover: { value: 0 },
    uColorCore: { value: new THREE.Vector3(0.957, 0.467, 0.129) }, // #F47721 (Laranja Criade exato)
    uColorShadow: { value: new THREE.Vector3(0.878, 0.392, 0.075) }, // #E06413 (Laranja puro sutilmente esculpido para 3D, sem marrom/escuro)
    uColorRim: { value: new THREE.Vector3(1.0, 0.549, 0.212) }, // #FF8C36 (Laranja luminoso nas quinas chanfradas)
    uGrainIntensity: { value: 0.022 },
  };

  const orangeShaderMat = new THREE.ShaderMaterial({
    vertexShader: criadeVertexShader,
    fragmentShader: criadeOrangeFragmentShader,
    uniforms: sharedUniforms,
  });

  // Carrega o modelo binário otimizado (.glb)
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(modelUrl);
  const sculptureRoot = gltf.scene;

  let orbitalSphere: import('three').Object3D | null = null;
  const baseSpherePos = new THREE.Vector3(0.5202, 0.4684, 0.055);
  const disposables: Array<{ dispose: () => void }> = [orangeShaderMat];

  sculptureRoot.traverse((child) => {
    if ((child as import('three').Mesh).isMesh) {
      const mesh = child as import('three').Mesh;
      const geo = mesh.geometry;
      disposables.push(geo);

      // Mapeia o atributo customizado exportado no .glb (_SURFACETYPE -> _surfacetype -> aSurfaceType)
      const rawAttr = geo.getAttribute('_surfacetype') || geo.getAttribute('_SURFACETYPE');
      if (rawAttr) {
        geo.setAttribute('aSurfaceType', rawAttr);
      } else {
        const count = geo.getAttribute('position').count;
        geo.setAttribute('aSurfaceType', new THREE.BufferAttribute(new Float32Array(count), 1));
      }

      mesh.material = orangeShaderMat;
    }

    if (child.name === 'Criade_Orbital_Sphere') {
      orbitalSphere = child;
      baseSpherePos.copy(child.position);
      baseSpherePos.z = 0.068;
      child.position.copy(baseSpherePos);
    }
  });

  // Grupo pivô para pose arquitetônica 3/4 de estúdio + resposta a cursor e scroll
  const rig = new THREE.Group();
  rig.add(sculptureRoot);
  scene.add(rig);

  // Pose inicial intencional: revela a extrusão 3D e o corte arquitetônico reto a 21°
  const baseRotX = 0.21;
  const baseRotY = 0.29;
  const baseRotZ = -0.03;
  rig.rotation.set(baseRotX, baseRotY, baseRotZ);

  const updateSize = () => {
    const rect = container.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };
  updateSize();

  const ro = new ResizeObserver(() => {
    updateSize();
    if (reducedMotion) renderer.render(scene, camera);
  });
  ro.observe(container);

  // Transição suave do placeholder SVG SSR para o canvas WebGL compilado
  renderer.render(scene, camera);
  canvas.classList.remove('opacity-0');
  canvas.classList.add('opacity-100');
  fallbackEl?.classList.add('opacity-0');

  // Se movimento reduzido estiver ativo, mantém o frame 3D estático de alta definição (0% GPU contínua)
  if (reducedMotion) {
    return {
      dispose: () => {
        ro.disconnect();
        disposables.forEach((d) => d.dispose());
        renderer.dispose();
      },
    };
  }

  // Estados cinéticos com amortecimento físico (spring/lerp)
  const targetPointer = { x: 0, y: 0 };
  const smoothPointer = { x: 0, y: 0 };
  let targetHover = 0;
  let smoothHover = 0;
  let scrollProgress = 0;

  const onPointerMove = (e: PointerEvent) => {
    const heroRect = hero.getBoundingClientRect();
    const nx = ((e.clientX - heroRect.left) / Math.max(1, heroRect.width)) * 2 - 1;
    const ny = -(((e.clientY - heroRect.top) / Math.max(1, heroRect.height)) * 2 - 1);
    targetPointer.x = Math.max(-1, Math.min(1, nx));
    targetPointer.y = Math.max(-1, Math.min(1, ny));

    // Intensifica a resposta magnética quando o cursor explora a metade direita da Hero
    const stageProximity = Math.max(0, (nx + 0.15) / 1.15);
    targetHover = Math.min(1, 0.25 + stageProximity * 0.75);
  };

  const onPointerLeave = () => {
    targetPointer.x = 0;
    targetPointer.y = 0;
    targetHover = 0;
  };

  const onScroll = () => {
    const rect = hero.getBoundingClientRect();
    const total = Math.max(1, rect.height);
    scrollProgress = Math.max(0, Math.min(1, -rect.top / total));
  };

  hero.addEventListener('pointermove', onPointerMove, { passive: true });
  hero.addEventListener('pointerleave', onPointerLeave, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Monitor adaptativo de FPS para reduzir DPR automaticamente em GPUs integradas modestas
  let slowFrameCount = 0;
  let dprDowngraded = false;

  let rafId = 0;
  let isRunning = false;
  let isInViewport = true;
  let prevTime = performance.now();
  let elapsed = 0;

  const tick = (now: number) => {
    if (!isRunning) return;
    rafId = window.requestAnimationFrame(tick);

    const dt = Math.min(0.05, Math.max(0.001, (now - prevTime) / 1000));
    prevTime = now;
    elapsed += dt;

    if (!dprDowngraded && currentDpr > 1.05) {
      if (dt > 0.026) {
        slowFrameCount++;
        if (slowFrameCount > 40) {
          currentDpr = 1.0;
          renderer.setPixelRatio(currentDpr);
          dprDowngraded = true;
        }
      } else if (slowFrameCount > 0) {
        slowFrameCount--;
      }
    }

    const damp = 1 - Math.exp(-5.5 * dt);
    smoothPointer.x += (targetPointer.x - smoothPointer.x) * damp;
    smoothPointer.y += (targetPointer.y - smoothPointer.y) * damp;
    smoothHover += (targetHover - smoothHover) * damp;

    sharedUniforms.uTime.value = elapsed;
    sharedUniforms.uPointer.value.set(smoothPointer.x, smoothPointer.y);
    sharedUniforms.uHover.value = smoothHover;

    // Flutuação escultórica sutil + perspectiva reativa ao cursor + rotação de scroll
    const idleBreathX = Math.sin(elapsed * 0.75) * 0.032;
    const idleBreathY = Math.cos(elapsed * 0.58) * 0.045;

    rig.rotation.x =
      baseRotX + idleBreathX - smoothPointer.y * 0.24 + scrollProgress * 0.18;
    rig.rotation.y =
      baseRotY + idleBreathY + smoothPointer.x * 0.34 + scrollProgress * 0.42;
    rig.rotation.z = baseRotZ - smoothPointer.x * 0.06 - scrollProgress * 0.16;

    // Levitação orbital magnética independente da esfera Criade dentro da abertura arquitetônica
    if (orbitalSphere) {
      const floatX = Math.cos(elapsed * 1.35) * 0.016 + smoothPointer.x * 0.042 * smoothHover;
      const floatY = Math.sin(elapsed * 1.65) * 0.022 + smoothPointer.y * 0.042 * smoothHover;
      const floatZ = Math.sin(elapsed * 1.15) * 0.03 + smoothHover * 0.045;
      orbitalSphere.position.set(
        baseSpherePos.x + floatX,
        baseSpherePos.y + floatY,
        baseSpherePos.z + floatZ
      );
    }

    renderer.render(scene, camera);
  };

  const startLoop = () => {
    if (isRunning || !isInViewport || document.hidden) return;
    isRunning = true;
    prevTime = performance.now();
    rafId = window.requestAnimationFrame(tick);
  };

  const stopLoop = () => {
    if (!isRunning) return;
    isRunning = false;
    window.cancelAnimationFrame(rafId);
  };

  // Otimização 3D: pausa total de CPU/GPU quando a Hero sai da viewport
  const io = new IntersectionObserver(
    (entries) => {
      isInViewport = entries[0]?.isIntersecting ?? false;
      if (isInViewport) {
        startLoop();
      } else {
        stopLoop();
      }
    },
    { threshold: 0.01 }
  );
  io.observe(hero);

  const onVisibility = () => {
    if (document.hidden) {
      stopLoop();
    } else {
      startLoop();
    }
  };
  document.addEventListener('visibilitychange', onVisibility);

  // Resiliência a perda de contexto WebGL
  const onContextLost = (e: Event) => {
    e.preventDefault();
    stopLoop();
    canvas.classList.add('opacity-0');
    fallbackEl?.classList.remove('opacity-0');
  };
  const onContextRestored = () => {
    fallbackEl?.classList.add('opacity-0');
    canvas.classList.remove('opacity-0');
    startLoop();
  };
  canvas.addEventListener('webglcontextlost', onContextLost);
  canvas.addEventListener('webglcontextrestored', onContextRestored);

  startLoop();

  return {
    dispose: () => {
      stopLoop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      hero.removeEventListener('pointermove', onPointerMove);
      hero.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('scroll', onScroll);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
    },
  };
}

export function initHeroWebGLExperience(): void {
  const container = document.querySelector<HTMLElement>('[data-hero-3d-stage]');
  const canvas = container?.querySelector<HTMLCanvasElement>('[data-hero-3d-canvas]');
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  if (!container || !canvas || !hero) return;

  // Evita inicialização duplicada entre execução inicial do módulo e o primeiro evento astro:page-load
  if (container.dataset.webglMounted === 'true') return;
  container.dataset.webglMounted = 'true';

  activeInstance?.dispose();
  activeInstance = null;
  const currentGen = ++bootGeneration;

  const fallbackEl = container.querySelector<HTMLElement>('[data-hero-3d-fallback]');
  const splineUrl = (canvas.dataset.splineUrl || '').trim();
  const modelUrl = (canvas.dataset.modelUrl || '/models/criade-sculpture.glb').trim();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!canUseWebGL()) return;

  const boot = async () => {
    if (currentGen !== bootGeneration) return;
    try {
      const instance =
        splineUrl.length > 0
          ? await mountSplineRuntime(
              container,
              canvas,
              fallbackEl,
              splineUrl,
              reducedMotion
            )
          : await mountCustomGLBShaderEngine(
              hero,
              container,
              canvas,
              fallbackEl,
              modelUrl,
              reducedMotion
            );

      if (currentGen !== bootGeneration) {
        instance.dispose();
        return;
      }
      activeInstance = instance;
    } catch (err) {
      console.warn('[Criade 3D] Fallback vetorial mantido:', err);
      canvas.classList.add('opacity-0');
      fallbackEl?.classList.remove('opacity-0');
    }
  };

  // Hidratação ociosa pós-LCP (não bloqueia a pintura inicial da tipografia nem das imagens AVIF)
  if ('requestIdleCallback' in window) {
    (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number })
      .requestIdleCallback(() => void boot(), { timeout: 600 });
  } else {
    globalThis.setTimeout(() => void boot(), 120);
  }
}

export function teardownHeroWebGLExperience(): void {
  bootGeneration++;
  const container = document.querySelector<HTMLElement>('[data-hero-3d-stage]');
  if (container) {
    delete container.dataset.webglMounted;
  }
  activeInstance?.dispose();
  activeInstance = null;
}
