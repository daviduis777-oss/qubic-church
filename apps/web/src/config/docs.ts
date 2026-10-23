/**
 * Documentation configuration for the Anna Matrix and Qubic research log.
 * Structured following IMRAD academic format:
 * Introduction, Methods, Results, and Discussion
 */

import type { DocsConfig } from '@/lib/opendocs/types/docs'

export const docsConfig: DocsConfig = {
  mainNav: [
    {
      href: '/docs',
      title: { en: 'Research', pt: 'Pesquisa' },
    },
  ],

  sidebarNav: [
    {
      title: { en: 'Introduction', pt: 'Introducao' },
      items: [
        { href: '/docs', title: { en: 'Overview', pt: 'Visao Geral' }, items: [] },
        { href: '/docs/01-introduction/02-background', title: { en: 'Background', pt: 'Contexto' }, items: [] },
        { href: '/docs/01-introduction/03-motivation', title: { en: 'Motivation', pt: 'Motivacao' }, items: [] },
        { href: '/docs/01-introduction/04-objectives', title: { en: 'Objectives', pt: 'Objetivos' }, items: [] },
      ],
    },

    {
      title: { en: 'Start Here', pt: 'Comece Aqui' },
      items: [
        {
          href: '/docs/03-results/35-corrections-september-2026',
          title: { en: 'The September 2026 re-check', pt: 'A reverificacao de Setembro 2026' },
          items: [],
        },
        {
          href: '/docs/03-results/36-where-the-anna-matrix-comes-from',
          title: { en: 'Where the Anna Matrix Comes From', pt: 'De Onde Vem a Matriz Anna' },
          items: [],
        },
        {
          href: '/docs/03-results/37-anna-0-22-and-btc',
          title: { en: 'Anna 0.22 and Bitcoin Price Data', pt: 'Anna 0.22 e Dados de Preco do Bitcoin' },
          items: [],
        },
        {
          href: '/docs/03-results/38-genesis-exodus-aigarth',
          title: { en: 'GENESIS, EXODUS and AIGARTH', pt: 'GENESIS, EXODUS e AIGARTH' },
          items: [],
        },
        {
          href: '/docs/03-results/17-cfb-satoshi-analysis',
          title: { en: 'CFB and Satoshi: Primary Sources', pt: 'CFB e Satoshi: Fontes Primarias' },
          items: [],
        },
        {
          href: '/docs/05-appendices/02-foundation-facts',
          title: { en: 'Verified Facts', pt: 'Fatos Verificados' },
          items: [],
        },
      ],
    },

    {
      title: { en: 'Methods', pt: 'Metodos' },
      items: [
        { href: '/docs/02-methods/01-methodology', title: { en: 'Methodology', pt: 'Metodologia' }, items: [] },
        { href: '/docs/02-methods/02-tools', title: { en: 'Tools', pt: 'Ferramentas' }, items: [] },
        { href: '/docs/02-methods/03-verification', title: { en: 'Verification', pt: 'Verificacao' }, items: [] },
        {
          href: '/docs/02-methods/04-analysis-framework',
          title: { en: 'Analysis Framework', pt: 'Estrutura de Analise' },
          items: [],
        },
        {
          href: '/docs/02-methods/05-statistical-rigor',
          title: { en: 'Statistical Rigor', pt: 'Rigor Estatistico' },
          items: [],
        },
        {
          href: '/docs/02-methods/06-operational-definitions',
          title: { en: 'Operational Definitions', pt: 'Definicoes Operacionais' },
          items: [],
        },
      ],
    },

    {
      title: { en: 'Anna Matrix', pt: 'Matriz Anna' },
      items: [
        {
          href: '/docs/03-results/01-matrix-symmetry',
          title: { en: 'Symmetry & Structure', pt: 'Simetria e Estrutura' },
          items: [],
        },
        {
          href: '/docs/03-results/02-matrix-decode',
          title: { en: 'Mathematical Analysis', pt: 'Analise Matematica' },
          items: [],
        },
        {
          href: '/docs/03-results/03-matrix-messages',
          title: { en: 'Message Readings', pt: 'Leituras de Mensagens' },
          items: [],
        },
        {
          href: '/docs/03-results/04-anna-bot-verification',
          title: { en: 'Bot Lookup Formula', pt: 'Formula de Consulta do Bot' },
          items: [],
        },
        {
          href: '/docs/03-results/30-period-4-anti-attractor',
          title: { en: 'Period-4 Cycles', pt: 'Ciclos de Periodo 4' },
          items: [],
        },
        {
          href: '/docs/03-results/31-anna-concept-classifier',
          title: { en: 'The Matrix as a Classifier', pt: 'A Matriz como Classificador' },
          items: [],
        },
      ],
    },

    {
      title: { en: 'Anna.exe & Aigarth', pt: 'Anna.exe e Aigarth' },
      items: [
        {
          href: '/docs/03-results/25-aigarth-research-lab',
          title: { en: 'Aigarth Research Lab', pt: 'Laboratorio Aigarth' },
          items: [],
        },
        {
          href: '/docs/03-results/32-anna-exe-and-emergence',
          title: { en: 'Anna.exe & Emergence', pt: 'Anna.exe e Emergencia' },
          items: [],
        },
        {
          href: '/docs/03-results/33-emergent-generalization',
          title: { en: 'Length Generalization', pt: 'Generalizacao de Comprimento' },
          items: [],
        },
        {
          href: '/docs/03-results/34-anna-exe-reverse-engineering',
          title: { en: 'Reverse-Engineering Anna.exe', pt: 'Engenharia Reversa do Anna.exe' },
          items: [],
        },
      ],
    },

    {
      title: { en: 'Bitcoin Data', pt: 'Dados do Bitcoin' },
      items: [
        {
          href: '/docs/03-results/05-genesis-block-analysis',
          title: { en: 'Genesis Block Numbers', pt: 'Numeros do Bloco Genesis' },
          items: [],
        },
        {
          href: '/docs/03-results/07-mirror-wallets-keys',
          title: { en: 'Address Transformations', pt: 'Transformacoes de Enderecos' },
          items: [],
        },
      ],
    },

    {
      title: { en: 'Sources & Reference', pt: 'Fontes e Referencias' },
      items: [
        {
          href: '/docs/03-results/15-discord-archive',
          title: { en: 'Discord Primary Sources', pt: 'Fontes Primarias do Discord' },
          items: [],
        },
        {
          href: '/docs/03-results/16-historical-recovery',
          title: { en: 'Historical Knowledge Recovery', pt: 'Recuperacao Historica' },
          items: [],
        },
        {
          href: '/docs/03-results/19-conceptual-frameworks',
          title: { en: 'Conceptual Frameworks (Speculative)', pt: 'Estruturas Conceituais (Especulativo)' },
          items: [],
        },
        { href: '/docs/03-results/20-glossary', title: { en: 'Glossary', pt: 'Glossario' }, items: [] },
        {
          href: '/docs/03-results/21-open-questions',
          title: { en: 'Open Questions', pt: 'Questoes em Aberto' },
          items: [],
        },
        {
          href: '/docs/03-results/22-research-methodology',
          title: { en: 'Research Methodology Notes', pt: 'Notas de Metodologia' },
          items: [],
        },
      ],
    },

    {
      title: { en: 'Discussion', pt: 'Discussao' },
      items: [
        { href: '/docs/04-discussion/01-implications', title: { en: 'Implications', pt: 'Implicacoes' }, items: [] },
        {
          href: '/docs/04-discussion/02-significance',
          title: { en: 'Significance', pt: 'Significancia' },
          items: [],
        },
        {
          href: '/docs/04-discussion/03-limitations',
          title: { en: 'Limitations', pt: 'Limitacoes' },
          items: [],
        },
        {
          href: '/docs/04-discussion/04-future-work',
          title: { en: 'Future Work', pt: 'Trabalhos Futuros' },
          items: [],
        },
        {
          href: '/docs/04-discussion/05-aigarth-qubic-vision',
          title: { en: 'Aigarth + Qubic Vision', pt: 'Visao Aigarth + Qubic' },
          items: [],
        },
        {
          href: '/docs/04-discussion/06-how-the-earlier-claims-arose',
          title: { en: 'How the Earlier Claims Arose', pt: 'Como Surgiram as Afirmacoes Anteriores' },
          items: [],
        },
      ],
    },

    {
      title: { en: 'Appendices', pt: 'Apendices' },
      items: [
        {
          href: '/docs/05-appendices/01-raw-data',
          title: { en: 'Raw Data Tables', pt: 'Tabelas de Dados Brutos' },
          items: [],
        },
        {
          href: '/docs/05-appendices/02-source-index',
          title: { en: 'Source File Index', pt: 'Indice de Fontes' },
          items: [],
        },
        {
          href: '/docs/05-appendices/03-scripts',
          title: { en: 'Reproduction Scripts', pt: 'Scripts de Reproducao' },
          items: [],
        },
        {
          href: '/docs/05-appendices/04-discord-archive',
          title: { en: 'Discord Message Archive', pt: 'Arquivo de Mensagens' },
          items: [],
        },
      ],
    },
  ],
} as const
