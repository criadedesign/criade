import {
  animate,
  createDrawable,
  createTimeline,
  spring,
  stagger,
  utils,
  type JSAnimation,
  type Timeline,
} from 'animejs';

export interface HeroChoreographyHandle {
  destroy: () => void;
}

interface OrbitNodeController {
  t: number;
  anchorT: number;
  totalLength: number;
  path: SVGPathElement;
  group: SVGGElement;
  core: SVGCircleElement | null;
  halo: SVGCircleElement | null;
  syncPosition: () => void;
}

/**
 * Coreografia Editorial & Linhas Orbitais Premium (Anime.js v4.5)
 * - Zero filtros SVG pesados (zero blur/drop-shadow em paths animados)
 * - 100% GPU/vetorial: stroke-dashoffset via createDrawable + geometria Bezier cacheada + transform/opacity
 * - Pausa automática via IntersectionObserver e visibilitychange quando fora de tela
 */
export function mountHeroLinesChoreography(
  hero: HTMLElement,
  options: { finePointer: boolean; desktop: boolean }
): HeroChoreographyHandle {
  const { finePointer, desktop } = options;

  const cleanups: Array<() => void> = [];
  const ambientAnimations: Array<JSAnimation | Timeline> = [];
  let introTimeline: Timeline | null = null;
  let isVisibleInViewport = true;

  // Seletores principais
  const cornerSolids = Array.from(hero.querySelectorAll<SVGElement>('[data-corner-solid]'));
  const cornerHairlines = Array.from(
    hero.querySelectorAll<SVGGeometryElement>('[data-corner-hairline]')
  );

  const orbitTracks = Array.from(hero.querySelectorAll<SVGPathElement>('[data-orbit-track]'));
  const orbitTopMain = hero.querySelector<SVGPathElement>('[data-orbit-main="top"]');
  const orbitBottomMain = hero.querySelector<SVGPathElement>('[data-orbit-main="bottom"]');
  const orbitFineArcs = Array.from(hero.querySelectorAll<SVGPathElement>('[data-orbit-fine]'));

  const orbitPulseTop = hero.querySelector<SVGPathElement>('[data-orbit-pulse="top"]');
  const orbitPulseBottom = hero.querySelector<SVGPathElement>('[data-orbit-pulse="bottom"]');
  const motionSparkTop = hero.querySelector<SVGCircleElement>('[data-motion-spark="top"]');

  const nodeTopGroup = hero.querySelector<SVGGElement>('[data-orbit-node="top"]');
  const nodeBottomGroup = hero.querySelector<SVGGElement>('[data-orbit-node="bottom"]');

  const studioVisual = hero.querySelector<HTMLElement>('[data-hero-studio]');
  const linesParallaxLayers = Array.from(
    hero.querySelectorAll<HTMLElement>('[data-hero-lines-layer]')
  );

  const eyebrowWords = Array.from(hero.querySelectorAll<HTMLElement>('[data-eyebrow-word]'));
  const eyebrowDots = Array.from(hero.querySelectorAll<HTMLElement>('[data-eyebrow-dot]'));
  const h1DarkWords = Array.from(hero.querySelectorAll<HTMLElement>('[data-h1-word="dark"]'));
  const h1AccentWords = Array.from(hero.querySelectorAll<HTMLElement>('[data-h1-word="accent"]'));
  const descriptionEl = hero.querySelector<HTMLElement>('[data-hero-description]');
  const ctaWrapper = hero.querySelector<HTMLElement>('[data-hero-cta]');

  const pillarItems = Array.from(hero.querySelectorAll<HTMLElement>('[data-pillar-item]'));
  const pillarDividers = Array.from(hero.querySelectorAll<HTMLElement>('[data-pillar-divider]'));
  const pillarTexts = Array.from(hero.querySelectorAll<HTMLElement>('[data-pillar-text]'));
  const pillarStrokes = Array.from(
    hero.querySelectorAll<SVGGeometryElement>('[data-pillar-item] [data-drawable-stroke]')
  );

  const signatureLine = hero.querySelector<HTMLElement>('[data-signature-line]');
  const signatureText = hero.querySelector<HTMLElement>('[data-signature-text]');

  // Drawables vetoriais cacheados uma única vez no mount
  const drawableTracks = orbitTracks.length ? createDrawable(orbitTracks) : [];
  const drawableTopMain = orbitTopMain ? createDrawable(orbitTopMain) : [];
  const drawableBottomMain = orbitBottomMain ? createDrawable(orbitBottomMain) : [];
  const drawableFineArcs = orbitFineArcs.length ? createDrawable(orbitFineArcs) : [];
  const drawableCornerHairlines = cornerHairlines.length ? createDrawable(cornerHairlines) : [];
  const drawablePillarStrokes = pillarStrokes.length ? createDrawable(pillarStrokes) : [];
  const drawablePulseTop = orbitPulseTop ? createDrawable(orbitPulseTop) : [];
  const drawablePulseBottom = orbitPulseBottom ? createDrawable(orbitPulseBottom) : [];

  // Controladores de nós orbitais ancorados com comprimento Bezier pré-calculado (zero reflow por frame)
  const buildNodeController = (
    path: SVGPathElement | null,
    group: SVGGElement | null,
    anchorT: number
  ): OrbitNodeController | null => {
    if (!path || !group) return null;
    const totalLength = path.getTotalLength();
    const core = group.querySelector<SVGCircleElement>('[data-node-core]');
    const halo = group.querySelector<SVGCircleElement>('[data-node-halo]');
    const ctrl: OrbitNodeController = {
      t: 0,
      anchorT,
      totalLength,
      path,
      group,
      core,
      halo,
      syncPosition() {
        const clamped = Math.max(0, Math.min(1, ctrl.t));
        const pt = ctrl.path.getPointAtLength(clamped * ctrl.totalLength);
        ctrl.group.setAttribute('transform', `translate(${pt.x.toFixed(2)} ${pt.y.toFixed(2)})`);
      },
    };
    ctrl.syncPosition();
    return ctrl;
  };

  // t = 0.48 posiciona o nó superior exatamente no platô acima da planta;
  // t = 0.45 posiciona o nó inferior exatamente no topo do arco abaixo do tablet.
  const topNodeCtrl = buildNodeController(orbitTopMain, nodeTopGroup, 0.48);
  const bottomNodeCtrl = buildNodeController(orbitBottomMain, nodeBottomGroup, 0.45);

  // Estados iniciais determinísticos antes da revelação
  if (drawableTracks.length) utils.set(drawableTracks, { draw: '0 0', opacity: 1 });
  if (drawableTopMain.length) utils.set(drawableTopMain, { draw: '0 0', opacity: 1 });
  if (drawableBottomMain.length) utils.set(drawableBottomMain, { draw: '0 0', opacity: 1 });
  if (drawableFineArcs.length) utils.set(drawableFineArcs, { draw: '0 0', opacity: 0.9 });
  if (drawableCornerHairlines.length) {
    utils.set(drawableCornerHairlines, { draw: '0 0', opacity: 0.55 });
  }
  if (drawablePillarStrokes.length) utils.set(drawablePillarStrokes, { draw: '0 0' });
  if (drawablePulseTop.length) utils.set(drawablePulseTop, { draw: '0 0', opacity: 0 });
  if (drawablePulseBottom.length) utils.set(drawablePulseBottom, { draw: '0 0', opacity: 0 });

  if (motionSparkTop) utils.set(motionSparkTop, { opacity: 0 });

  [topNodeCtrl, bottomNodeCtrl].forEach((ctrl) => {
    if (!ctrl) return;
    if (ctrl.core) utils.set(ctrl.core, { scale: 0, opacity: 0 });
    if (ctrl.halo) utils.set(ctrl.halo, { scale: 0.5, opacity: 0 });
  });

  if (cornerSolids.length) {
    utils.set(cornerSolids, { opacity: 0, scale: 0.94, transformOrigin: '50% 50%' });
  }
  if (studioVisual) {
    utils.set(studioVisual, { opacity: 0, translateY: 22, scale: 0.985 });
  }
  if (eyebrowWords.length) utils.set(eyebrowWords, { opacity: 0, translateY: '110%' });
  if (eyebrowDots.length) utils.set(eyebrowDots, { opacity: 0, scale: 0 });

  if (h1DarkWords.length) {
    utils.set(h1DarkWords, {
      opacity: 0,
      translateY: '112%',
      rotateX: -38,
    });
  }
  if (h1AccentWords.length) {
    utils.set(h1AccentWords, {
      opacity: 0,
      translateY: '116%',
      rotateX: -44,
      color: '#171717',
    });
  }

  if (descriptionEl) utils.set(descriptionEl, { opacity: 0, translateY: 16 });
  if (ctaWrapper) utils.set(ctaWrapper, { opacity: 0, translateY: 16, scale: 0.97 });
  if (pillarDividers.length) {
    utils.set(pillarDividers, { scaleY: 0, opacity: 1, transformOrigin: '50% 0%' });
  }
  if (pillarTexts.length) utils.set(pillarTexts, { opacity: 0, translateY: 10 });
  if (signatureLine) {
    utils.set(signatureLine, { scaleX: 0, opacity: 1, transformOrigin: '0% 50%' });
  }
  if (signatureText) utils.set(signatureText, { opacity: 0, translateX: -8 });

  // Inicia os loops ambientes ultra-leves após a entrada concluir
  const startAmbientLineLoops = () => {
    // 1. Filamento luminoso viajando suavemente pela trajetória orbital superior
    if (drawablePulseTop.length) {
      utils.set(drawablePulseTop, { opacity: 0.92 });
      const pulseTopAnim = animate(drawablePulseTop, {
        draw: ['0 0', '0 0.11', '0.89 1', '1 1'],
        duration: 3600,
        loop: true,
        loopDelay: 1800,
        ease: 'inOutSine',
      });
      ambientAnimations.push(pulseTopAnim);
    }

    // 2. Micro-partícula sincronizada exatamente no espaço vetorial 1200x896
    if (motionSparkTop && topNodeCtrl) {
      const sparkState = { p: 0 };
      const sparkAnim = animate(sparkState, {
        p: [0, 1],
        duration: 3600,
        loop: true,
        loopDelay: 1800,
        ease: 'inOutSine',
        onUpdate: () => {
          const pt = topNodeCtrl.path.getPointAtLength(sparkState.p * topNodeCtrl.totalLength);
          motionSparkTop.setAttribute('cx', pt.x.toFixed(2));
          motionSparkTop.setAttribute('cy', pt.y.toFixed(2));
          const fade = Math.sin(sparkState.p * Math.PI);
          motionSparkTop.style.opacity = (fade * 0.88).toFixed(3);
        },
      });
      ambientAnimations.push(sparkAnim);
    }

    // 3. Filamento luminoso respondendo pelo arco orbital inferior
    if (drawablePulseBottom.length) {
      utils.set(drawablePulseBottom, { opacity: 0.9 });
      const pulseBottomAnim = animate(drawablePulseBottom, {
        draw: ['0 0', '0 0.14', '0.86 1', '1 1'],
        duration: 3200,
        delay: 1400,
        loop: true,
        loopDelay: 2200,
        ease: 'inOutSine',
      });
      ambientAnimations.push(pulseBottomAnim);
    }

    // 4. Oscilação tangencial suave + pulso de anel vetorial nos 2 nós orbitais
    [topNodeCtrl, bottomNodeCtrl].forEach((ctrl, idx) => {
      if (!ctrl) return;
      const driftAnim = animate(ctrl, {
        t: [ctrl.anchorT - 0.024, ctrl.anchorT + 0.024],
        duration: 4200 + idx * 500,
        alternate: true,
        loop: true,
        ease: 'inOutSine',
        onUpdate: ctrl.syncPosition,
      });
      ambientAnimations.push(driftAnim);

      if (ctrl.halo) {
        const haloAnim = animate(ctrl.halo, {
          scale: [1, 2.5],
          opacity: [0.52, 0],
          duration: 2700,
          delay: idx * 1100,
          loop: true,
          loopDelay: 950,
          ease: 'outCubic',
        });
        ambientAnimations.push(haloAnim);
      }
    });

    if (!isVisibleInViewport || document.hidden) {
      ambientAnimations.forEach((anim) => anim.pause());
    }
  };

  // Timeline Mestra de Entrada Orquestrada
  introTimeline = createTimeline({
    defaults: { ease: 'outExpo' },
    onComplete: startAmbientLineLoops,
  });

  // A. Cantos orgânicos + palco criativo à direita
  if (cornerSolids.length) {
    introTimeline.add(
      cornerSolids,
      {
        opacity: [0, 1],
        scale: [0.94, 1],
        duration: 880,
      },
      0
    );
  }

  if (studioVisual) {
    introTimeline.add(
      studioVisual,
      {
        opacity: [0, 1],
        translateY: [22, 0],
        scale: [0.985, 1],
        duration: 1050,
      },
      40
    );
  }

  // B. Traçado arquitetônico das linhas orbitais (Trilha guia -> Linha principal -> Nós na curva)
  if (drawableTracks.length) {
    introTimeline.add(
      drawableTracks,
      {
        draw: ['0 0', '0 1'],
        duration: 760,
        delay: stagger(110),
        ease: 'outCubic',
      },
      80
    );
  }

  if (drawableTopMain.length) {
    introTimeline.add(
      drawableTopMain,
      {
        draw: ['0 0', '0 1'],
        duration: 1420,
        ease: 'outQuart',
      },
      160
    );
  }

  if (topNodeCtrl) {
    if (topNodeCtrl.core) {
      introTimeline.add(
        topNodeCtrl.core,
        {
          scale: [0, 1],
          opacity: [0, 1],
          ease: spring({ bounce: 0.36, duration: 640 }),
        },
        240
      );
    }
    introTimeline.add(
      topNodeCtrl,
      {
        t: [0, topNodeCtrl.anchorT],
        duration: 1180,
        ease: 'outQuart',
        onUpdate: topNodeCtrl.syncPosition,
      },
      160
    );
  }

  if (drawableBottomMain.length) {
    introTimeline.add(
      drawableBottomMain,
      {
        draw: ['0 0', '0 1'],
        duration: 1260,
        ease: 'outQuart',
      },
      300
    );
  }

  if (bottomNodeCtrl) {
    if (bottomNodeCtrl.core) {
      introTimeline.add(
        bottomNodeCtrl.core,
        {
          scale: [0, 1],
          opacity: [0, 1],
          ease: spring({ bounce: 0.36, duration: 640 }),
        },
        380
      );
    }
    introTimeline.add(
      bottomNodeCtrl,
      {
        t: [0, bottomNodeCtrl.anchorT],
        duration: 1080,
        ease: 'outQuart',
        onUpdate: bottomNodeCtrl.syncPosition,
      },
      300
    );
  }

  if (drawableFineArcs.length) {
    introTimeline.add(
      drawableFineArcs,
      {
        draw: ['0 0', '0 1'],
        duration: 1050,
        delay: stagger(140),
        ease: 'outCubic',
      },
      420
    );
  }

  if (drawableCornerHairlines.length) {
    introTimeline.add(
      drawableCornerHairlines,
      {
        draw: ['0 0', '0 1'],
        duration: 1000,
        delay: stagger(140),
        ease: 'outCubic',
      },
      260
    );
  }

  // C. Eyebrow + Headline H1 em 3 linhas ("Transformamos / ideias em / grandes conexões.")
  if (eyebrowWords.length) {
    introTimeline.add(
      eyebrowWords,
      {
        opacity: [0, 1],
        translateY: ['110%', '0%'],
        duration: 620,
        delay: stagger(70),
      },
      100
    );
  }

  if (eyebrowDots.length) {
    introTimeline.add(
      eyebrowDots,
      {
        opacity: [0, 1],
        scale: [0, 1],
        delay: stagger(90),
        ease: spring({ bounce: 0.45, duration: 560 }),
      },
      210
    );
  }

  if (h1DarkWords.length) {
    introTimeline.add(
      h1DarkWords,
      {
        opacity: [0, 1],
        translateY: ['112%', '0%'],
        rotateX: [-38, 0],
        duration: 840,
        delay: stagger(85),
      },
      220
    );
  }

  if (h1AccentWords.length) {
    introTimeline.add(
      h1AccentWords,
      {
        opacity: [0, 1],
        translateY: ['116%', '0%'],
        rotateX: [-44, 0],
        color: ['#171717', '#F47721'],
        delay: stagger(95),
        ease: spring({ bounce: 0.24, duration: 780 }),
      },
      450
    );
  }

  // D. Parágrafo de apoio + Botão CTA Pílula
  if (descriptionEl) {
    introTimeline.add(
      descriptionEl,
      {
        opacity: [0, 1],
        translateY: [16, 0],
        duration: 680,
      },
      640
    );
  }

  if (ctaWrapper) {
    introTimeline.add(
      ctaWrapper,
      {
        opacity: [0, 1],
        translateY: [16, 0],
        scale: [0.97, 1],
        duration: 680,
      },
      760
    );
  }

  // E. Divisores verticais de 1px + Desenho vetorial dos 3 ícones + Textos dos pilares
  if (pillarDividers.length) {
    introTimeline.add(
      pillarDividers,
      {
        scaleY: [0, 1],
        duration: 640,
        delay: stagger(110),
        ease: 'outQuart',
      },
      860
    );
  }

  if (drawablePillarStrokes.length) {
    introTimeline.add(
      drawablePillarStrokes,
      {
        draw: ['0 0', '0 1'],
        duration: 760,
        delay: stagger(34),
        ease: 'outCubic',
      },
      880
    );
  }

  if (pillarTexts.length) {
    introTimeline.add(
      pillarTexts,
      {
        opacity: [0, 1],
        translateY: [10, 0],
        duration: 580,
        delay: stagger(95),
      },
      960
    );
  }

  // F. Linha horizontal de assinatura + "Criade. Sua marca em boas mãos."
  if (signatureLine) {
    introTimeline.add(
      signatureLine,
      {
        scaleX: [0, 1],
        duration: 720,
        ease: 'outExpo',
      },
      1080
    );
  }

  if (signatureText) {
    introTimeline.add(
      signatureText,
      {
        opacity: [0, 1],
        translateX: [-8, 0],
        duration: 620,
      },
      1160
    );
  }

  // Microinterações de Hover nos 3 Pilares (redesenha o traço de destaque em laranja)
  if (finePointer) {
    pillarItems.forEach((pillar) => {
      const accentStrokes = Array.from(
        pillar.querySelectorAll<SVGGeometryElement>('[data-pillar-accent]')
      );
      if (!accentStrokes.length) return;
      const accentDrawables = createDrawable(accentStrokes);

      const onEnter = () => {
        animate(accentDrawables, {
          draw: ['0 0', '0 1'],
          duration: 520,
          delay: stagger(40),
          ease: 'outQuart',
        });
      };

      pillar.addEventListener('pointerenter', onEnter);
      cleanups.push(() => pillar.removeEventListener('pointerenter', onEnter));
    });
  }

  // Parallax diferencial sob demanda (sem loop RAF ocioso) + CTA Magnético
  if (finePointer && desktop && (studioVisual || linesParallaxLayers.length)) {
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let rafId = 0;

    const tickParallax = () => {
      currentX += (targetX - currentX) * 0.09;
      currentY += (targetY - currentY) * 0.09;

      const lineTransform = `translate3d(${(currentX * 9).toFixed(2)}px, ${(currentY * 7).toFixed(2)}px, 0)`;
      linesParallaxLayers.forEach((layer) => {
        layer.style.transform = lineTransform;
      });
      if (studioVisual) {
        studioVisual.style.transform = `translate3d(${(currentX * -5).toFixed(2)}px, ${(currentY * -4).toFixed(2)}px, 0)`;
      }

      if (Math.abs(targetX - currentX) > 0.002 || Math.abs(targetY - currentY) > 0.002) {
        rafId = window.requestAnimationFrame(tickParallax);
      } else {
        rafId = 0;
      }
    };

    const scheduleTick = () => {
      if (!rafId) rafId = window.requestAnimationFrame(tickParallax);
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = hero.getBoundingClientRect();
      targetX = (e.clientX - rect.left) / rect.width - 0.5;
      targetY = (e.clientY - rect.top) / rect.height - 0.5;
      scheduleTick();
    };

    const onPointerLeave = () => {
      targetX = 0;
      targetY = 0;
      scheduleTick();
    };

    hero.addEventListener('pointermove', onPointerMove, { passive: true });
    hero.addEventListener('pointerleave', onPointerLeave, { passive: true });
    cleanups.push(() => {
      hero.removeEventListener('pointermove', onPointerMove);
      hero.removeEventListener('pointerleave', onPointerLeave);
      if (rafId) window.cancelAnimationFrame(rafId);
    });
  }

  if (finePointer) {
    const magneticBtn = hero.querySelector<HTMLElement>('[data-magnetic]');
    const magneticInner = magneticBtn?.querySelector<HTMLElement>('[data-magnetic-text]');
    if (magneticBtn) {
      const onBtnMove = (e: PointerEvent) => {
        const r = magneticBtn.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        magneticBtn.style.transform = `translate3d(${(dx * 0.16).toFixed(2)}px, ${(dy * 0.22).toFixed(2)}px, 0)`;
        if (magneticInner) {
          magneticInner.style.transform = `translate3d(${(dx * 0.06).toFixed(2)}px, ${(dy * 0.08).toFixed(2)}px, 0)`;
        }
      };
      const onBtnLeave = () => {
        animate(magneticBtn, {
          translateX: 0,
          translateY: 0,
          ease: spring({ bounce: 0.35, duration: 520 }),
        });
        if (magneticInner) {
          animate(magneticInner, {
            translateX: 0,
            translateY: 0,
            ease: spring({ bounce: 0.35, duration: 520 }),
          });
        }
      };
      magneticBtn.addEventListener('pointermove', onBtnMove, { passive: true });
      magneticBtn.addEventListener('pointerleave', onBtnLeave, { passive: true });
      cleanups.push(() => {
        magneticBtn.removeEventListener('pointermove', onBtnMove);
        magneticBtn.removeEventListener('pointerleave', onBtnLeave);
      });
    }
  }

  // Controle inteligente de ciclo de vida: pausa loops quando fora da tela ou aba oculta
  const syncPlaybackState = () => {
    const shouldPlay = isVisibleInViewport && !document.hidden;
    ambientAnimations.forEach((anim) => {
      if (shouldPlay) anim.play();
      else anim.pause();
    });
  };

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        isVisibleInViewport = entry.isIntersecting;
        syncPlaybackState();
      },
      { threshold: 0.05 }
    );
    io.observe(hero);
    cleanups.push(() => io.disconnect());
  }

  document.addEventListener('visibilitychange', syncPlaybackState);
  cleanups.push(() => document.removeEventListener('visibilitychange', syncPlaybackState));

  return {
    destroy() {
      cleanups.forEach((fn) => fn());
      introTimeline?.cancel();
      ambientAnimations.forEach((anim) => anim.cancel());
    },
  };
}
