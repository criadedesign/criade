import {
  animate,
  createDrawable,
  createTimeline,
  spring,
  stagger,
  type JSAnimation,
  type Timeline,
} from 'animejs';

export interface SobrePageChoreographyHandle {
  destroy: () => void;
}

export function mountSobrePageChoreography(
  root: HTMLElement,
  options: { finePointer: boolean }
): SobrePageChoreographyHandle {
  const { finePointer } = options;
  const cleanups: Array<() => void> = [];
  const activeLoops: Array<JSAnimation | Timeline> = [];
  const timelines: Timeline[] = [];

  const heroSection = root.querySelector<HTMLElement>('[data-sobre-hero]');
  if (heroSection) {
    heroSection.classList.remove('sobre-pending');

    const indexBar = heroSection.querySelector<HTMLElement>('[data-sobre-hero-index]');
    const titleLines = Array.from(
      heroSection.querySelectorAll<HTMLElement>('[data-sobre-hero-line]')
    );
    const accentWords = Array.from(
      heroSection.querySelectorAll<HTMLElement>('[data-sobre-hero-accent]')
    );
    const heroDrawables = Array.from(
      heroSection.querySelectorAll<SVGGeometryElement>('[data-sobre-hero-drawable]')
    );
    const artStage = heroSection.querySelector<HTMLElement>('[data-sobre-art-stage]');
    const artImage = heroSection.querySelector<HTMLElement>('[data-sobre-art-img]');
    const manifestoCards = Array.from(
      heroSection.querySelectorAll<HTMLElement>('[data-sobre-manifesto-item]')
    );
    const compassWheel = heroSection.querySelector<SVGElement>('[data-sobre-compass]');

    const heroTl = createTimeline({
      defaults: { ease: 'outExpo' },
      onComplete: () => {
        if (compassWheel) {
          const loopAnim = animate(compassWheel, {
            rotate: [0, 360],
            duration: 38000,
            ease: 'linear',
            loop: true,
          });
          activeLoops.push(loopAnim);
        }
      },
    });
    timelines.push(heroTl);

    if (indexBar) {
      heroTl.add(
        indexBar,
        {
          opacity: [0, 1],
          translateY: [-14, 0],
          duration: 550,
          ease: 'outQuart',
        },
        0
      );
    }

    if (titleLines.length) {
      heroTl.add(
        titleLines,
        {
          opacity: [0, 1],
          translateY: [36, 0],
          rotateX: [22, 0],
          duration: 780,
          delay: stagger(110),
          ease: 'outQuart',
        },
        100
      );
    }

    if (accentWords.length) {
      heroTl.add(
        accentWords,
        {
          opacity: [0, 1],
          scale: [0.94, 1],
          duration: 720,
          ease: spring({ bounce: 0.28, duration: 720 }),
        },
        360
      );
    }

    if (artStage) {
      heroTl.add(
        artStage,
        {
          opacity: [0, 1],
          translateY: [32, 0],
          scale: [0.96, 1],
          duration: 920,
          ease: 'outQuart',
        },
        180
      );
    }

    if (artImage) {
      heroTl.add(
        artImage,
        {
          scale: [1.1, 1],
          duration: 1350,
          ease: 'outCubic',
        },
        180
      );
    }

    if (heroDrawables.length) {
      const drawableTargets = createDrawable(heroDrawables);
      heroTl.add(
        drawableTargets,
        {
          draw: ['0 0', '0 1'],
          duration: 1250,
          delay: stagger(140),
          ease: 'outQuart',
        },
        260
      );
    }

    if (manifestoCards.length) {
      heroTl.add(
        manifestoCards,
        {
          opacity: [0, 1],
          translateY: [22, 0],
          duration: 680,
          delay: stagger(110),
          ease: 'outQuart',
        },
        480
      );
    }

    if (finePointer && artStage) {
      let rafId: number | null = null;
      const onMove = (e: PointerEvent) => {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          const rect = artStage.getBoundingClientRect();
          const nx = (e.clientX - rect.left) / rect.width - 0.5;
          const ny = (e.clientY - rect.top) / rect.height - 0.5;
          const rotX = (-ny * 5.5).toFixed(2);
          const rotY = (nx * 5.5).toFixed(2);
          artStage.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(0)`;
        });
      };
      const onLeave = () => {
        if (rafId) cancelAnimationFrame(rafId);
        artStage.style.transform = '';
      };

      artStage.addEventListener('pointermove', onMove, { passive: true });
      artStage.addEventListener('pointerleave', onLeave, { passive: true });
      cleanups.push(() => {
        artStage.removeEventListener('pointermove', onMove);
        artStage.removeEventListener('pointerleave', onLeave);
        if (rafId) cancelAnimationFrame(rafId);
      });
    }
  }

  const triadSection = root.querySelector<HTMLElement>('[data-sobre-triad]');
  if (triadSection) {
    const triadCards = Array.from(
      triadSection.querySelectorAll<HTMLElement>('[data-triad-card]')
    );
    const triadDrawables = Array.from(
      triadSection.querySelectorAll<SVGGeometryElement>('[data-triad-drawable]')
    );
    let triadEntered = false;

    const triadObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !triadEntered) {
            triadEntered = true;
            triadSection.classList.remove('sobre-pending');

            const tl = createTimeline({ defaults: { ease: 'outQuart' } });
            timelines.push(tl);

            if (triadCards.length) {
              tl.add(
                triadCards,
                {
                  opacity: [0, 1],
                  translateY: [34, 0],
                  scale: [0.97, 1],
                  duration: 760,
                  delay: stagger(130),
                },
                0
              );
            }

            if (triadDrawables.length) {
              const drawTargets = createDrawable(triadDrawables);
              tl.add(
                drawTargets,
                {
                  draw: ['0 0', '0 1'],
                  duration: 1150,
                  delay: stagger(90),
                  ease: 'outCubic',
                },
                220
              );
            }
          }
        });
      },
      { threshold: 0.15 }
    );

    triadObserver.observe(triadSection);
    cleanups.push(() => triadObserver.disconnect());

    if (finePointer) {
      triadCards.forEach((card) => {
        const onPointerMove = (e: PointerEvent) => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          card.style.setProperty('--spot-x', `${x.toFixed(1)}px`);
          card.style.setProperty('--spot-y', `${y.toFixed(1)}px`);
        };
        card.addEventListener('pointermove', onPointerMove, { passive: true });
        cleanups.push(() => card.removeEventListener('pointermove', onPointerMove));
      });
    }
  }

  const alchemySection = root.querySelector<HTMLElement>('[data-sobre-alchemy]');
  if (alchemySection) {
    const rows = Array.from(
      alchemySection.querySelectorAll<HTMLElement>('[data-alchemy-row]')
    );
    const bridges = Array.from(
      alchemySection.querySelectorAll<SVGGeometryElement>('[data-alchemy-drawable]')
    );
    let alchemyEntered = false;

    const alchemyObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !alchemyEntered) {
            alchemyEntered = true;
            alchemySection.classList.remove('sobre-pending');

            const tl = createTimeline({ defaults: { ease: 'outQuart' } });
            timelines.push(tl);

            if (rows.length) {
              tl.add(
                rows,
                {
                  opacity: [0, 1],
                  translateY: [26, 0],
                  duration: 700,
                  delay: stagger(140),
                },
                0
              );
            }

            if (bridges.length) {
              const bridgeDrawables = createDrawable(bridges);
              tl.add(
                bridgeDrawables,
                {
                  draw: ['0 0', '0 1'],
                  duration: 950,
                  delay: stagger(160),
                  ease: 'outExpo',
                },
                240
              );
            }
          }
        });
      },
      { threshold: 0.16 }
    );

    alchemyObserver.observe(alchemySection);
    cleanups.push(() => alchemyObserver.disconnect());
  }

  const methodSection = root.querySelector<HTMLElement>('[data-sobre-method]');
  if (methodSection) {
    const steps = Array.from(
      methodSection.querySelectorAll<HTMLElement>('[data-method-step]')
    );
    const methodPaths = Array.from(
      methodSection.querySelectorAll<SVGGeometryElement>('[data-method-drawable]')
    );
    let methodEntered = false;

    const methodObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !methodEntered) {
            methodEntered = true;
            methodSection.classList.remove('sobre-pending');

            const tl = createTimeline({ defaults: { ease: 'outQuart' } });
            timelines.push(tl);

            if (methodPaths.length) {
              const drawTargets = createDrawable(methodPaths);
              tl.add(
                drawTargets,
                {
                  draw: ['0 0', '0 1'],
                  duration: 1200,
                  ease: 'outCubic',
                },
                0
              );
            }

            if (steps.length) {
              tl.add(
                steps,
                {
                  opacity: [0, 1],
                  translateY: [24, 0],
                  duration: 660,
                  delay: stagger(110),
                },
                120
              );
            }
          }
        });
      },
      { threshold: 0.15 }
    );

    methodObserver.observe(methodSection);
    cleanups.push(() => methodObserver.disconnect());
  }

  const epilogueSection = root.querySelector<HTMLElement>('[data-sobre-epilogue]');
  if (epilogueSection) {
    const epilogueItems = Array.from(
      epilogueSection.querySelectorAll<HTMLElement>('[data-epilogue-item]')
    );
    const epilogueDrawables = Array.from(
      epilogueSection.querySelectorAll<SVGGeometryElement>('[data-epilogue-drawable]')
    );
    let epilogueEntered = false;

    const epilogueObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !epilogueEntered) {
            epilogueEntered = true;
            epilogueSection.classList.remove('sobre-pending');

            const tl = createTimeline({ defaults: { ease: 'outQuart' } });
            timelines.push(tl);

            if (epilogueDrawables.length) {
              const drawTargets = createDrawable(epilogueDrawables);
              tl.add(
                drawTargets,
                {
                  draw: ['0 0', '0 1'],
                  duration: 1100,
                  delay: stagger(140),
                },
                0
              );
            }

            if (epilogueItems.length) {
              tl.add(
                epilogueItems,
                {
                  opacity: [0, 1],
                  translateY: [24, 0],
                  duration: 720,
                  delay: stagger(120),
                },
                120
              );
            }
          }
        });
      },
      { threshold: 0.18 }
    );

    epilogueObserver.observe(epilogueSection);
    cleanups.push(() => epilogueObserver.disconnect());
  }

  if (finePointer) {
    const magneticButtons = Array.from(
      root.querySelectorAll<HTMLElement>('[data-sobre-magnetic]')
    );
    magneticButtons.forEach((btn) => {
      const onMove = (e: PointerEvent) => {
        const rect = btn.getBoundingClientRect();
        const dx = (e.clientX - (rect.left + rect.width / 2)) * 0.16;
        const dy = (e.clientY - (rect.top + rect.height / 2)) * 0.2;
        btn.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0)`;
      };
      const onLeave = () => {
        btn.style.transform = '';
      };
      btn.addEventListener('pointermove', onMove, { passive: true });
      btn.addEventListener('pointerleave', onLeave, { passive: true });
      cleanups.push(() => {
        btn.removeEventListener('pointermove', onMove);
        btn.removeEventListener('pointerleave', onLeave);
      });
    });
  }

  return {
    destroy: () => {
      cleanups.forEach((fn) => fn());
      activeLoops.forEach((anim) => {
        try {
          anim.pause();
        } catch {}
      });
      timelines.forEach((tl) => {
        try {
          tl.pause();
        } catch {}
      });
    },
  };
}

