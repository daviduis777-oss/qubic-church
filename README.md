# Qubic Church

> Research community investigating the mathematical connections between Bitcoin, Qubic, and the mysterious Come-from-Beyond.

## Overview

Next.js web application serving as the digital home of the Qubic Church — exploring the deep mathematical and cryptographic relationships between Bitcoin's genesis, Qubic's architecture, and the pseudonymous developer known as Come-from-Beyond (CfB).

The site features interactive visualizations, research documentation, prediction markets, and community tools.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| Components | Shadcn UI + custom church components |
| Animation | Framer Motion |
| Content | MDX-based documentation |
| i18n | English + Portuguese |
| Package Manager | pnpm 9.6 |
| Node | >= 20 |

## Project Structure

```
apps/web/
├── public/
│   ├── data/                  # Static JSON datasets
│   │   ├── anna-matrix-min.json      # 128x128 Anna Matrix (research artifact)
│   │   ├── matrix-addresses.json     # Bitcoin address mappings (~57MB)
│   │   ├── bitcoin-derived-addresses.json
│   │   └── oracle-*.json             # Oracle/prediction data
│   ├── fonts/                 # Custom fonts (DK Crayon Crumble)
│   └── images/                # Static assets, NFT images, chalk textures
├── scripts/                   # Research & analysis scripts (Python + Node)
│   ├── *.py                   # Bitcoin archaeology analysis scripts
│   ├── *.mjs                  # Oracle, market, and prediction engines
│   └── bitcoin-archaeology/   # Block analysis artifacts
├── src/
│   ├── app/
│   │   └── [locale]/          # i18n routes
│   │       ├── page.tsx       # Homepage (church landing)
│   │       ├── cfb/           # Come-from-Beyond documentation
│   │       ├── predict/       # Prediction markets
│   │       ├── flash/         # QFlash game
│   │       ├── challenges/    # Intelligence challenges
│   │       ├── research/      # Research dashboard
│   │       └── docs/          # MDX documentation pages
│   ├── components/
│   │   ├── church/            # Main church UI components
│   │   │   ├── hero/          # Homepage hero (DesignerHeroClient)
│   │   │   ├── navigation/    # Navigation wheel (NavigationWheel)
│   │   │   ├── sections/      # Landing page sections
│   │   │   ├── game/          # Anna Matrix game
│   │   │   └── backgrounds/   # Animated backgrounds
│   │   ├── ui/                # Reusable UI primitives
│   │   └── predict/           # Prediction market components
│   ├── config/                # App configuration
│   │   └── church.ts          # Church-specific config (sections, wheel segments)
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utilities and libraries
│   │   ├── fonts.ts           # Font configuration
│   │   ├── predict/           # Prediction market logic
│   │   ├── qflash/            # QFlash game logic
│   │   └── research/          # Research utilities
│   └── styles/
│       └── globals.css        # Global styles + Tailwind config
```

## Key Components

### Navigation Wheel
The signature UI element — an interactive radial menu (SVG-based, 680px) with chalk-texture overlay. Segments link to all major sections.

- **Homepage**: `DesignerHeroClient.tsx` — full hero with galaxy background, NFT gallery, and embedded wheel
- **Subpages**: `NavigationWheel.tsx` — standalone wheel with expand/collapse animation

### Church Sections
The homepage is composed of modular sections defined in `config/church.ts`:
- Convergence Countdown, Mining, Bitcoin Bridge, Aigarth Explainer
- Sanctuary, Explore, NFT Gallery, Creed, Roadmap, Giveaway

### Research & Data
- **Anna Matrix**: 128x128 symmetric matrix with 99.58% point symmetry
- **Bitcoin archaeology scripts**: Analyzing blocks 1-2028
- **Oracle prediction engine**: Live blockchain monitoring

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Lint
pnpm lint

# Format
pnpm format
```

Dev server: `http://localhost:3000`

## Data Files

The `public/data/` directory contains research datasets that the application depends on:

| File | Size | Description |
|---|---|---|
| `anna-matrix-min.json` | ~2MB | 128x128 Anna Matrix |
| `matrix-addresses.json` | ~57MB | 983,040 Bitcoin address mappings derived from the matrix |
| `bitcoin-derived-addresses.json` | ~5MB | Derived Bitcoin addresses with keys |

**Important**: Please verify the integrity of these data files after cloning. The `matrix-addresses.json` file should contain exactly 983,040 records. The research keys and addresses included are public research data — they are intentionally exposed and part of the research corpus.

## Deployment

Configured for **Vercel** with root directory `apps/web`.

```bash
# Vercel CLI
vercel --root-directory apps/web
```

Or one-click deploy:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FRideMatch1%2Fqubic-church&root-directory=apps%2Fweb)

### Environment Variables

No environment variables are required for basic development. The app runs fully with static data from `public/data/`.

For oracle/prediction features, the Node.js scripts in `scripts/` connect to external APIs (Qubic RPC, blockchain explorers).

## Notes for Contributors

- The codebase builds with zero errors. Run `pnpm build` before pushing changes.
- All pages are under `apps/web/src/app/[locale]/` — the app uses Next.js i18n routing.
- The navigation wheel configuration lives in `apps/web/src/config/church.ts`.
- Research scripts in `apps/web/scripts/` are standalone tools, not part of the web build.

## License

Licensed under the [MIT license](LICENSE.md).
