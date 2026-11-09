import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const sourceDir = 'c:/Users/Usuario/Desktop/Criade/marcas criade';
const targetDir = 'c:/Users/Usuario/Desktop/Criade/src/assets/brands';

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Mapa semântico de cada arquivo para slug limpo e nome legível da marca
const brandsMap = [
  {
    file: 'Assinatura Visual - Apipema Center_Prancheta 1.png',
    slug: 'apipema-center',
    name: 'Apipema Center',
    category: 'Centro Comercial',
  },
  {
    file: 'Assinatura Visual - Bruno Meireles.png',
    slug: 'bruno-meireles',
    name: 'Bruno Meireles',
    category: 'Arquitetura e Interiores',
  },
  {
    file: 'Assinatura Visual - Clínica Univisão.png',
    slug: 'clinica-univisao',
    name: 'Clínica Univisão',
    category: 'Saúde Ocular',
  },
  {
    file: 'Assinatura Visual - Conde FM - Redes Sociais_Prancheta 1.png',
    slug: 'conde-fm',
    name: 'Conde FM',
    category: 'Comunicação e Rádio',
  },
  {
    file: 'Assinatura Visual - Continente.png',
    slug: 'continente',
    name: 'Continente',
    category: 'Varejo e Serviços',
  },
  {
    file: 'Assinatura Visual - Emcil.png',
    slug: 'emcil',
    name: 'Emcil',
    category: 'Engenharia e Manutenção',
  },
  {
    file: 'Assinatura Visual - Mônaco Auto Center_Vertical - Vermelho.png',
    slug: 'monaco-auto-center',
    name: 'Mônaco Auto Center',
    category: 'Automotivo',
  },
  {
    file: 'Assinatura Visual - Nutrir com Saúde - Vertical.png',
    slug: 'nutrir-com-saude',
    name: 'Nutrir com Saúde',
    category: 'Nutrição e Bem-estar',
  },
  {
    file: 'Assinatura Visual - OlharBEM_Color.png',
    slug: 'olhar-bem',
    name: 'OlharBEM',
    category: 'Oftalmologia',
  },
  {
    file: 'Assinatura Visual - Printt Cores.png',
    slug: 'printt-cores',
    name: 'Printt Cores',
    category: 'Gráfica e Comunicação Visual',
  },
  {
    file: 'Assinatura Visual - Prover Oftalmologia.png',
    slug: 'prover-oftalmologia',
    name: 'Prover Oftalmologia',
    category: 'Clínica Médica',
  },
  {
    file: 'Assinatura Visual - Ricardo Torres.png',
    slug: 'ricardo-torres',
    name: 'Ricardo Torres',
    category: 'Advocacia e Consultoria',
  },
  {
    file: 'Assinatura Visual - Royal Safira_Azul.png',
    slug: 'royal-safira',
    name: 'Royal Safira',
    category: 'Empreendimentos',
  },
  {
    file: 'Assinatura Visual - Sertão e Mar Restaurante.png',
    slug: 'sertao-e-mar',
    name: 'Sertão & Mar',
    category: 'Gastronomia',
  },
  {
    file: 'Assinatura Visual - Tudo MED - Vermelho_Prancheta 1.png',
    slug: 'tudo-med',
    name: 'Tudo MED',
    category: 'Saúde e Telemedicina',
  },
  {
    file: 'Assinatura Visual - Vírtuose.png',
    slug: 'virtuose',
    name: 'Vírtuose',
    category: 'Estética e Harmonização',
  },
  {
    file: 'Assinatura Visual - Óticas BemVer - Vertical.png',
    slug: 'oticas-bem-ver',
    name: 'Óticas BemVer',
    category: 'Óptica e Varejo',
  },
  {
    file: 'Duarte JR Engenharia e Construções_Retângular.png',
    slug: 'duarte-jr-engenharia',
    name: 'Duarte JR Engenharia',
    category: 'Engenharia e Construções',
  },
  {
    file: 'LOGO-SHOPPING-PONTO-ALTO-4.png',
    slug: 'shopping-ponto-alto',
    name: 'Shopping Ponto Alto',
    category: 'Shopping Center',
  },
  {
    file: 'Logo_v2_001@4x.png',
    slug: 'instituto-mar',
    name: 'Instituto Criade Brand',
    category: 'Identidade Estratégica',
  },
  {
    file: 'Saúde e Cuidado_Colorida.png',
    slug: 'saude-e-cuidado',
    name: 'Saúde e Cuidado',
    category: 'Home Care e Bem-estar',
  },
  {
    file: 'Thereza Priore.png',
    slug: 'thereza-priore',
    name: 'Thereza Priore',
    category: 'Moda e Design Autoral',
  },
  {
    file: 'Óticas Vivas.png',
    slug: 'oticas-vivas',
    name: 'Óticas Vivas',
    category: 'Óptica e Saúde Visual',
  },
];

async function convertAll() {
  console.log(`Iniciando conversão de ${brandsMap.length} marcas para WebP...`);
  
  for (const item of brandsMap) {
    const inputPath = path.join(sourceDir, item.file);
    if (!fs.existsSync(inputPath)) {
      console.warn(`Arquivo não encontrado: ${item.file}`);
      continue;
    }

    // 1. Converter na pasta "marcas criade" mantendo o nome base em .webp
    const originalBaseName = path.parse(item.file).name;
    const destInSourceDir = path.join(sourceDir, `${originalBaseName}.webp`);

    // 2. Converter na pasta "src/assets/brands" com slug limpo
    const destInAssets = path.join(targetDir, `${item.slug}.webp`);

    try {
      // Processar com sharp: trim de bordas vazias transparentes e resize proporcional mantendo aspect ratio
      const image = sharp(inputPath);
      const metadata = await image.metadata();

      // Trim transparente suave
      const trimmedBuffer = await image
        .trim({ threshold: 10 })
        .toBuffer();

      // Ajustar dimensões máximas (largura max 360, altura max 160) com espaçamento de segurança
      await sharp(trimmedBuffer)
        .resize({
          width: 380,
          height: 180,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 90, effort: 6 })
        .toFile(destInAssets);

      // Também salvar na pasta de origem "marcas criade"
      await sharp(trimmedBuffer)
        .resize({
          width: 480,
          height: 240,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 90, effort: 6 })
        .toFile(destInSourceDir);

      console.log(`✓ [WebP] ${item.name} -> ${item.slug}.webp`);
    } catch (err) {
      console.error(`Erro ao converter ${item.file}:`, err);
    }
  }

  console.log('Conversão concluída com sucesso!');
}

convertAll();

