import {
  animate,
  createDrawable,
  createTimeline,
  spring,
  stagger,
  utils,
  type Timeline,
} from 'animejs';

export interface H1ChoreographyHandle {
  destroy: () => void;
}

/**
 * Coreografia Tipográfica Multi-Estágios do H1 com Anime.js v4.5
 * Estágio 1: Abertura das linhas de registro arquitetônico (grid scanlines)
 * Estágio 2: Desdobramento 3D de "SUA MARCA" + Onda de Ignição Cromática para #F47721
 * Estágio 3: Travamento cinético de "NÃO PRECISA" e "SER" com perspectiva 3D
 * Estágio 4: Sequência editorial de diagnóstico e risco ativo ("genérica." -> "invisível." -> "esquecida.")
 * Estágio 5: Clímax elástico de "MAIS UMA." + assinatura vetorial (createDrawable) + pulso de ressonância
 * Estágio 6: Microinterações táteis pós-entrada no hover de "MARCA" e "MAIS UMA."
 */
export function mountHeroH1Choreography(
  hero: HTMLElement,
  finePointer: boolean
): H1ChoreographyHandle {
  const h1 = hero.querySelector<HTMLElement>('#hero-heading');
  if (!h1) return { destroy: () => {} };

  const scanRules = Array.from(h1.querySelectorAll<HTMLElement>('[data-h1-rule]'));
  const suaChars = Array.from(h1.querySelectorAll<HTMLElement>('[data-char="sua"]'));
  const marcaChars = Array.from(h1.querySelectorAll<HTMLElement>('[data-char="marca"]'));
  const naoChars = Array.from(h1.querySelectorAll<HTMLElement>('[data-char="nao"]'));
  const precisaChars = Array.from(h1.querySelectorAll<HTMLElement>('[data-char="precisa"]'));
  const serChars = Array.from(h1.querySelectorAll<HTMLElement>('[data-char="ser"]'));
  const finalChars = Array.from(h1.querySelectorAll<HTMLElement>('[data-char="final"]'));

  const tempWordEls = Array.from(h1.querySelectorAll<HTMLElement>('[data-temp-word]'));
  const tempGroups = tempWordEls.map((wordEl) => ({
    wordEl,
    chars: Array.from(wordEl.querySelectorAll<HTMLElement>('[data-temp-char]')),
    strike: wordEl.querySelector<HTMLElement>('[data-temp-strike]'),
  }));

  const swashPath = h1.querySelector<SVGPathElement>('[data-swash]');
  const drawableSwash = swashPath ? createDrawable(swashPath) : [];

  // Estado inicial determinístico antes de revelar o H1
  if (scanRules.length) {
    utils.set(scanRules, {
      scaleX: 0,
      opacity: 0.75,
      transformOrigin: '0% 50%',
    });
  }

  utils.set([suaChars, naoChars, precisaChars, serChars], {
    translateY: '122%',
    rotateX: -78,
    skewY: 6,
    opacity: 0,
  });

  // "MARCA" inicia no carvão editorial (#171717) antes da onda de ignição laranja
  utils.set(marcaChars, {
    translateY: '126%',
    rotateX: -84,
    scale: 0.85,
    opacity: 0,
    color: '#171717',
  });

  tempGroups.forEach(({ wordEl, chars, strike }) => {
    wordEl.style.visibility = 'visible';
    utils.set(chars, {
      translateY: '115%',
      rotateX: -55,
      opacity: 0,
    });
    if (strike) {
      utils.set(strike, {
        scaleX: 0,
        opacity: 1,
        transformOrigin: '0% 50%',
      });
    }
  });

  const finalWordWrapper = h1.querySelector<HTMLElement>('[data-final-word]');
  if (finalWordWrapper) {
    finalWordWrapper.style.visibility = 'visible';
  }
  utils.set(finalChars, {
    translateY: '130%',
    rotateX: -82,
    scale: 0.82,
    opacity: 0,
  });

  if (drawableSwash.length) {
    utils.set(drawableSwash, { draw: '0 0', opacity: 1 });
  }

  /**
   * Constrói a sequência dos Estágios 4 e 5 (Diagnóstico -> Risco Ativo -> "MAIS UMA." + Swash)
   * Reutilizável tanto na entrada principal quanto no replay interativo ao passar o mouse.
   */
  const appendRotatorStages = (
    tl: Timeline,
    startAt: number,
    includeMarcaEcho: boolean
  ) => {
    let cursor = startAt;

    tempGroups.forEach(({ chars, strike }) => {
      // 4A. Entrada rápida das letras da palavra-clichê
      tl.add(
        chars,
        {
          translateY: ['135%', '0%'],
          rotateX: [-55, 0],
          opacity: [0, 1],
          duration: 250,
          delay: stagger(14),
          ease: 'outQuart',
        },
        cursor
      );

      const strikeAt = cursor + 230;
      // 4B. Risco editorial laranja (#F47721) cortando a palavra horizontalmente
      if (strike) {
        tl.add(
          strike,
          {
            scaleX: [0, 1],
            opacity: [1, 1],
            duration: 185,
            ease: 'inOutCubic',
          },
          strikeAt
        );
      }

      tl.add(
        chars,
        {
          opacity: [1, 0.58],
          translateX: [0, -2, 2, 0],
          duration: 190,
          ease: 'outQuad',
        },
        strikeAt
      );

      // 4C. Ejeção 3D limpa para cima abrindo espaço para a próxima palavra
      const exitAt = strikeAt + 225;
      tl.add(
        chars,
        {
          translateY: ['0%', '-148%'],
          rotateX: [0, 62],
          opacity: [0.58, 0],
          duration: 195,
          delay: stagger(8),
          ease: 'inCubic',
        },
        exitAt
      );

      if (strike) {
        tl.add(
          strike,
          {
            opacity: [1, 0],
            duration: 150,
            ease: 'outQuad',
          },
          exitAt + 20
        );
      }

      cursor = exitAt + 145;
    });

    // 5A. Clímax: "MAIS UMA." irrompe com física de mola (spring) letra a letra
    tl.add(
      finalChars,
      {
        translateY: ['130%', '0%'],
        rotateX: [-82, 0],
        scale: [0.82, 1],
        opacity: [0, 1],
        delay: stagger(30),
        ease: spring({ bounce: 0.26, duration: 680 }),
      },
      cursor
    );

    // 5B. Desenho orgânico do sublinhado vetorial via SVG createDrawable
    if (drawableSwash.length) {
      tl.add(
        drawableSwash,
        {
          draw: ['0 0', '0 1'],
          duration: 580,
          ease: 'outQuart',
        },
        cursor + 240
      );
    }

    // 5C. Ressonância harmônica sutil em "MARCA" conectando os dois polos laranjas do H1
    if (includeMarcaEcho && marcaChars.length) {
      tl.add(
        marcaChars,
        {
          translateY: ['0%', '-5%', '0%'],
          scale: [1, 1.035, 1],
          duration: 420,
          delay: stagger(26),
          ease: 'outSine',
        },
        cursor + 260
      );
    }
  };

  // Timeline Principal Multi-Estágios
  const master = createTimeline({ autoplay: true });

  // ESTÁGIO 1: Varredura das linhas arquitetônicas de base
  if (scanRules.length) {
    master
      .add(
        scanRules,
        {
          scaleX: [0, 1],
          duration: 360,
          delay: stagger(75),
          ease: 'outQuint',
        },
        40
      )
      .add(
        scanRules,
        {
          opacity: [0.75, 0],
          duration: 340,
          delay: stagger(65),
          ease: 'outQuad',
        },
        360
      );
  }

  // ESTÁGIO 2A: Desdobramento 3D de "SUA"
  master.add(
    suaChars,
    {
      translateY: ['122%', '0%'],
      rotateX: [-78, 0],
      skewY: [6, 0],
      opacity: [0, 1],
      duration: 580,
      delay: stagger(32),
      ease: 'outExpo',
    },
    120
  );

  // ESTÁGIO 2B: Entrada elástica de "MARCA" + Onda de Ignição Cromática (#171717 -> #FF9A52 -> #F47721)
  master
    .add(
      marcaChars,
      {
        translateY: ['126%', '0%'],
        rotateX: [-84, 0],
        scale: [0.85, 1],
        opacity: [0, 1],
        delay: stagger(34),
        ease: spring({ bounce: 0.22, duration: 640 }),
      },
      230
    )
    .add(
      marcaChars,
      {
        color: ['#171717', '#FF984F', '#F47721'],
        translateY: ['0%', '-8%', '0%'],
        scale: [1, 1.06, 1],
        duration: 480,
        delay: stagger(38),
        ease: 'outBack(1.5)',
      },
      490
    );

  // ESTÁGIO 3: Travamento cinético da Linha 2 ("NÃO PRECISA") e início da Linha 3 ("SER")
  master
    .add(
      naoChars,
      {
        translateY: ['122%', '0%'],
        translateX: ['-0.14em', '0em'],
        rotateX: [-75, 0],
        skewY: [5, 0],
        opacity: [0, 1],
        duration: 560,
        delay: stagger(28),
        ease: 'outExpo',
      },
      360
    )
    .add(
      precisaChars,
      {
        translateY: ['122%', '0%'],
        rotateX: [-75, 0],
        skewY: [5, 0],
        opacity: [0, 1],
        duration: 580,
        delay: stagger(22),
        ease: 'outExpo',
      },
      465
    )
    .add(
      serChars,
      {
        translateY: ['122%', '0%'],
        rotateX: [-75, 0],
        skewY: [5, 0],
        opacity: [0, 1],
        duration: 540,
        delay: stagger(30),
        ease: 'outExpo',
      },
      640
    );

  // ESTÁGIOS 4 & 5: Diagnóstico com risco ativo + Clímax "MAIS UMA."
  appendRotatorStages(master, 820, true);

  // ESTÁGIO 6: Microinterações Táteis Pós-Intro (Desktop Fine Pointer)
  let replayTimeline: Timeline | null = null;
  let isIntroDone = false;
  void master.then(() => {
    isIntroDone = true;
  });

  const rotatorEl = h1.querySelector<HTMLElement>('[data-rotator]');
  const marcaWordEl = h1.querySelector<HTMLElement>('[data-word-marca]');

  const onRotatorEnter = () => {
    if (!isIntroDone) return;
    if (replayTimeline && !replayTimeline.completed) return;

    tempGroups.forEach(({ chars, strike }) => {
      utils.set(chars, { translateY: '115%', rotateX: -55, opacity: 0, translateX: 0 });
      if (strike) utils.set(strike, { scaleX: 0, opacity: 1 });
    });
    utils.set(finalChars, { translateY: '130%', rotateX: -82, scale: 0.82, opacity: 0 });
    if (drawableSwash.length) utils.set(drawableSwash, { draw: '0 0' });

    replayTimeline = createTimeline({ autoplay: true });
    appendRotatorStages(replayTimeline, 0, false);
  };

  let marcaWaveBusy = false;
  const onMarcaEnter = () => {
    if (!isIntroDone || marcaWaveBusy || !marcaChars.length) return;
    marcaWaveBusy = true;
    const anim = animate(marcaChars, {
      translateY: ['0%', '-9%', '0%'],
      color: ['#F47721', '#FF984F', '#F47721'],
      duration: 440,
      delay: stagger(30),
      ease: 'outQuad',
    });
    void anim.then(() => {
      marcaWaveBusy = false;
    });
  };

  if (finePointer) {
    if (rotatorEl) {
      rotatorEl.style.pointerEvents = 'auto';
      rotatorEl.style.cursor = 'pointer';
      rotatorEl.addEventListener('mouseenter', onRotatorEnter);
    }
    if (marcaWordEl) {
      marcaWordEl.style.pointerEvents = 'auto';
      marcaWordEl.style.cursor = 'default';
      marcaWordEl.addEventListener('mouseenter', onMarcaEnter);
    }
  }

  return {
    destroy: () => {
      rotatorEl?.removeEventListener('mouseenter', onRotatorEnter);
      marcaWordEl?.removeEventListener('mouseenter', onMarcaEnter);
      master.revert();
      replayTimeline?.revert();
    },
  };
}
