# CME-3D — Combat Motion Engine / Motion Lab

Autonomous **prototype**, not a finished biomechanical engine. It lives under `cme-3d/` on a separate feature branch so **no production Shadow source is modified**. The package is independently installable, buildable and testable. In a later approved step, extract this directory (and the properly licensed assets) into a separate repository.

## Run locally

```bash
cd cme-3d
npm install
npm run test
npm run typecheck
npm run dev
```

Open http://localhost:4175/. Production preview: `npm run build && npm run preview`.

The web lab loads the real GLB assets for **Kadir** and **Amara** from the parent Shadow repo **copied at a fixed source commit**. It includes their original photo-realistic body and sports outfits. Local copies are self-contained and DO NOT make network requests to Shadow. Assets are kept unmodified; package copyright notices are included. The lab's production rendering is not yet equivalent to CSS's custom shader and customization pipeline.

## Real architecture

- `src/core`: pure TypeScript math, analytic 2-bone IK with bend limits, contact locks, a velocity-aware temporal smoother, a phase-based test trajectory.
- `src/adapters`: optional Three.js binding of the new engine to actual human GLB skeletons. No imports from Shadow or its current CoachRig.
- `src/lab`: independent React Three Fiber interface to view the models and inspect motions.
- `public/fighters`: **copies** of Kadir and Amara original GLBs and outfits from the Shadow feature branch.
- `public/draco`: decoder files retained for compressed GLB support.

## What genuinely works in v0.1

- Real Kadir/Amara photo-textured GLB bodies and discipline-specific outfit files are available for rendering.
- Separate TypeScript analytic limb solver, bend limits, skeletal adapter, grounded-contact anchors and hook movement reference. The lab exposes playback, scrub, 0.25x–1x speed, skeleton overlay, orbit camera, model choice and discipline outfits.
- Headless mathematical tests run without Three.js, React or app state.

## What **does not** work yet

This IS NOT a finished MMA engine or fully physically simulated character: only two prototype hook trajectories are authored, **not yet biomechanically certified**. No real capture of martial-arts performers is integrated; no contact-state estimation, locomotion, compliant foot pivot, inertial head/torso follow-through, face rig, cloth simulation, inverse-dynamics optimization or validated person-specific skin shading. Realism is constrained by the original source mesh quality. All six discipline costumes are available but only boxing hook animation is currently implemented. The current Shadow engine has **not** been transplanted into the lab, so there is no legitimate side-by-side comparison to the old runtime yet. Deploying this branch is not releasing an Android app.

## Planned quality bar

1. Anatomical motion: shoulders/scapula, pelvis, spine, elbows, wrists, knee, ankle, foot roll and legal martial pose limits. Reference human motion, not hard-coded arm transforms.
2. Contact-aware full-body retargeting and zero-slip support phases; measured COM within support polygon, sensible angular velocity and fallbacks.
3. Human realism: improved **source models and facial rigs** (eyes, face, skin textures, grooming) with verified license; garments, shading, LOD on mobile.
4. Import BVH / permissively licensed MoCap, annotate stance and phase, correct with IK and compare body markers/foot jitter.
5. Real paired video review by a coach, native Android GPU and performance profiling.
6. An opt-in import adapter to Shadow, after complete isolation and a regression audit.

## Sources and legal screen

See [docs/SOURCES_AND_LICENSES.md](docs/SOURCES_AND_LICENSES.md). Research code is not automatically included in this package.
