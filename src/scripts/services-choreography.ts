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

export interface ServicesChoreographyHandle {
  destroy: () => void;
}

/**
 * Coreografia Editorial & Bento Grid 2x3 da Seção "Nossos Serviços" (Anime.js v4.5)
 * - Gatilho inteligente no scroll (IntersectionObserver) sem custo de CPU antes de entrar na viewport
 * - Linhas orbitais contínuas via createDrawable + física Bezier no nó ancorado junto ao Card 01
 * - Stagger matricial 2D (grid: [2, 3]) nos 6 cards + desenho ao vivo dos 6 ícones line-art laranjas
 * - Microinterações táteis de hover (redesenho do ícone, tilt sutil 3D em GPU e spotlight quente)
 */
export function mountServicesChoreography(
  section: HTMLElement,
  options: { finePointer: boolean; desktop: boolean }
): ServicesChoreographyHandle {
  const { finePointer, desktop } = options;

  const cleanups: Array<() => void> = [];
  const ambientAnimations: Array<JSAnimation | Timeline> = [];
  let masterTimeline: Timeline | null = null;
  let hasPlayedEntrance = false;
  let isInViewport = false;

  // Seletores de linhas orbitais
  const orbitTracks = Array.from(
    section.querySelectorAll<SVGPathElement>('[data-services-orbit-track]')
  );
  const orbitTopMain = section.querySelector<SVGPathElement>('[data-services-orbit="top"]');
  const orbitBottomMain = section.querySelector<SVGPathElement>('[data-services-orbit="bottom"]');
  const orbitPulseTop = section.querySelector<SVGPathElement>('[data-services-pulse="top"]');
  const orbitPulseBottom = section.querySelector<SVGPathElement>('[data-services-pulse="bottom"]');
  const orbitNodeGroup = section.querySelector<SVGGElement>('[data-services-node="top"]');
  const nodeCore = orbitNodeGroup?.querySelector<SVGCircleElement>('[data-node-core]') ?? null;
  const nodeHalo = orbitNodeGroup?.querySelector<SVGCircleElement>('[data-node-halo]') ?? null;

  // Seletores da coluna esquerda
  const eyebrowLine = section.querySelector<HTMLElement>('[data-services-eyebrow-line]');
  const eyebrowText = section.querySelector<HTMLElement>('[data-services-eyebrow-text]');
  const h2DarkWords = Array.from(
    section.querySelectorAll<HTMLElement>('[data-services-word="dark"]')
  );
  const h2AccentWords = Array.from(
    section.querySelectorAll<HTMLElement>('[data-services-word="accent"]')
  );
  const descriptionEl = section.querySelector<HTMLElement>('[data-services-description]');
  const ctaWrap = section.querySelector<HTMLElement>('[data-services-cta]');
  const ctaDot = section.querySelector<HTMLElement>('[data-services-cta-dot]');
  const deskVignette = section.querySelector<HTMLElement>('[data-services-desk]');

  // Seletores dos 6 cards Bento
  const cards = Array.from(section.querySelectorAll<HTMLElement>('[data-service-card]'));
  const cardVisuals = Array.from(section.querySelectorAll<HTMLElement>('[data-card-visual]'));
  const allIconStrokes = Array.from(
    section.querySelectorAll<SVGGeometryElement>('[data-service-card] [data-service-stroke]')
  );

  // Drawables vetoriais pré-cacheados
  const drawableTracks = orbitTracks.length ? createDrawable(orbitTracks) : [];
  const drawableOrbitTop = orbitTopMain ? createDrawable(orbitTopMain) : [];
  const drawableOrbitBottom = orbitBottomMain ? createDrawable(orbitBottomMain) : [];
  const drawablePulseTop = orbitPulseTop ? createDrawable(orbitPulseTop) : [];
  const drawablePulseBottom = orbitPulseBottom ? createDrawable(orbitPulseBottom) : [];
  const drawableIcons = allIconStrokes.length ? createDrawable(allIconStrokes) : [];

  // Controlador Bezier pré-calculado do nó orbital superior (ancorado à esquerda do Card 01)
  const topOrbitLen = orbitTopMain ? orbitTopMain.getTotalLength() : 0;
  const nodeState = {
    t: 0,
    anchorT: 0.365,
    sync() {
      if (!orbitTopMain || !orbitNodeGroup || !topOrbitLen) return;
      const clamped = Math.max(0, Math.min(1, nodeState.t));
      const pt = orbitTopMain.getPointAtLength(clamped * topOrbitLen);
      orbitNodeGroup.setAttribute('transform', `translate(${pt.x.toFixed(2)} ${pt.y.toFixed(2)})`);
    },
  };
  nodeState.sync();

  // Estado inicial determinístico antes de entrar na viewport
  if (drawableTracks.length) utils.set(drawableTracks, { draw: '0 0', opacity: 1 });
  if (drawableOrbitTop.length) utils.set(drawableOrbitTop, { draw: '0 0', opacity: 1 });
  if (drawableOrbitBottom.length) utils.set(drawableOrbitBottom, { draw: '0 0', opacity: 1 });
  if (drawablePulseTop.length) utils.set(drawablePulseTop, { draw: '0 0', opacity: 0 });
  if (drawablePulseBottom.length) utils.set(drawablePulseBottom, { draw: '0 0', opacity: 0 });
  if (drawableIcons.length) utils.set(drawableIcons, { draw: '0 0' });

  if (nodeCore) utils.set(nodeCore, { scale: 0, opacity: 0 });
  if (nodeHalo) utils.set(nodeHalo, { scale: 0.5, opacity: 0 });

  if (eyebrowLine) utils.set(eyebrowLine, { scaleX: 0, opacity: 1, transformOrigin: '0% 50%' });
  if (eyebrowText) utils.set(eyebrowText, { opacity: 0, translateX: -8 });
  if (h2DarkWords.length) {
    utils.set(h2DarkWords, { opacity: 0, translateY: '112%', rotateX: -36 });
  }
  if (h2AccentWords.length) {
    utils.set(h2AccentWords, {
      opacity: 0,
      translateY: '116%',
      rotateX: -42,
      color: '#141413',
    });
  }
  if (descriptionEl) utils.set(descriptionEl, { opacity: 0, translateY: 16 });
  if (ctaWrap) utils.set(ctaWrap, { opacity: 0, translateY: 14 });
  if (deskVignette) utils.set(deskVignette, { opacity: 0, translateY: 28, scale: 0.98 });

  if (cards.length) {
    utils.set(cards, { opacity: 0, translateY: 26, scale: 0.975 });
  }
  if (cardVisuals.length) {
    utils.set(cardVisuals, { scale: 1.09 });
  }

  const startAmbientLoops = () => {
    if (drawablePulseTop.length) {
      utils.set(drawablePulseTop, { opacity: 0.9 });
      ambientAnimations.push(
        animate(drawablePulseTop, {
          draw: ['0 0', '0 0.12', '0.88 1', '1 1'],
          duration: 3800,
          loop: true,
          loopDelay: 2000,
          ease: 'inOutSine',
        })
      );
    }

    if (drawablePulseBottom.length) {
      utils.set(drawablePulseBottom, { opacity: 0.88 });
      ambientAnimations.push(
        animate(drawablePulseBottom, {
          draw: ['0 0', '0 0.16', '0.84 1', '1 1'],
          duration: 3300,
          delay: 1400,
          loop: true,
          loopDelay: 2300,
          ease: 'inOutSine',
        })
      );
    }

    if (orbitTopMain && orbitNodeGroup) {
      ambientAnimations.push(
        animate(nodeState, {
          t: [nodeState.anchorT - 0.022, nodeState.anchorT + 0.022],
          duration: 4400,
          alternate: true,
          loop: true,
          ease: 'inOutSine',
          onUpdate: nodeState.sync,
        })
      );
    }

    if (nodeHalo) {
      ambientAnimations.push(
        animate(nodeHalo, {
          scale: [1, 2.55],
          opacity: [0.55, 0],
          duration: 2800,
          loop: true,
          loopDelay: 950,
          ease: 'outCubic',
        })
      );
    }

    if (ctaDot) {
      ambientAnimations.push(
        animate(ctaDot, {
          scale: [1, 1.28, 1],
          duration: 2400,
          loop: true,
          loopDelay: 800,
          ease: 'inOutSine',
        })
      );
    }

    if (!isInViewport || document.hidden) {
      ambientAnimations.forEach((a) => a.pause());
    }
  };

  const playEntrance = () => {
    if (hasPlayedEntrance) return;
    hasPlayedEntrance = true;

    masterTimeline = createTimeline({
      defaults: { ease: 'outExpo' },
      onComplete: startAmbientLoops,
    });

    // 1. Curvas orbitais contínuas + Nó Bezier
    if (drawableTracks.length) {
      masterTimeline.add(
        drawableTracks,
        {
          draw: ['0 0', '0 1'],
          duration: 720,
          delay: stagger(100),
          ease: 'outCubic',
        },
        0
      );
    }

    if (drawableOrbitTop.length) {
      masterTimeline.add(
        drawableOrbitTop,
        {
          draw: ['0 0', '0 1'],
          duration: 1320,
          ease: 'outQuart',
        },
        80
      );
    }

    if (nodeCore) {
      masterTimeline.add(
        nodeCore,
        {
          scale: [0, 1],
          opacity: [0, 1],
          ease: spring({ bounce: 0.36, duration: 640 }),
        },
        200
      );
    }

    if (orbitTopMain && orbitNodeGroup) {
      masterTimeline.add(
        nodeState,
        {
          t: [0, nodeState.anchorT],
          duration: 1120,
          ease: 'outQuart',
          onUpdate: nodeState.sync,
        },
        80
      );
    }

    if (drawableOrbitBottom.length) {
      masterTimeline.add(
        drawableOrbitBottom,
        {
          draw: ['0 0', '0 1'],
          duration: 1180,
          ease: 'outQuart',
        },
        240
      );
    }

    // 2. Eyebrow + Título H2 em 4 linhas + Descrição + CTA + Estação de Estúdio
    if (eyebrowLine) {
      masterTimeline.add(eyebrowLine, { scaleX: [0, 1], duration: 600 }, 40);
    }
    if (eyebrowText) {
      masterTimeline.add(eyebrowText, { opacity: [0, 1], translateX: [-8, 0], duration: 560 }, 110);
    }

    if (h2DarkWords.length) {
      masterTimeline.add(
        h2DarkWords,
        {
          opacity: [0, 1],
          translateY: ['112%', '0%'],
          rotateX: [-36, 0],
          duration: 800,
          delay: stagger(65),
        },
        160
      );
    }

    if (h2AccentWords.length) {
      masterTimeline.add(
        h2AccentWords,
        {
          opacity: [0, 1],
          translateY: ['116%', '0%'],
          rotateX: [-42, 0],
          color: ['#141413', '#F47721'],
          delay: stagger(90),
          ease: spring({ bounce: 0.25, duration: 760 }),
        },
        420
      );
    }

    if (descriptionEl) {
      masterTimeline.add(
        descriptionEl,
        { opacity: [0, 1], translateY: [16, 0], duration: 640 },
        540
      );
    }

    if (ctaWrap) {
      masterTimeline.add(ctaWrap, { opacity: [0, 1], translateY: [14, 0], duration: 620 }, 640);
    }

    if (deskVignette) {
      masterTimeline.add(
        deskVignette,
        {
          opacity: [0, 1],
          translateY: [28, 0],
          scale: [0.98, 1],
          duration: 980,
        },
        360
      );
    }

    // 3. Bento Grid 2x3 com Stagger Matricial 2D + Desenho ao Vivo dos Ícones
    if (cards.length) {
      const gridStagger = desktop
        ? stagger(95, { grid: [2, 3], from: 'first' })
        : stagger(85);
      masterTimeline.add(
        cards,
        {
          opacity: [0, 1],
          translateY: [26, 0],
          scale: [0.975, 1],
          duration: 780,
          delay: gridStagger,
        },
        220
      );
    }

    if (cardVisuals.length) {
      const visualStagger = desktop
        ? stagger(95, { grid: [2, 3], from: 'first' })
        : stagger(85);
      masterTimeline.add(
        cardVisuals,
        {
          scale: [1.09, 1],
          duration: 1050,
          delay: visualStagger,
          ease: 'outExpo',
        },
        240
      );
    }

    if (drawableIcons.length) {
      masterTimeline.add(
        drawableIcons,
        {
          draw: ['0 0', '0 1'],
          duration: 740,
          delay: stagger(28),
          ease: 'outCubic',
        },
        380
      );
    }
  };

  // Microinterações táteis nos 6 cards + CTA magnético (apenas pointer fino)
  if (finePointer) {
    cards.forEach((card) => {
      const accentStrokes = Array.from(
        card.querySelectorAll<SVGGeometryElement>('[data-service-accent]')
      );
      const iconWrap = card.querySelector<HTMLElement>('[data-card-icon]');
      const accentDrawables = accentStrokes.length ? createDrawable(accentStrokes) : [];

      const onEnter = () => {
        if (accentDrawables.length) {
          animate(accentDrawables, {
            draw: ['0 0', '0 1'],
            duration: 500,
            delay: stagger(45),
            ease: 'outQuart',
          });
        }
        if (iconWrap) {
          animate(iconWrap, {
            translateY: [0, -3, 0],
            scale: [1, 1.07, 1],
            duration: 480,
            ease: 'outBack',
          });
        }
      };

      const onMove = (e: PointerEvent) => {
        if (!desktop) return;
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--card-mx', `${(px * 100).toFixed(1)}%`);
        card.style.setProperty('--card-my', `${(py * 100).toFixed(1)}%`);
        const rotY = (px - 0.5) * 4.2;
        const rotX = (0.5 - py) * 3.6;
        card.style.transform = `perspective(900px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translateY(-3px)`;
      };

      const onLeave = () => {
        if (!desktop) return;
        animate(card, {
          rotateX: 0,
          rotateY: 0,
          translateY: 0,
          ease: spring({ bounce: 0.3, duration: 540 }),
        });
      };

      card.addEventListener('pointerenter', onEnter, { passive: true });
      card.addEventListener('pointermove', onMove, { passive: true });
      card.addEventListener('pointerleave', onLeave, { passive: true });
      cleanups.push(() => {
        card.removeEventListener('pointerenter', onEnter);
        card.removeEventListener('pointermove', onMove);
        card.removeEventListener('pointerleave', onLeave);
      });
    });

    const ctaBtn = section.querySelector<HTMLElement>('[data-services-magnetic]');
    if (ctaBtn) {
      const onBtnMove = (e: PointerEvent) => {
        const r = ctaBtn.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        ctaBtn.style.transform = `translate3d(${(dx * 0.15).toFixed(2)}px, ${(dy * 0.22).toFixed(2)}px, 0)`;
      };
      const onBtnLeave = () => {
        animate(ctaBtn, {
          translateX: 0,
          translateY: 0,
          ease: spring({ bounce: 0.35, duration: 500 }),
        });
      };
      ctaBtn.addEventListener('pointermove', onBtnMove, { passive: true });
      ctaBtn.addEventListener('pointerleave', onBtnLeave, { passive: true });
      cleanups.push(() => {
        ctaBtn.removeEventListener('pointermove', onBtnMove);
        ctaBtn.removeEventListener('pointerleave', onBtnLeave);
      });
    }
  }

  // Controle de visibilidade: dispara a entrada na primeira visualização e pausa loops fora de tela
  const syncAmbientPlayback = () => {
    const active = isInViewport && !document.hidden;
    ambientAnimations.forEach((anim) => {
      if (active) anim.play();
      else anim.pause();
    });
  };

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        isInViewport = entry.isIntersecting;
        if (entry.isIntersecting && !hasPlayedEntrance) {
          section.classList.remove('services-pending');
          playEntrance();
        }
        syncAmbientPlayback();
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    io.observe(section);
    cleanups.push(() => io.disconnect());
  } else {
    isInViewport = true;
    section.classList.remove('services-pending');
    playEntrance();
  }

  document.addEventListener('visibilitychange', syncAmbientPlayback);
  cleanups.push(() => document.removeEventListener('visibilitychange', syncAmbientPlayback));

  return {
    destroy() {
      cleanups.forEach((fn) => fn());
      masterTimeline?.cancel();
      ambientAnimations.forEach((anim) => anim.cancel());
    },
  };
}

