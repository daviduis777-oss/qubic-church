# Qubic Church — How to Deploy

## Quick Start (3 minutes)

1. Go to [vercel.com](https://vercel.com) and sign in with your GitHub account
2. Click **"Add New..."** → **"Project"**
3. Find and import **`RideMatch1/qubic-church`** (or your fork of it)
4. Leave all settings as-is — **do NOT change Root Directory**
   (the `vercel.json` in the repo handles build config automatically)
5. Click **"Deploy"**

That's it. Your site will be live at `your-project.vercel.app` in about 2 minutes.

---

## Custom Domain — `qubic.church`

After deploying:

1. In Vercel: **Settings** → **Domains** → type `qubic.church` → **Add**
2. Vercel will show you DNS records to configure:
   - **A record**: `76.76.21.21`
   - **CNAME** (for www): `cname.vercel-dns.com`
3. Set those records at whichever registrar the domain is managed
4. SSL is automatic — no action needed

If the domain was transferred to your Vercel account, it will connect instantly.
If it's at an external registrar, DNS propagation takes up to 48 hours (usually minutes).

---

## How It Works After Setup

- **Push to `main`** → automatic production deploy
- **Push to any branch / open a PR** → automatic preview deploy with its own URL
- Contributors with push access can update the site → your Vercel deploys automatically
- No manual action needed from you after the initial setup

---

## Legal Page Checklist

The site includes a legal page at `/legal`. Review and update these items:

- [ ] **Contact Info** — Currently links to GitHub Issues. Add an email if preferred.
- [ ] **Impressum** — If you or your audience are in Germany/EU, German law (TMG §5)
      requires a named person or organization with postal address. Add this to Section 7.
- [ ] **Privacy Policy** — Currently states: no cookies, no tracking, Vercel hosting only.
      If you add analytics (Google Analytics, Plausible, etc.) or third-party services later,
      update Section 4 accordingly.
- [ ] **Cookie Banner** — Not needed currently. Only required if you add cookies later.

---

## Troubleshooting

**Build fails with "output directory not found"?**
→ Make sure Root Directory is `./` (the default). Do NOT set it to `apps/web`.
The `vercel.json` in the repo already configures the correct build command and output path.

**Build fails for another reason?**
→ Ask Claude (claude.ai):
> "I'm deploying a Next.js pnpm monorepo on Vercel. The build fails with: [paste error]"

---

## Tech Stack

Next.js 16 | pnpm monorepo | Tailwind CSS v4 | MDX docs | Vercel hosting
