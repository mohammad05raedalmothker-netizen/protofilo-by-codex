# Validation — 11 November 2026

## Passed

- ESLint over application, scene, scripts, and tests.
- Four existing Node unit tests: calculator precision, input bounds, Unicode contact URL encoding, and default email subjects.
- Production build, duplicate-ID validation, and local anchor/ARIA target validation.
- Live in-app browser: WebGL initialization (`sceneState=ready`), rendered desktop/mobile scene, and empty error/warning log during inspection.
- Live in-app browser: pause control stops the renderer's animation state.
- Project search, Python category (two results), empty state, reset, and bulk expansion/collapse.
- Mobile menu opening, following the Work anchor, automatic menu closing, and keyboard expansion of project details.
- CV dialog opening and Escape dismissal.
- Toolkit category selection and accompanying caption.
- Workflow scenario and stage controls.
- No horizontal overflow or clipped controls in settled layouts at 320, 375, 580, 768, 1024, and 1440 CSS pixels. Visual inspection of 375px hero, 1440px hero, and project gallery.

## Not completed

- The standalone headless Chrome regression suite: the sandbox blocked Chrome, and the escalated launch was declined. No automated browser suite is reported as passed.
- Separate Safari and Firefox runs; touch-device hardware testing.
- Runtime simulation of unavailable WebGL, context loss/restoration, and changed OS reduced-motion preference.
- Prolonged GPU/memory profiling. Scene lifecycle and resource disposal were reviewed in code; long-duration leak-free operation is not claimed.

The automated browser suite remains in `tests/browser.test.cjs` for a permitted local run. GitHub CI runs lint, unit tests, build, and that suite against the production preview.
