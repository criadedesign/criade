import { createTimeline, stagger, type Timeline } from 'animejs';

export interface AboutChoreographyHandle {
  destroy: () => void;
}

/**
 * Coreografia Limpa e Objetiva da Seção "Sobre a Criade" (Anime.js v4.5)
 */
export function mountAboutChoreography(
  section: HTMLElement
): AboutChoreographyHandle {
  let masterTimeline: Timeline | null = null;
  let hasEntered = false;

  const eyebrowLine = section.querySelector<HTMLElement>('[data-about-eyebrow-line]');
  const eyebrowText = section.querySelector<HTMLElement>('[data-about-eyebrow-text]');
  const headingLines = Array.from(
    section.querySelectorAll<HTMLElement>('[data-about-heading-line]')
  );
  const photoFrame = section.querySelector<HTMLElement>('[data-about-photo-frame]');
  const photoImg = section.querySelector<HTMLElement>('[data-about-photo-img]');
  const dividerLine = section.querySelector<HTMLElement>('[data-about-divider]');
  const copyBlock = section.querySelector<HTMLElement>('[data-about-copy]');

  function playEntrance() {
    if (hasEntered) return;
    hasEntered = true;
    section.classList.remove('about-pending');

    masterTimeline = createTimeline({
      defaults: { ease: 'outQuart' },
    });

    if (photoFrame) {
      masterTimeline.add(
        photoFrame,
        {
          opacity: [0, 1],
          translateY: [20, 0],
          duration: 700,
        },
        0
      );
    }

    if (photoImg) {
      masterTimeline.add(
        photoImg,
        {
          scale: [1.05, 1],
          duration: 950,
          ease: 'outCubic',
        },
        0
      );
    }

    if (eyebrowLine) {
      masterTimeline.add(
        eyebrowLine,
        {
          scaleX: [0, 1],
          duration: 420,
        },
        80
      );
    }

    if (eyebrowText) {
      masterTimeline.add(
        eyebrowText,
        {
          opacity: [0, 1],
          translateX: [-8, 0],
          duration: 420,
        },
        130
      );
    }

    if (headingLines.length) {
      masterTimeline.add(
        headingLines,
        {
          opacity: [0, 1],
          translateY: [18, 0],
          duration: 580,
          delay: stagger(80),
        },
        160
      );
    }

    if (dividerLine) {
      masterTimeline.add(
        dividerLine,
        {
          scaleY: [0, 1],
          opacity: [0, 1],
          duration: 520,
        },
        260
      );
    }

    if (copyBlock) {
      masterTimeline.add(
        copyBlock,
        {
          opacity: [0, 1],
          translateY: [16, 0],
          duration: 600,
        },
        300
      );
    }
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          playEntrance();
          observer.unobserve(section);
        }
      });
    },
    { threshold: 0.15 }
  );

  observer.observe(section);

  return {
    destroy: () => {
      observer.disconnect();
      if (masterTimeline) {
        try {
          masterTimeline.pause();
        } catch {}
      }
    },
  };
}
