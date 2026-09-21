# How this site works

Recap written 2026-09-21, after replacing the old Hugo site with a Next.js site.

## The big picture

```
Your Mac (edit code)  ──git push──▶  GitHub (skirwan3/blog)  ──auto-build──▶  Vercel  ──▶  live site
```

- **Code lives in GitHub:** `https://github.com/skirwan3/blog`
- **Vercel watches the repo.** Every push builds the site automatically.
  - Push to `main` → **Production** deployment (the real site).
  - Push to any other branch, or open a pull request → **Preview** deployment with its own temporary URL.
- The site is static: pages are generated at build time, so it is fast and cheap to host.

## The stack

| Piece | What it does |
|---|---|
| Next.js 16 (App Router) | Framework: routing, pages, build |
| TypeScript | Type-checked JavaScript |
| Tailwind CSS v4 | Styling (utility classes plus theme colours in `src/app/globals.css`) |
| Motion (`motion/react`) | Animation: hero, scroll reveals, hover effects, nav underline |
| MDX (`@next/mdx`, `remark-gfm`) | Blog posts written in Markdown that can embed React components |

## Repo layout

```
src/
  app/
    layout.tsx            Page shell: fonts, nav, footer, motion settings
    page.tsx              Home page (hero + latest posts)
    about/page.tsx        About page (placeholder, still to write)
    blog/page.tsx         Blog index
    blog/[slug]/page.tsx  One page per post (generated from the MDX files)
    globals.css           Theme colours, base styles, post typography
  components/
    Hero, Nav, Footer, PostCard, Reveal, Providers
    mdx/                  Components you can use inside posts (Callout, Tokenizer)
  content/posts/          Blog posts, one .mdx file each
  lib/
    posts.ts              Reads posts from disk (server only)
    post-types.ts         Post types and date formatting (safe for client code)
  mdx-components.tsx      Registers components available inside MDX posts
next.config.mjs           Enables MDX
```

## Writing a post

1. Add `src/content/posts/my-post.mdx`. The file name becomes the URL: `/blog/my-post`.
2. Start it with a metadata block:

   ```mdx
   export const metadata = {
     title: "My post",
     description: "One-line summary shown on cards and in search results.",
     date: "2026-10-01",
     tags: ["ai", "explainer"],
   };
   ```

3. Write Markdown below it. Use components like `<Callout title="Note">…</Callout>` or `<Tokenizer />` anywhere.
4. To create a new interactive component: add it in `src/components/mdx/`, then register it in `src/mdx-components.tsx`. Components that use state, effects or animation need `"use client"` at the top.

## Running locally

```bash
cd /Users/stuartkirwan/Documents/Data_Projects/blog_portfolio/blog
npm install        # first time on a machine only
npm run dev        # http://localhost:3000, live reload
npm run build      # production build: run this before merging
npm run lint
```

## Recommended workflow for changes

1. `git switch main && git pull`
2. `git switch -c short-descriptive-name` (one branch per change or feature)
3. Make changes and check them at `localhost:3000`.
4. Run `npm run build && npm run lint`.
5. Commit and push the branch. Vercel posts a **preview URL** for it.
6. Open a pull request into `main`, look at the preview, then merge.
7. Vercel deploys `main` to production automatically.

Never commit directly to `main`. It is the live site.

## Things that bit us during setup (so they don't again)

- **Vercel framework preset must be "Next.js".** The project was first created when the repo held only a README, so Vercel guessed "Other" with output directory `public`, and the build failed with "No Output Directory named public". Fixed in Project Settings → Build and Deployment.
- **`~/.config` was owned by root**, which stopped `gh auth login` from saving its login. Fixed with `sudo chown -R $(whoami):staff ~/.config`.
- **This Next.js version is newer than most tools' training data.** `AGENTS.md` and `CLAUDE.md` tell AI assistants to read the docs bundled in `node_modules/next/dist/docs/` before writing code. Keep those files.
- **Post dates are formatted in UTC** so a date like `2026-09-21` never shows as the day before.
- **Server-only code (`node:fs`) must not be imported from client components.** That is why `post-types.ts` is separate from `posts.ts`.
- **Local-only files are git-ignored:** `.claude/` (preview config) and `.Rhistory`.

## Other locations

- **Old Hugo site (backup):** `../hugo_backup/skirwan3_blog_portfolio` on this Mac only. Not in GitHub.
- **Old live site:** `skirwan3.github.io` (GitHub Pages) is a separate repo and may still be live. Decide whether to retire it or redirect it to the new site.
