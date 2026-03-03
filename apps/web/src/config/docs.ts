/**
 * Documentation configuration for the Bitcoin-Qubic Bridge Research
 * Structured following IMRAD academic format:
 * Introduction, Methods, Results, and Discussion
 */

import type { DocsConfig } from '@/lib/opendocs/types/docs'

export const docsConfig: DocsConfig = {
  mainNav: [
    {
      href: '/docs',

      title: {
        en: 'Research',
        pt: 'Pesquisa',
      },
    },
  ],

  sidebarNav: [
    {
      title: {
        en: 'Introduction',
        pt: 'Introducao',
      },

      items: [
        {
          href: '/docs',

          title: {
            en: 'Overview',
            pt: 'Visao Geral',
          },

          items: [],
        },

        {
          href: '/docs/01-introduction/02-background',

          title: {
            en: 'Background',
            pt: 'Contexto',
          },

          items: [],
        },

        {
          href: '/docs/01-introduction/03-motivation',

          title: {
            en: 'Motivation',
            pt: 'Motivacao',
          },

          items: [],
        },

        {
          href: '/docs/01-introduction/04-objectives',

          title: {
            en: 'Objectives',
            pt: 'Objetivos',
          },

          items: [],
        },
      ],
    },

    {
      title: {
        en: 'Methods',
        pt: 'Metodos',
      },

      items: [
        {
          href: '/docs/02-methods/01-methodology',

          title: {
            en: 'Methodology',
            pt: 'Metodologia',
          },

          items: [],
        },

        {
          href: '/docs/02-methods/02-tools',

          title: {
            en: 'Tools',
            pt: 'Ferramentas',
          },

          items: [],
        },

        {
          href: '/docs/02-methods/03-verification',

          title: {
            en: 'Verification',
            pt: 'Verificacao',
          },

          items: [],
        },

        {
          href: '/docs/02-methods/04-analysis-framework',

          title: {
            en: 'Analysis Framework',
            pt: 'Framework de Analise',
          },

          items: [],
        },

        {
          href: '/docs/02-methods/05-statistical-rigor',

          title: {
            en: 'Statistical Rigor',
            pt: 'Rigor Estatistico',
          },

          items: [],
        },
      ],
    },

    {
      title: {
        en: 'Anna Matrix Analysis',
        pt: 'Analise da Matriz Anna',
      },

      items: [
        {
          href: '/docs/03-results/01-matrix-symmetry',

          title: {
            en: 'Matrix Symmetry & Structural Properties',
            pt: 'Simetria e Propriedades Estruturais',
          },

          items: [],
        },

        {
          href: '/docs/03-results/02-matrix-decode',

          title: {
            en: 'Mathematical Decode & Pattern Analysis',
            pt: 'Decodificacao Matematica e Padroes',
          },

          items: [],
        },

        {
          href: '/docs/03-results/03-matrix-messages',

          title: {
            en: 'Encoded Message Catalogue',
            pt: 'Catalogo de Mensagens Codificadas',
          },

          items: [],
        },

        {
          href: '/docs/03-results/04-anna-bot-verification',

          title: {
            en: 'Anna Bot Algorithm Verification',
            pt: 'Verificacao do Algoritmo Anna Bot',
          },

          items: [],
        },
      ],
    },

    {
      title: {
        en: 'Bitcoin Blockchain Analysis',
        pt: 'Analise da Blockchain Bitcoin',
      },

      items: [
        {
          href: '/docs/03-results/05-genesis-block-analysis',

          title: {
            en: 'Genesis Block Numerical Analysis',
            pt: 'Analise Numerica do Bloco Genesis',
          },

          items: [],
        },

        {
          href: '/docs/03-results/06-address-archaeology',

          title: {
            en: 'Bitcoin Address Archaeology',
            pt: 'Arqueologia de Enderecos Bitcoin',
          },

          items: [],
        },

        {
          href: '/docs/03-results/07-mirror-wallets-keys',

          title: {
            en: 'Mirror Wallets & Key Generation',
            pt: 'Carteiras Espelho e Geracao de Chaves',
          },

          items: [],
        },

      ],
    },

    {
      title: {
        en: 'Qubic-Bitcoin Bridge',
        pt: 'Ponte Qubic-Bitcoin',
      },

      items: [
        {
          href: '/docs/03-results/10-primary-formula',

          title: {
            en: 'Primary Formula: 676 = 26\u00B2',
            pt: 'Formula Primaria: 676 = 26\u00B2',
          },

          items: [],
        },

        {
          href: '/docs/03-results/11-mathematical-connections',

          title: {
            en: 'Cross-Domain Mathematical Connections',
            pt: 'Conexoes Matematicas Inter-Dominios',
          },

          items: [],
        },

        {
          href: '/docs/03-results/12-statistical-validation',

          title: {
            en: 'Statistical Validation & Null Results',
            pt: 'Validacao Estatistica e Resultados Nulos',
          },

          items: [],
        },
      ],
    },

    {
      title: {
        en: 'Qubic Architecture',
        pt: 'Arquitetura Qubic',
      },

      items: [
        {
          href: '/docs/03-results/13-jinn-architecture',

          title: {
            en: 'JINN Processor Architecture',
            pt: 'Arquitetura do Processador JINN',
          },

          items: [],
        },

        {
          href: '/docs/03-results/14-qubic-codex',

          title: {
            en: 'Qubic Codex & Instruction Set',
            pt: 'Codex Qubic e Conjunto de Instrucoes',
          },

          items: [],
        },
      ],
    },

    {
      title: {
        en: 'Source Archaeology',
        pt: 'Arqueologia de Fontes',
      },

      items: [
        {
          href: '/docs/03-results/15-discord-archive',

          title: {
            en: 'Discord Primary Source Archive',
            pt: 'Arquivo de Fontes Primarias do Discord',
          },

          items: [],
        },

        {
          href: '/docs/03-results/16-historical-recovery',

          title: {
            en: 'Historical Knowledge Recovery',
            pt: 'Recuperacao de Conhecimento Historico',
          },

          items: [],
        },
      ],
    },


    {
      title: {
        en: 'Reference',
        pt: 'Referencia',
      },

      items: [
        {
          href: '/docs/03-results/20-glossary',

          title: {
            en: 'Glossary of Terms',
            pt: 'Glossario de Termos',
          },

          items: [],
        },

        {
          href: '/docs/03-results/21-open-questions',

          title: {
            en: 'Open Questions & Future Directions',
            pt: 'Questoes Abertas e Direcoes Futuras',
          },

          items: [],
        },

        {
          href: '/docs/03-results/22-research-methodology',

          title: {
            en: 'Research Methodology Notes',
            pt: 'Notas de Metodologia de Pesquisa',
          },

          items: [],
        },
      ],
    },

    {
      title: {
        en: 'Discussion',
        pt: 'Discussao',
      },

      items: [
        {
          href: '/docs/04-discussion/01-implications',

          title: {
            en: 'Implications',
            pt: 'Implicacoes',
          },

          items: [],
        },

        {
          href: '/docs/04-discussion/02-significance',

          title: {
            en: 'Significance',
            pt: 'Significancia',
          },

          items: [],
        },

        {
          href: '/docs/04-discussion/03-limitations',

          title: {
            en: 'Limitations',
            pt: 'Limitacoes',
          },

          items: [],
        },

        {
          href: '/docs/04-discussion/04-future-work',

          title: {
            en: 'Future Work',
            pt: 'Trabalhos Futuros',
          },

          items: [],
        },
      ],
    },

    {
      title: {
        en: 'Appendices',
        pt: 'Apendices',
      },

      items: [
        {
          href: '/docs/05-appendices/01-raw-data',

          title: {
            en: 'Raw Data Tables',
            pt: 'Tabelas de Dados',
          },

          items: [],
        },

        {
          href: '/docs/05-appendices/02-foundation-facts',

          title: {
            en: 'Foundation Facts',
            pt: 'Fatos Fundamentais',
          },

          items: [],
        },

        {
          href: '/docs/05-appendices/02-source-index',

          title: {
            en: 'Source File Index',
            pt: 'Indice de Arquivos',
          },

          items: [],
        },

        {
          href: '/docs/05-appendices/03-scripts',

          title: {
            en: 'Reproduction Scripts',
            pt: 'Scripts de Reproducao',
          },

          items: [],
        },

        {
          href: '/docs/05-appendices/04-discord-archive',

          title: {
            en: 'Discord Message Archive',
            pt: 'Arquivo de Mensagens',
          },

          items: [],
        },
      ],
    },
  ],
} as const
