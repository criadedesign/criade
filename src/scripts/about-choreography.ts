import {
  animate,
  createDrawable,
  createTimeline,
  spring,
  stagger,
  type JSAnimation,
  type Timeline,
} from 'animejs';

export interface AboutChoreographyHandle {
  destroy: () => void;
}

/**
 * Coreografia Editorial da Seção "Sobre a Criade" na Home (Anime.js v4.5)
 */
export function mountAboutChoreography(
  section: HTMLElement,
  options: { finePointer: boolean }
): AboutChoreographyHandle {
  const { finePointer } = options;

  const cleanups: Array<() => void> = [];
  const activeAnimations: Array<JSAnimation | Timeline> = [];
  let masterTimeline: Timeline | null = null;
  let hasEntered = false;
  let isInViewport = false;

  const eyebrowLine = section.querySelector<HTMLElement>('[data-about-eyebrow-line]');
  const eyebrowText = section.querySelector<HTMLElement>('[data-about-eyebrow-text]');
  const headingLines = Array.from(
    section.querySelectorAll<HTMLElement>('[data-about-heading-line]')
  );
  const photoFrame = section.querySelector<HTMLElement>('[data-about-photo-frame]');
  const photoImg = section.querySelector<HTMLElement>('[data-about-photo-img]');
  const reticle = section.querySelector<SVGElement>('[data-about-reticle]');
  const drawablePaths = Array.from(
    section.querySelectorAll<SVGPathElement>('[data-about-drawable]')
  );
  const dividerLine = section.querySelector<HTMLElement>('[data-about-divider]');
  const copyBlocks = Array.from(
    section.querySelectorAll<HTMLElement>('[data-about-copy]')
  );
  const closingBlock = section.querySelector<HTMLElement>('[data-about-closing]');
  const ctaButton = section.querySelector<HTMLElement>('[data-about-cta]');

  const drawables = drawablePaths.length ? createDrawable(drawablePaths) : [];

  function startAmbientLoops() {
    if (!reticle) return;
    const reticleAnim = animate(reticle, {
      rotate: [0, 90, 180],
      scale: [1, 1.12, 1],
      duration: 9000,
      ease: 'inOutSine',
      loop: true,
    });
    activeAnimations.push(reticleAnim);
    if (!isInViewport || document.hidden) {
      reticleAnim.pause();
    }
  }

  function playEntrance() {
    if (hasEntered) return;
    hasEntered = true;
    section.classList.remove('about-pending');

    masterTimeline = createTimeline({
      defaults: { ease: 'outExpo' },
      onComplete: startAmbientLoops,
    });

    if (photoFrame) {
      masterTimeline.add(
        photoFrame,
        {
          opacity: [0, 1],
          translateY: [28, 0],
          scale: [0.96, 1],
          duration: 850,
          ease: 'outQuart',
        },
        0
      );
    }

    if (photoImg) {
      masterTimeline.add(
        photoImg,
        {
          scale: [1.08, 1],
          duration: 1250,
          ease: 'outCubic',
        },
        0
      );
    }

    if (drawables.length) {
      masterTimeline.add(
        drawables,
        {
          draw: ['0 0', '0 1'],
          duration: 1100,
          delay: stagger(120),
          ease: 'outQuart',
        },
        140
      );
    }

    if (eyebrowLine) {
      masterTimeline.add(
        eyebrowLine,
        {
          scaleX: [0, 1],
          duration: 480,
          ease: 'outQuart',
        },
        100
      );
    }

    if (eyebrowText) {
      masterTimeline.add(
        eyebrowText,
        {
          opacity: [0, 1],
          translateX: [-10, 0],
          duration: 480,
          ease: 'outQuart',
        },
        160
      );
    }

    if (headingLines.length) {
      masterTimeline.add(
        headingLines,
        {
          opacity: [0, 1],
          translateY: [24, 0],
          rotateX: [18, 0],
          duration: 680,
          delay: stagger(95),
          ease: 'outQuart',
        },
        200
      );
    }

    if (dividerLine) {
      masterTimeline.add(
        dividerLine,
        {
          scaleY: [0, 1],
          opacity: [0, 1],
          duration: 620,
          ease: 'outQuart',
        },
        320
      );
    }

    if (copyBlocks.length) {
      masterTimeline.add(
        copyBlocks,
        {
          opacity: [0, 1],
          translateY: [20, 0],
          duration: 650,
          delay: stagger(130),
          ease: 'outQuart',
        },
        360
      );
    }

    if (closingBlock) {
      masterTimeline.add(
        closingBlock,
        {
          opacity: [0, 1],
          translateY: [18, 0],
          duration: 620,
          ease: 'outQuart',
        },
        560
      );
    }

    if (ctaButton) {
      masterTimeline.add(
        ctaButton,
        {
          opacity: [0, 1],
          translateY: [16, 0],
          scale: [0.94, 1],
          duration: 680,
          ease: spring({ bounce: 0.25, duration: 680 }),
        },
        640
      );
    }
  }

  if (finePointer) {
    if (photoFrame) {
      let rafId: number | null = null;

      const onMove = (e: PointerEvent) => {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          const rect = photoFrame.getBoundingClientRect();
          const nx = (e.clientX - rect.left) / rect.width - 0.5;
          const ny = (e.clientY - rect.top) / rect.height - 0.5;
          const rotX = (-ny * 6).toFixed(2);
          const rotY = (nx * 6).toFixed(2);
          photoFrame.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(0)`;
        });
      };

      const onLeave = () => {
        if (rafId) cancelAnimationFrame(rafId);
        photoFrame.style.transform = '';
      };

      photoFrame.addEventListener('pointermove', onMove, { passive: true });
      photoFrame.addEventListener('pointerleave', onLeave, { passive: true });
      cleanups.push(() => {
        photoFrame.removeEventListener('pointermove', onMove);
        photoFrame.removeEventListener('pointerleave', onLeave);
        if (rafId) cancelAnimationFrame(rafId);
      });
    }

    if (ctaButton) {
      const onBtnMove = (e: PointerEvent) => {
        const rect = ctaButton.getBoundingClientRect();
        const dx = (e.clientX - (rect.left + rect.width / 2)) * 0.18;
        const dy = (e.clientY - (rect.top + rect.height / 2)) * 0.22;
        ctaButton.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0)`;
      };

      const onBtnLeave = () => {
        ctaButton.style.transform = '';
      };

      ctaButton.addEventListener('pointermove', onBtnMove, { passive: true });
      ctaButton.addEventListener('pointerleave', onBtnLeave, { passive: true });
      cleanups.push(() => {
        ctaButton.removeEventListener('pointermove', onBtnMove);
        ctaButton.removeEventListener('pointerleave', onBtnLeave);
      });
    }
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        isInViewport = entry.isIntersecting;
        if (entry.isIntersecting) {
          playEntrance();
          activeAnimations.forEach((a) => a.play());
        } else {
          activeAnimations.forEach((a) => a.pause());
        }
      });
    },
    { threshold: 0.14 }
  );

  observer.observe(section);
  cleanups.push(() => observer.disconnect());

  const onVisibilityChange = () => {
    if (document.hidden) {
      activeAnimations.forEach((a) => a.pause());
    } else if (isInViewport) {
      activeAnimations.forEach((a) => a.play());
    }
  };
  document.addEventListener('visibilitychange', onVisibilityChange);
  cleanups.push(() => document.removeEventListener('visibilitychange', onVisibilityChange));

  return {
    destroy: () => {
      cleanups.forEach((fn) => fn());
      activeAnimations.forEach((a) => {
        try {
          a.pause();
        } catch {}
      });
      if (masterTimeline) {
        try {
          masterTimeline.pause();
        } catch {}
      }
    },
  };
}
