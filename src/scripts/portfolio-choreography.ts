import {
  animate,
  createDrawable,
  createTimeline,
  stagger,
  type JSAnimation,
  type Timeline,
} from 'animejs';

export interface PortfolioChoreographyHandle {
  destroy: () => void;
}

/**
 * Coreografia e Carrossel Interativo da Seção "Portfólio" (Anime.js v4.5)
 * - Exibição ampliada das marcas (4 cards no desktop, 3 no tablet, 2 no mobile)
 * - Zero corte/marcas pela metade: alinhamento exato por offset de página
 * - Remoção total de tooltip/balão de texto ao passar o cursor
 * - Navegação precisa com setas < e > e indicadores dinâmicos
 * - Tilt 3D sutil nos cards ao passar o cursor
 * - Suporte a gestos touch swipe e navegação por teclado
 * - Autoplay inteligente com pausa ao interagir e fora da tela
 */
export function mountPortfolioChoreography(
  section: HTMLElement,
  options: { finePointer: boolean; desktop: boolean }
): PortfolioChoreographyHandle {
  const { finePointer } = options;

  const cleanups: Array<() => void> = [];
  const activeAnimations: Array<JSAnimation | Timeline> = [];
  let entranceTimeline: Timeline | null = null;
  let hasEntered = false;
  let isInViewport = false;

  // Seletores dos elementos da seção
  const eyebrowLine = section.querySelector<HTMLElement>('[data-portfolio-eyebrow-line]');
  const eyebrowText = section.querySelector<HTMLElement>('[data-portfolio-eyebrow-text]');
  const headingLines = Array.from(
    section.querySelectorAll<HTMLElement>('[data-portfolio-heading-line]')
  );
  const subtitle = section.querySelector<HTMLElement>('[data-portfolio-subtitle]');
  const orbitPaths = Array.from(
    section.querySelectorAll<SVGPathElement>('[data-portfolio-orbit]')
  );
  const cornerGradients = Array.from(
    section.querySelectorAll<SVGElement>('[data-portfolio-corner]')
  );

  // Seletores do carrossel
  const viewport = section.querySelector<HTMLElement>('[data-portfolio-viewport]');
  const track = section.querySelector<HTMLElement>('[data-portfolio-track]');
  const cards = Array.from(
    section.querySelectorAll<HTMLElement>('[data-portfolio-card]')
  );
  const prevBtn = section.querySelector<HTMLButtonElement>('[data-portfolio-prev]');
  const nextBtn = section.querySelector<HTMLButtonElement>('[data-portfolio-next]');
  const dotsTrack = section.querySelector<HTMLElement>('[data-portfolio-dots-track]');

  if (!viewport || !track || cards.length === 0) {
    return { destroy: () => {} };
  }

  // Estado dinâmico do carrossel
  let currentPage = 0;
  let totalPages = 1;
  let cardsPerPage = 4;
  let isSliding = false;
  let autoplayTimer: number | null = null;

  // Calcula a quantidade de cards exibidos por página com base na largura da viewport
  function calculateCardsPerPage(): number {
    const w = viewport!.clientWidth;
    if (w >= 1024) return 4;
    if (w >= 768) return 3;
    if (w >= 600) return 2;
    return 1;
  }

  // Recalcula o número total de páginas
  function updateLayoutDimensions() {
    cardsPerPage = calculateCardsPerPage();
    totalPages = Math.max(1, Math.ceil(cards.length / cardsPerPage));
    if (currentPage >= totalPages) {
      currentPage = totalPages - 1;
    }
    renderDots();
  }

  // Calcula o deslocamento X exato para que NENHUM card fique cortado pela metade
  function getPageTranslateX(pageIndex: number): number {
    if (cards.length === 0) return 0;

    // Índice do primeiro card da página
    let targetIndex = pageIndex * cardsPerPage;
    if (targetIndex + cardsPerPage > cards.length) {
      targetIndex = Math.max(0, cards.length - cardsPerPage);
    }

    const targetCard = cards[targetIndex];
    if (!targetCard) return 0;

    const offsetLeft = targetCard.offsetLeft;
    const maxScroll = Math.max(0, track!.scrollWidth - viewport!.clientWidth);
    return -Math.min(offsetLeft, maxScroll);
  }

  // Centraliza o ponto ativo na janela do carrossel mobile
  function updateDotsScroll() {
    if (!dotsTrack) return;
    const dots = Array.from(
      dotsTrack.querySelectorAll<HTMLButtonElement>('[data-portfolio-dot]')
    );
    const activeDot = dots[currentPage];
    if (!activeDot) return;

    const parentViewport = dotsTrack.parentElement;
    if (parentViewport && parentViewport.clientWidth < dotsTrack.scrollWidth) {
      const centerOffset =
        activeDot.offsetLeft -
        parentViewport.clientWidth / 2 +
        activeDot.offsetWidth / 2;
      const maxScroll = Math.max(
        0,
        dotsTrack.scrollWidth - parentViewport.clientWidth
      );
      const clampedOffset = Math.max(0, Math.min(centerOffset, maxScroll));
      dotsTrack.style.transform = `translateX(-${clampedOffset}px)`;
    } else {
      dotsTrack.style.transform = '';
    }
  }

  // Renderiza e atualiza os pontos de navegação 1 a 1 com cada slide
  function renderDots() {
    if (!dotsTrack) return;
    dotsTrack.innerHTML = '';

    for (let i = 0; i < totalPages; i++) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('data-portfolio-dot', String(i));
      dot.setAttribute('aria-label', `Ir para o slide ${i + 1} de marcas`);
      const isActive = i === currentPage;
      dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
      dot.className = `h-2.5 rounded-full shrink-0 transition-all duration-300 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47721] ${
        isActive ? 'bg-[#F47721] w-7' : 'bg-[#DEDBD5] hover:bg-[#BDBAB3] w-2.5'
      }`;

      dot.addEventListener('click', (e) => {
        e.preventDefault();
        resetAutoplay();
        goToPage(i);
      });

      dotsTrack.appendChild(dot);
    }

    updateControlsState();
  }

  function updateControlsState() {
    const dots = Array.from(
      section.querySelectorAll<HTMLButtonElement>('[data-portfolio-dot]')
    );

    dots.forEach((dot, index) => {
      const isActive = index === currentPage;
      dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
      if (isActive) {
        dot.classList.add('bg-[#F47721]', 'w-7');
        dot.classList.remove('bg-[#DEDBD5]', 'w-2.5');
      } else {
        dot.classList.remove('bg-[#F47721]', 'w-7');
        dot.classList.add('bg-[#DEDBD5]', 'w-2.5');
      }
    });

    updateDotsScroll();
  }

  // Navega suavemente para a página desejada
  function goToPage(targetPage: number, options: { duration?: number; onComplete?: () => void } = {}) {
    if (targetPage < 0) targetPage = totalPages - 1;
    if (targetPage >= totalPages) targetPage = 0;

    currentPage = targetPage;
    updateControlsState();

    const targetX = getPageTranslateX(currentPage);
    isSliding = true;

    const anim = animate(track!, {
      translateX: targetX,
      ease: 'outQuart',
      duration: options.duration ?? 640,
      onComplete: () => {
        isSliding = false;
        if (options.onComplete) options.onComplete();
      },
    });

    activeAnimations.push(anim);
  }

  // Botões de navegação
  if (prevBtn) {
    const handlePrev = (e: Event) => {
      e.preventDefault();
      resetAutoplay();
      goToPage(currentPage - 1);
    };
    prevBtn.addEventListener('click', handlePrev);
    cleanups.push(() => prevBtn.removeEventListener('click', handlePrev));
  }

  if (nextBtn) {
    const handleNext = (e: Event) => {
      e.preventDefault();
      resetAutoplay();
      goToPage(currentPage + 1);
    };
    nextBtn.addEventListener('click', handleNext);
    cleanups.push(() => nextBtn.removeEventListener('click', handleNext));
  }

  // Gestos de arrasto e Touch Swipe para dispositivos móveis
  let startX = 0;
  let currentX = 0;
  let isDragging = false;
  let initialTranslateX = 0;

  const onTouchStart = (e: TouchEvent) => {
    if (e.touches.length !== 1) return;
    startX = e.touches[0].clientX;
    currentX = startX;
    isDragging = true;
    initialTranslateX = getPageTranslateX(currentPage);
    resetAutoplay();
  };

  const onTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    track!.style.transform = `translateX(${initialTranslateX + diff}px)`;
  };

  const onTouchEnd = () => {
    if (!isDragging) return;
    isDragging = false;
    const diff = currentX - startX;
    const threshold = 40;

    if (diff < -threshold) {
      goToPage(currentPage + 1);
    } else if (diff > threshold) {
      goToPage(currentPage - 1);
    } else {
      goToPage(currentPage, { duration: 350 });
    }
  };

  viewport.addEventListener('touchstart', onTouchStart, { passive: true });
  viewport.addEventListener('touchmove', onTouchMove, { passive: true });
  viewport.addEventListener('touchend', onTouchEnd, { passive: true });
  cleanups.push(() => {
    viewport.removeEventListener('touchstart', onTouchStart);
    viewport.removeEventListener('touchmove', onTouchMove);
    viewport.removeEventListener('touchend', onTouchEnd);
  });

  // Microinteração 3D de Tilt nos Cards ao passar o cursor (sem tooltip nativo)
  if (finePointer) {
    cards.forEach((card) => {
      let rafId: number | null = null;

      const handlePointerMove = (e: PointerEvent) => {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          const rect = card.getBoundingClientRect();
          const normX = (e.clientX - rect.left) / rect.width - 0.5;
          const normY = (e.clientY - rect.top) / rect.height - 0.5;
          const tiltX = -normY * 10;
          const tiltY = normX * 10;

          card.style.transform = `perspective(800px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) translateY(-4px) scale(1.03)`;
        });
      };

      const handlePointerLeave = () => {
        if (rafId) cancelAnimationFrame(rafId);
        card.style.transform = '';
      };

      card.addEventListener('pointermove', handlePointerMove, { passive: true });
      card.addEventListener('pointerleave', handlePointerLeave, { passive: true });
      cleanups.push(() => {
        card.removeEventListener('pointermove', handlePointerMove);
        card.removeEventListener('pointerleave', handlePointerLeave);
        if (rafId) cancelAnimationFrame(rafId);
      });
    });
  }

  // Teclado (Setas Esquerda / Direita)
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      resetAutoplay();
      goToPage(currentPage - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      resetAutoplay();
      goToPage(currentPage + 1);
    }
  };
  viewport.addEventListener('keydown', handleKeyDown);
  cleanups.push(() => viewport.removeEventListener('keydown', handleKeyDown));

  // Autoplay inteligente (pausa em hover e fora de foco)
  function startAutoplay() {
    stopAutoplay();
    autoplayTimer = window.setInterval(() => {
      if (!isInViewport || document.hidden || isSliding) return;
      const nextPage = (currentPage + 1) % totalPages;
      goToPage(nextPage, { duration: 750 });
    }, 5500);
  }

  function stopAutoplay() {
    if (autoplayTimer !== null) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }

  function resetAutoplay() {
    stopAutoplay();
    startAutoplay();
  }

  viewport.addEventListener('mouseenter', stopAutoplay);
  viewport.addEventListener('mouseleave', startAutoplay);
  cleanups.push(() => {
    viewport.removeEventListener('mouseenter', stopAutoplay);
    viewport.removeEventListener('mouseleave', startAutoplay);
    stopAutoplay();
  });

  // Resize handler com debounce leve
  let resizeTimeout: number | null = null;
  const handleResize = () => {
    if (resizeTimeout) window.clearTimeout(resizeTimeout);
    resizeTimeout = window.setTimeout(() => {
      updateLayoutDimensions();
      goToPage(currentPage, { duration: 150 });
    }, 100);
  };
  window.addEventListener('resize', handleResize, { passive: true });
  cleanups.push(() => {
    window.removeEventListener('resize', handleResize);
    if (resizeTimeout) window.clearTimeout(resizeTimeout);
  });

  // Inicializa dimensões e dots
  updateLayoutDimensions();

  // Drawables vetoriais pré-cacheados
  const drawableOrbits = orbitPaths.length ? createDrawable(orbitPaths) : [];

  // Animação de entrada
  function playEntrance() {
    if (hasEntered) return;
    hasEntered = true;
    section.classList.remove('portfolio-pending');

    entranceTimeline = createTimeline({
      defaults: { ease: 'outExpo' },
      onComplete: () => {
        startAutoplay();
      },
    });

    if (drawableOrbits.length) {
      entranceTimeline.add(
        drawableOrbits,
        {
          draw: ['0 0', '0 1'],
          ease: 'outQuart',
          duration: 1100,
        },
        0
      );
    }

    if (cornerGradients.length > 0) {
      entranceTimeline.add(cornerGradients, {
        opacity: [0, 1],
        scale: [0.92, 1],
        ease: 'outQuart',
        duration: 800,
      }, 0);
    }

    if (eyebrowLine) {
      entranceTimeline.add(eyebrowLine, {
        scaleX: [0, 1],
        ease: 'outQuart',
        duration: 450,
      }, 80);
    }
    if (eyebrowText) {
      entranceTimeline.add(eyebrowText, {
        opacity: [0, 1],
        translateY: [10, 0],
        ease: 'outQuart',
        duration: 450,
      }, 120);
    }

    if (headingLines.length > 0) {
      entranceTimeline.add(headingLines, {
        opacity: [0, 1],
        translateY: [24, 0],
        ease: 'outQuart',
        duration: 650,
        delay: stagger(100),
      }, 180);
    }

    if (subtitle) {
      entranceTimeline.add(subtitle, {
        opacity: [0, 1],
        translateY: [14, 0],
        ease: 'outQuart',
        duration: 550,
      }, 340);
    }

    if (cards.length > 0) {
      entranceTimeline.add(cards, {
        opacity: [0, 1],
        translateY: [32, 0],
        scale: [0.93, 1],
        ease: 'outQuart',
        duration: 650,
        delay: stagger(40, { from: 'first' }),
      }, 260);
    }

    const controls = [prevBtn, nextBtn, dotsTrack].filter(Boolean) as HTMLElement[];
    if (controls.length > 0) {
      entranceTimeline.add(controls, {
        opacity: [0, 1],
        scale: [0.85, 1],
        ease: 'outQuart',
        duration: 500,
        delay: stagger(30),
      }, 450);
    }
  }

  // Observer de Visibilidade
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        isInViewport = entry.isIntersecting;
        if (entry.isIntersecting) {
          playEntrance();
          startAutoplay();
        } else {
          stopAutoplay();
        }
      });
    },
    { threshold: 0.12 }
  );

  observer.observe(section);
  cleanups.push(() => observer.disconnect());

  const handleVisibilityChange = () => {
    if (document.hidden) {
      stopAutoplay();
    } else if (isInViewport) {
      startAutoplay();
    }
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);
  cleanups.push(() =>
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  );

  return {
    destroy: () => {
      stopAutoplay();
      cleanups.forEach((cleanup) => cleanup());
      activeAnimations.forEach((anim) => {
        try {
          anim.pause();
        } catch {}
      });
      if (entranceTimeline) {
        try {
          entranceTimeline.pause();
        } catch {}
      }
    },
  };
}
