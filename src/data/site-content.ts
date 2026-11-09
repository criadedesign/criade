export interface NavItem {
  label: string;
  href: string;
}

export interface ServiceItem {
  index: string;
  title: string;
}

export type ServiceIconName =
  | 'service-eye'
  | 'service-monitor'
  | 'service-code'
  | 'service-bars'
  | 'service-community'
  | 'service-search';

export interface ServiceCardItem {
  id: string;
  index: string;
  icon: ServiceIconName;
  titleLines: string[];
  description: string;
  alt: string;
}

export interface PortfolioCard {
  id: string;
  title: string;
  category: string;
  image: string;
  alt: string;
  featured?: boolean;
}

export const brandInfo = {
  name: 'Criade Comunicação e Design',
  shortName: 'criadedesign',
  tagline: 'Criatividade que impulsiona negócios.',
  positioning:
    'Construímos identidades, experiências digitais e estratégias de comunicação para marcas que querem crescer.',
  contact: {
    whatsappHref: '#contato',
    instagramHref: 'https://www.instagram.com/criadedesign/',
    linkedinHref: '#contato',
    behanceHref: '#projetos',
    youtubeHref: '#contato',
  },
} as const;

export const navigationItems: NavItem[] = [
  { label: 'Serviços', href: '#servicos' },
  { label: 'Projetos', href: '#projetos' },
  { label: 'Sobre', href: '#sobre' },
  { label: 'Contato', href: '#contato' },
];

export interface HeroPillar {
  icon: 'chart-growth' | 'lightbulb-spark' | 'target-arrow';
  title: string;
  subtitle: string;
}

export const heroContent = {
  eyebrowItems: ['ESTRATÉGIA', 'CRIATIVIDADE', 'RESULTADO'],
  headline: {
    darkLines: ['Desenvolvendo', 'soluções.'],
    accentLines: ['Criando', 'possibilidades.'],
  },
  subheadline:
    'Pensamos além do convencional. Criamos com propósito. Desenvolvemos soluções que transformam a maneira como sua marca se conecta com o mundo.',
  primaryCta: {
    label: 'Conheça nosso trabalho',
    href: '#projetos',
  },
  pillars: [
    {
      icon: 'chart-growth',
      title: 'Estratégias',
      subtitle: 'personalizadas',
    },
    {
      icon: 'lightbulb-spark',
      title: 'Design',
      subtitle: 'inovador',
    },
    {
      icon: 'target-arrow',
      title: 'Resultados',
      subtitle: 'reais',
    },
  ] satisfies HeroPillar[],
  signature: {
    brand: 'Criade.',
    tagline: 'Sua marca em boas mãos.',
  },
  studioShowcaseAlt:
    'Mesa criativa do estúdio Criade com notebook exibindo a marca Criade Comunicação e Design, tablet gráfico, smartphone, câmera profissional, xícara de café e arquitetura brutalista com formas geométricas em laranja',
} as const;

export const servicesContent = {
  eyebrow: 'NOSSOS SERVIÇOS',
  headline: {
    darkLines: ['Soluções', 'completas para', 'sua marca ir'],
    accentLine: 'mais longe.',
  },
  description:
    'Da estratégia à execução, oferecemos um portfólio completo de serviços para fortalecer sua marca em todos os pontos de contato.',
  cta: {
    label: 'Conheça todos os serviços',
    href: '#contato',
  },
  deskAlt:
    'Estação criativa do estúdio Criade com notebook exibindo arte geométrica laranja, caneta digital e blocos translúcidos de acrílico laranja',
  cards: [
    {
      id: 'identidade-visual',
      index: '01',
      icon: 'service-eye',
      titleLines: ['Estratégia &', 'Identidade Visual'],
      description: 'Construímos marcas fortes e autênticas.',
      alt: 'Escultura clássica em preto e branco com sobreposição geométrica circular em laranja Criade',
    },
    {
      id: 'design-grafico',
      index: '02',
      icon: 'service-monitor',
      titleLines: ['Design Gráfico'],
      description: 'Transformamos ideias em peças memoráveis.',
      alt: 'Pôster editorial modernista com círculo laranja e grafismos arquitetônicos em preto e branco',
    },
    {
      id: 'desenvolvimento-sites',
      index: '03',
      icon: 'service-code',
      titleLines: ['Desenvolvimento', 'de Sites'],
      description: 'Experiências digitais que conectam.',
      alt: 'Smartphone em perspectiva exibindo interface web minimalista com arquitetura brutalista e destaque laranja',
    },
    {
      id: 'marketing-trafego',
      index: '04',
      icon: 'service-bars',
      titleLines: ['Marketing &', 'Tráfego Pago'],
      description: 'Estratégias inteligentes para crescer de forma real.',
      alt: 'Painel escuro de performance digital com gráfico ascendente luminoso na cor laranja',
    },
    {
      id: 'redes-sociais',
      index: '05',
      icon: 'service-community',
      titleLines: ['Gestão de Redes', 'Sociais'],
      description: 'Conecte, engaje e construa comunidade.',
      alt: 'Blocos táteis 3D de redes sociais em preto fosco e laranja vibrante',
    },
    {
      id: 'seo-posicionamento',
      index: '06',
      icon: 'service-search',
      titleLines: ['SEO & Posicionamento', 'Digital'],
      description: 'Seja encontrado por quem realmente importa.',
      alt: 'Tela minimalista exibindo barra de busca com botão de pesquisa em laranja Criade',
    },
  ] satisfies ServiceCardItem[],
} as const;

export interface BrandClient {
  id: string;
  name: string;
  category: string;
  slug: string;
}

export const brandClients: BrandClient[] = [
  {
    id: 'apipema-center',
    slug: 'apipema-center',
    name: 'Apipema Center',
    category: 'Centro Comercial',
  },
  {
    id: 'bruno-meireles',
    slug: 'bruno-meireles',
    name: 'Bruno Meireles',
    category: 'Arquitetura e Interiores',
  },
  {
    id: 'clinica-univisao',
    slug: 'clinica-univisao',
    name: 'Clínica Univisão',
    category: 'Saúde Ocular',
  },
  {
    id: 'conde-fm',
    slug: 'conde-fm',
    name: 'Conde FM',
    category: 'Comunicação e Rádio',
  },
  {
    id: 'continente',
    slug: 'continente',
    name: 'Continente',
    category: 'Varejo e Serviços',
  },
  {
    id: 'emcil',
    slug: 'emcil',
    name: 'Emcil',
    category: 'Engenharia e Manutenção',
  },
  {
    id: 'monaco-auto-center',
    slug: 'monaco-auto-center',
    name: 'Mônaco Auto Center',
    category: 'Automotivo',
  },
  {
    id: 'nutrir-com-saude',
    slug: 'nutrir-com-saude',
    name: 'Nutrir com Saúde',
    category: 'Nutrição e Bem-estar',
  },
  {
    id: 'olhar-bem',
    slug: 'olhar-bem',
    name: 'OlharBEM',
    category: 'Oftalmologia',
  },
  {
    id: 'printt-cores',
    slug: 'printt-cores',
    name: 'Printt Cores',
    category: 'Gráfica e Comunicação Visual',
  },
  {
    id: 'prover-oftalmologia',
    slug: 'prover-oftalmologia',
    name: 'Prover Oftalmologia',
    category: 'Clínica Médica',
  },
  {
    id: 'ricardo-torres',
    slug: 'ricardo-torres',
    name: 'Ricardo Torres',
    category: 'Advocacia e Consultoria',
  },
  {
    id: 'royal-safira',
    slug: 'royal-safira',
    name: 'Royal Safira',
    category: 'Empreendimentos',
  },
  {
    id: 'sertao-e-mar',
    slug: 'sertao-e-mar',
    name: 'Sertão & Mar',
    category: 'Gastronomia',
  },
  {
    id: 'tudo-med',
    slug: 'tudo-med',
    name: 'Tudo MED',
    category: 'Saúde e Telemedicina',
  },
  {
    id: 'virtuose',
    slug: 'virtuose',
    name: 'Vírtuose',
    category: 'Estética e Harmonização',
  },
  {
    id: 'oticas-bem-ver',
    slug: 'oticas-bem-ver',
    name: 'Óticas BemVer',
    category: 'Óptica e Varejo',
  },
  {
    id: 'duarte-jr-engenharia',
    slug: 'duarte-jr-engenharia',
    name: 'Duarte JR Engenharia',
    category: 'Engenharia e Construções',
  },
  {
    id: 'shopping-ponto-alto',
    slug: 'shopping-ponto-alto',
    name: 'Shopping Ponto Alto',
    category: 'Shopping Center',
  },
  {
    id: 'instituto-mar',
    slug: 'instituto-mar',
    name: 'Instituto Criade Brand',
    category: 'Identidade Estratégica',
  },
  {
    id: 'saude-e-cuidado',
    slug: 'saude-e-cuidado',
    name: 'Saúde e Cuidado',
    category: 'Home Care e Bem-estar',
  },
  {
    id: 'thereza-priore',
    slug: 'thereza-priore',
    name: 'Thereza Priore',
    category: 'Moda e Design Autoral',
  },
  {
    id: 'oticas-vivas',
    slug: 'oticas-vivas',
    name: 'Óticas Vivas',
    category: 'Óptica e Saúde Visual',
  },
];

export const portfolioContent = {
  eyebrow: 'PORTFÓLIO',
  headline: {
    line1: 'Marcas que',
    line2Prefix: 'confiam na ',
    accent: 'Criade.',
  },
  description: 'Projetos que unem estratégia, criatividade e resultado.',
  ctaLabel: 'Ver todos os projetos',
  brands: brandClients,
  featuredItem: {
    id: 'campanha-de-natal',
    title: 'Campanha de Natal',
    category: 'Design Gráfico',
    image: '/images/portfolio-natal.webp',
    alt: 'Campanha de Natal — Design Gráfico desenvolvido pela Criade',
    featured: true,
  } satisfies PortfolioCard,
  sideItems: [
    {
      id: 'campanha-de-sao-joao',
      title: 'Campanha de São João',
      category: 'Design Gráfico',
      image: '/images/portfolio-sao-joao.webp',
      alt: 'Campanha de São João — Peça gráfica com tipografia colorida Feliz São João sobre madeira',
    },
    {
      id: 'campanha-20-anos',
      title: 'Campanha 20 anos',
      category: 'Identidade Visual',
      image: '/images/portfolio-20-anos.webp',
      alt: 'Campanha 20 anos — Composição visual comemorativa com balões dourados',
    },
  ] satisfies PortfolioCard[],
};

export const aboutContent = {
  eyebrow: 'SOBRE A CRIADE',
  h1Lines: [
    'A criatividade nos move.',
    'A estratégia nos direciona.',
    'A tecnologia amplia',
  ],
  h1Accent: 'nossas possibilidades.',
  h3Text:
    'Somos a Criade: uma agência que transforma ideias em soluções, desafios em oportunidades e marcas em experiências relevantes. Unimos diferentes perspectivas para desenvolver estratégias personalizadas, fortalecer negócios e criar conexões que geram valor.',
  description:
    'Somos a Criade: uma agência que transforma ideias em soluções, desafios em oportunidades e marcas em experiências relevantes. Unimos diferentes perspectivas para desenvolver estratégias personalizadas, fortalecer negócios e criar conexões que geram valor.',
  imageAlt:
    'Mesa criativa do estúdio Criade com caneca preta exibindo o símbolo circular laranja da Criade',
} as const;

export const contactCtaContent = {
  description:
    'Conte para nós o que você quer construir. Vamos pensar juntos na melhor maneira de transformar isso em realidade.',
  ctaButtonLabel: 'Fale com a gente',
};
