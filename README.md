# Criade Comunicação e Design — Site Oficial

Repositório oficial do site institucional da **Criade Comunicação e Design** (`https://criade.com.br`), desenvolvido com **Astro 5 (Static Site Generation)**, **Tailwind CSS v4**, **Anime.js v4.5**, **GSAP + Lenis** e **Three.js / WebGL**.

---

## Arquitetura & Páginas

- `/` (`src/pages/index.astro`): Home institucional (Hero interativa, Nossos Serviços, Portfólio de Marcas, Sobre a Criade e Contato).
- `/sobre` (`src/pages/sobre.astro`): Manifesto artístico e conceitual em 5 atos (Hero Manifesto, Tríade Carbon Dark UI, Alquimia de Valor, Arquitetura de Processo e Epílogo).
- `/privacidade` (`src/pages/privacidade.astro`): Política de Privacidade e conformidade LGPD.
- `/404` (`src/pages/404.astro`): Página 404 personalizada integrada ao `.htaccess`.

---

## SEO Técnico, Sitemap & Indexação para IAs (GEO / LLMO)

- **Sitemap XML Dinâmico (`/sitemap-index.xml` & `/sitemap-0.xml`):** Gerado via `@astrojs/sitemap` com prioridades semânticas (`1.0` para `/`, `0.9` para `/sobre`, `0.3` para `/privacidade`) e exclusão automática de rotas de erro (`/404`).
- **Diretivas para Buscadores e IAs (`/robots.txt`):** Configurado para indexação eficiente pelo Google (`Googlebot`, `Googlebot-Image`, `Google-Extended`), Bing (`Bingbot`) e agentes de resposta de IA (`OAI-SearchBot`, `GPTBot`, `ClaudeBot`, `PerplexityBot`, `Applebot-Extended`).
- **Contexto Estruturado para LLMs (`/llms.txt` & `/llms-full.txt`):** Documentação nativa em Markdown na raiz do domínio para leitura direta por assistentes de IA.
- **Schema.org JSON-LD (`@graph`):** Dados estruturados de `MarketingAgency`, `ProfessionalService`, `OfferCatalog` (6 serviços), `WebSite`, `WebPage` / `AboutPage` e `BreadcrumbList`.

---

## Comandos de Desenvolvimento & Build

```bash
# Instalar dependências
npm install

# Servidor de desenvolvimento local
npm run dev

# Checagem de tipos TypeScript
npm run typecheck

# Gerar build estático de produção (pasta dist/)
npm run build

# Visualizar build estático localmente
npm run preview
```

---

## Publicação na Hostinger

1. **Via Painel Hostinger (Node.js / Static Web App conectado ao GitHub):**
   - Conecte o repositório `https://github.com/criadedesign/criade.git` na branch `main`.
   - Framework preset: **Astro** | Versão do Node: **20.x** (`.nvmrc`).
   - Comando de build: `npm run build` | Diretório de saída: `dist`.
2. **Via Upload Direto (`public_html` em Hospedagem Compartilhada / Cloud):**
   - Execute `npm run build` localmente.
   - Envie todo o conteúdo gerado dentro da pasta `dist/` (incluindo o arquivo `.htaccess`) diretamente para `public_html/`.
