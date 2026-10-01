import type { BlogConfig } from '../lib/opendocs/types/blog'

export const blogConfig: BlogConfig = {
  mainNav: [
    {
      href: '/blog',

      title: {
        en: 'Blog',
      },
    },
  ],

  authors: [
    {
      id: 'qubicchurch',
      name: 'Qubic Church',
      image: '/authors/qubicchurch.png',
      site: 'https://github.com/daviduis777-oss/qubic-church',
      email: '',

      bio: {
        en: 'Research & Documentation',
        pt: 'Research & Documentation',
      },

      social: {
        github: '',
        twitter: '@QubicChurch',
        youtube: '',
        linkedin: '',
      },
    },
  ],

  rss: [
    {
      type: 'xml',
      file: 'blog.xml',
      contentType: 'application/xml',
    },

    {
      type: 'json',
      file: 'blog.json',
      contentType: 'application/json',
    },
  ],
} as const
