# Mohammad Raed — AI Systems Portfolio

A personal portfolio for AI agents, workflow automation, RAG, and intelligent integrations. It evolves the original HTML/CSS/JavaScript site and preserves its nine projects, project URLs, interactive workflow simulator, savings estimator, printable CV, and contact composer.

## Run locally

Use Node.js 22 or newer and pnpm 11.

```sh
pnpm install
pnpm run build
pnpm run preview
```

Open http://127.0.0.1:4173. The preview serves the production build in `dist/`. Run the build again and refresh after source changes.

```sh
pnpm run lint
pnpm test
pnpm run test:browser  # With the preview running and Google Chrome installed
```

If the environment uses an existing non-default pnpm store, pass its path to pnpm with `--store-dir`. This is a machine configuration, not a project dependency.

## Architecture

- `index.html` contains the complete semantic portfolio, including all project details. No important information depends on WebGL.
- `styles.css` preserves the original accessible components; `experience.css` adds the charcoal/orange visual identity and responsive layouts.
- `app.js` retains filtering, workflow demos, calculator, contact handoff, CV dialog, and the Second Brain scroll narrative.
- `experience.js` initializes optional interactions and defers the 3D module until idle. WebGL failure keeps the CSS illustration and normal content available.
- `system-scene.mjs` uses a single Three.js renderer and scissored views for the agent network, automation pipeline, technology clusters, and contact scene. Geometry and materials are reused, particles are instanced, and the camera follows native scrolling. Project diagrams use lightweight SVG and CSS perspective.
- `portfolio-core.js` contains pure calculator and contact-URL logic.
- `scripts/build.cjs` validates local anchor targets, copies an explicit asset allowlist, and uses esbuild to bundle/minify the 3D module. Three.js is served locally; there is no runtime CDN dependency for 3D.

## Motion and performance

The scene caps pixel ratio at 1.65 on desktop and 1.25 on small screens, reduces it under sustained rendering pressure, stops when no scene is visible or the page is hidden, and cleans up GPU resources when leaving. Reduced-motion preferences stop automatic scene animation. A visible pause/play control is available. Context loss returns to the static illustration and context restoration resumes rendering.

The page keeps native scrolling and keyboard-operable HTML controls. Theme choice is remembered when browser storage is available; dark is the default. Google Fonts are optional, with local system-font fallbacks.

## Contact and content

There is no message-sending backend. Contact actions prepare a WhatsApp or email draft for the visitor to review and send in their own app. The calculator is an explicitly illustrative planning scenario, not a claim of achieved savings. Existing project links and contact destinations are retained. No credentials belong in this repository.

## Release verification

See `VALIDATION.md` for the checks actually performed and remaining browser coverage. Build output is reproducible and is excluded from source control, along with dependencies, local screenshots, rollback copies, and caches. Deploy `dist/` to a static host if needed. A private GitHub repository stores the source privately; hosting visibility is a separate setting.
