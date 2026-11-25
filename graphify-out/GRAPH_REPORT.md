# Graph Report - combat-shadow-studio  (2026-11-25)

## Corpus Check
- 759 files · ~1,292,150 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 25 file(s) not represented in the graph (top: .css 17, (none) 3, .f32 2)

## Summary
- 6129 nodes · 17772 edges · 189 communities (169 shown, 20 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 610 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `cca3ecd0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- engine/index.ts
- edit
- vitest
- CoachSelect.tsx
- store/catalog.ts
- rig.ts
- domain/types.ts
- Discipline.tsx
- amara-finish-v1380.test.ts
- DisciplineId
- sys
- dna.ts
- react
- os
- SessionTimeline
- engine/motion.ts
- profile.ts
- AppIcon
- coach/engine.ts
- numpy
- photoMaterials.ts
- Training.tsx
- visage.py
- nlu.ts
- Champions.tsx
- sync/engine.ts
- atmosphere.ts
- w
- build-catalog.mjs
- nav/config.ts
- library/index.ts
- json
- @playwright/test
- suggest.ts
- face.ts
- torsions.ts
- frame
- normalize.ts
- PhotoCoach.tsx
- nav-helpers.ts
- encyclopedia/index.ts
- App.tsx
- ArBridge
- layers.ts
- maj-modeles-v236.spec.ts
- salles.py
- render.py
- Library.tsx
- settings.ts
- outfits.py
- with
- Settings.tsx
- outfit.ts
- CoachStage.tsx
- PremiumPage.tsx
- rooms.ts
- kadir/tete_proj.py
- preload.ts
- steps
- Profile.tsx
- domain/resume.ts
- DEFAULT_PROFILE
- weighted
- outfit
- coachAi.ts
- equipement.py
- audit.ts
- three
- package.json
- steps
- session.ts
- FaceAnimator
- biomech.test.ts
- NavSheets.tsx
- SignIn.tsx
- cache-modeles-v236.test.ts
- consignes-v130.spec.ts
- kanya_build.mjs
- micro-life.test.ts
- with
- CoachAskPanel.tsx
- disciplines.tsx
- with
- releases.ts
- projectFacts.ts
- appGuide.test.ts
- generate.mjs
- scenes.py
- BottomBar.tsx
- @gltf-transform/core
- box
- cyl
- catalog/types.ts
- with
- extra_textures.py
- Encyclopedia.tsx
- steps
- vite
- summary.mjs
- shorts
- with
- steps
- with
- ref_playwright
- session.test.ts
- bmi.ts
- steps
- getMotion
- bra_field
- short_folds.mjs
- steps
- disciplineArt.ts
- shell
- cat
- knowledge.ts
- steps
- math
- validate.ts
- store.ts
- victor_build.mjs
- images.ts
- catalog.test.ts
- compilerOptions
- skin_paint.py
- ChronoScreen.tsx
- PhotoSheet.tsx
- theme.ts
- visuels/compose.py
- check-amara-garments-v1377.py
- scripts
- outfit-amara-v1374.test.ts
- salles/compose.py
- domain/search.ts
- Sheet
- profil.py
- instructions.ts
- kick_target_stand
- rubber
- Glb
- ActiveTimer
- sway.ts
- pulse.ts
- audit-coachs.mjs
- v230/captures.mjs
- useSession.ts
- engine/registry.ts
- training-layout.spec.ts
- clean_torso.py
- theme.spec.ts
- anatomie.py
- behavior.ts
- ArScene.tsx
- defaultLook
- morphology-v220.test.ts
- Button.tsx
- coach-panel-size.spec.ts
- ankle_supports
- native.ts
- v250/captures.mjs
- three/skin.ts
- outfit-v032.test.ts
- disciplines.test.ts
- encyclopedia.test.ts
- retour-createur.spec.ts
- gEntry
- catalog-legends.mjs
- regenerate-amara-v1377.sh
- regenerate-outfits-v1371.sh
- timeline.test.ts
- chrono-seul.spec.ts
- generateStriking
- Privacy.tsx
- Toast.tsx
- soak-3d.mjs
- guide.ts
- main
- side
- restore-kadir-v1373.sh
- MoveStore
- bootAssets.d.ts
- features.ts
- prototype2.sh
- chaine-essai.sh
- greffe-chaine.sh
- realisme-chaine.sh
- regen_outfits.sh

## God Nodes (most connected - your core abstractions)
1. `vitest` - 159 edges
2. `AppIcon()` - 134 edges
3. `DisciplineId` - 113 edges
4. `@playwright/test` - 110 edges
5. `CoachRig` - 110 edges
6. `react` - 100 edges
7. `three` - 96 edges
8. `edit()` - 95 edges
9. `deg()` - 92 edges
10. `v3()` - 83 edges

## Surprising Connections (you probably didn't know these)
- `save()` --indirect_call--> `mf()`  [INFERRED]
  scripts/v230/captures.mjs → src/engine/pose.ts
- `seed()` --calls--> `defaultLook()`  [EXTRACTED]
  tests/e2e/training-layout.spec.ts → src/editor/look.ts
- `add()` --indirect_call--> `pub()`  [INFERRED]
  scripts/boot-sizes.mjs → src/domain/__tests__/visuels.test.ts
- `seed()` --calls--> `defaultLook()`  [EXTRACTED]
  tests/e2e/bjj-judo.spec.ts → src/editor/look.ts
- `seed()` --calls--> `defaultLook()`  [EXTRACTED]
  tests/e2e/coach-suggest.spec.ts → src/editor/look.ts

## Import Cycles
- None detected.

## Communities (189 total, 20 thin omitted)

### Community 0 - "engine/index.ts"
Cohesion: 0.07
Nodes (41): TechniqueCategory, analyseMotion(), Effector, effPos(), StudyAnalysis, wrap(), yawOf(), ENGINE_VERSION (+33 more)

### Community 1 - "edit"
Cohesion: 0.07
Nodes (141): add(), Author, clone(), driveToward(), edit(), lagHand(), vec(), withOffsets() (+133 more)

### Community 2 - "vitest"
Cohesion: 0.02
Nodes (88): vitest, out, disc, entries, FAM, files, reg, uses (+80 more)

### Community 3 - "CoachSelect.tsx"
Cohesion: 0.04
Nodes (122): ALL_COACHES, CHAMPIONS, EXERCISE_BY_ID, EXERCISES, buildProgram(), buildSessions(), CATALOGUE_GAPS, disciplineDefaults() (+114 more)

### Community 4 - "store/catalog.ts"
Cohesion: 0.12
Nodes (27): CoachContext, ImportResult, MAX_IMPORT, buildCatalog(), CATALOG_URL, ImportedData, loadCatalogFile(), mergeCatalogFiles() (+19 more)

### Community 5 - "rig.ts"
Cohesion: 0.06
Nodes (41): ankleQuat(), limitAnkle(), softLimit(), ResolvedFoot, ARM_PAD, BoneRest, CHIN_TUCK_LEAN, clamp() (+33 more)

### Community 6 - "domain/types.ts"
Cohesion: 0.04
Nodes (84): dayKey(), hash(), BJJ, BOXE, build(), describe(), exercisesFor(), JUDO (+76 more)

### Community 7 - "Discipline.tsx"
Cohesion: 0.07
Nodes (77): analyseCombo(), ANALYSIS_VERSION, AnalysisState, analysisState(), clamp(), ComboAnalysis, comboHash(), COVER (+69 more)

### Community 8 - "amara-finish-v1380.test.ts"
Cohesion: 0.03
Nodes (66): all, BASE, BASE_1110, COACHES, headY(), headYCache, Metric, NEW_1110 (+58 more)

### Community 9 - "DisciplineId"
Cohesion: 0.06
Nodes (104): filterExercises(), KbStyleChoice, MasteryCount, masteryCount(), Bucket, bucketDays(), buckets(), byExercise() (+96 more)

### Community 10 - "sys"
Cohesion: 0.04
Nodes (19): main(), validate(), mask(), load(), sample(), blur(), color_stats(), main() (+11 more)

### Community 11 - "dna.ts"
Cohesion: 0.17
Nodes (18): AXIS_OF, comboDna(), Dna, DNA_AXES, DnaAxis, DnaAxisDef, DnaAxisId, dnaSummary() (+10 more)

### Community 12 - "react"
Cohesion: 0.07
Nodes (47): react, TrainingMode, canOpenTechnique(), isPremiumTechnique(), formatDuration(), localDay(), sessionCount(), SessionRecord (+39 more)

### Community 13 - "os"
Cohesion: 0.03
Nodes (18): load(), vnorm(), rest_snapshot(), rest_snapshot(), yaw(), components(), f(), fill() (+10 more)

### Community 15 - "engine/motion.ts"
Cohesion: 0.04
Nodes (73): ChestFrameFn, StanceDef, STANCES, motionEnvelope(), FluidityMeasure, measureFluidity(), POINTS, _arcA (+65 more)

### Community 16 - "profile.ts"
Cohesion: 0.07
Nodes (56): idb-keyval, b64(), cache, cryptoAvailable(), deleteKey(), getKey(), isSealed(), keyStore() (+48 more)

### Community 17 - "AppIcon"
Cohesion: 0.06
Nodes (56): AdvancedSection(), AudioSection(), CameraSection(), canBlur(), CoachPanel(), CoachSection(), fsElement(), LEARN (+48 more)

### Community 18 - "coach/engine.ts"
Cohesion: 0.12
Nodes (62): answerEntry(), answerTechnique(), article(), askCoach(), balance(), cantSee(), catLabel(), cleanPseudo() (+54 more)

### Community 19 - "numpy"
Cohesion: 0.07
Nodes (44): island_mask(), pad(), save(), victor_body(), delight(), nb(), sat(), components() (+36 more)

### Community 20 - "photoMaterials.ts"
Cohesion: 0.08
Nodes (35): Exertion, FACE_RENDER, FaceRenderUniforms, isHeadSkin(), newFaceRenderUniforms(), updateFaceRender(), glbJson(), makeup() (+27 more)

### Community 21 - "Training.tsx"
Cohesion: 0.05
Nodes (74): BY_CATEGORY, BY_TECHNIQUE, CAMERA_MODES, CameraMode, CameraView, FULL, MANUAL, manualView() (+66 more)

### Community 22 - "visage.py"
Cohesion: 0.06
Nodes (28): main(), smooth(), build(), joint_index(), sculpt(), smooth(), welded_normals(), Glb (+20 more)

### Community 23 - "nlu.ts"
Cohesion: 0.05
Nodes (46): CoachAnswer, groundingPassages(), acceptLlmOutput(), askCoachAsync(), FORBIDDEN, GroundingPassage, LlmEngine, LlmRequest (+38 more)

### Community 24 - "Champions.tsx"
Cohesion: 0.09
Nodes (44): allTags(), comboCredit(), dailyPick(), randomPick(), recentCombos(), tagLabel(), newId(), useCatalogUser (+36 more)

### Community 25 - "sync/engine.ts"
Cohesion: 0.09
Nodes (26): CollectionDef, EngineOptions, memoryAdapter(), SyncAdapter, SyncEngine, syncErrorMessage(), SyncPhase, SyncState (+18 more)

### Community 26 - "atmosphere.ts"
Cohesion: 0.07
Nodes (59): AnimalId, ANIMALS, applyOverride(), ATMOSPHERE_OVERRIDES, AtmosphereInput, AtmosphereOverride, atmosphereSignature(), AtmosphereSourceField (+51 more)

### Community 27 - "w"
Cohesion: 0.08
Nodes (30): axis_point(), keep(), bunch(), drape(), fold_weights(), folds(), hand_frame(), hand_wraps() (+22 more)

### Community 28 - "build-catalog.mjs"
Cohesion: 0.03
Nodes (56): ALL_CHAMPIONS, ANGLES, ARCH, ARCH_TIP, B_GROUND, BASE_W, BASE_WEIGHTS, body (+48 more)

### Community 29 - "nav/config.ts"
Cohesion: 0.07
Nodes (33): BACK, BACK_IN_ROW, BACK_IN_ROW_PATHS, BAR_PLACES, BarPlace, CHRONO, ENCYCLOPEDIA, GLOBAL_PLACES (+25 more)

### Community 30 - "library/index.ts"
Cohesion: 0.06
Nodes (36): cache, getLibrary(), snapImpactHold(), chainPoint(), motionPhase(), Active, alive(), ComboPlayer (+28 more)

### Community 31 - "json"
Cohesion: 0.07
Nodes (27): anatomy_masks(), git_blob(), glb_read(), glb_read_bytes(), main(), patch_binary(), repair_color(), skin_image() (+19 more)

### Community 32 - "@playwright/test"
Cohesion: 0.02
Nodes (37): @playwright/test, [BASE = 'http://localhost:4190', CRASHES = '1', COACH = 'homme'], t0, CASES, [OUT, BASE = 'http://localhost:5173', PATH = '/#/'], [OUT, PORT], [OUT, PORT], [OUT, PORT] (+29 more)

### Community 33 - "suggest.ts"
Cohesion: 0.07
Nodes (51): CoachScreen, family(), APP_ANYWHERE, BY_CATEGORY, BY_TECHNIQUE, FAQ_PHRASES, FAQ_RANK, GENERAL_GRAPPLING (+43 more)

### Community 34 - "face.ts"
Cohesion: 0.05
Nodes (45): expressionWeights(), FACE_BASE_DEFAULT, FACE_BASES, FACE_GAIN, FaceBaseId, FaceExpression, FaceIdle, find() (+37 more)

### Community 35 - "torsions.ts"
Cohesion: 0.06
Nodes (49): Side, BODIES, DOC, f1(), fails(), HOOKS, markdown(), name() (+41 more)

### Community 36 - "frame"
Cohesion: 0.13
Nodes (35): box(), _casque(), curve_obj(), cyl(), _digit_text(), frame(), ground(), hexrgb() (+27 more)

### Community 37 - "normalize.ts"
Cohesion: 0.07
Nodes (40): look(), BeardStyle, BottomType, FeetGearType, HairStyle, HandsType, HeadType, Loadout (+32 more)

### Community 38 - "PhotoCoach.tsx"
Cohesion: 0.07
Nodes (38): bakeAmaraCleanSurface(), applyBreath(), Breath, BreathUniforms, dropStillMorphs(), shareFaceRender(), humanProfileFor(), hasGarment() (+30 more)

### Community 39 - "nav-helpers.ts"
Cohesion: 0.06
Nodes (36): HUB_TILE, PLACE, place(), PLACE_URL, KB, OLD, seed(), contrasts() (+28 more)

### Community 40 - "encyclopedia/index.ts"
Cohesion: 0.08
Nodes (33): FAMILY_BY_ID, AzEntry, BY_TECHNIQUE, DISCIPLINE_WORDS, familyLabel, Indexed, subLabel, TermFilter (+25 more)

### Community 41 - "App.tsx"
Cohesion: 0.09
Nodes (43): setEffectsVolume(), setVoiceVolume(), ActivityDetail, App(), AudioSync(), ChampionPage, Champions, ChronoScreen (+35 more)

### Community 42 - "ArBridge"
Cohesion: 0.16
Nodes (8): ArBridge, ArState, ArView, ArSupport, detectAr(), ArControls(), ArIntroSheet(), useArView()

### Community 43 - "layers.ts"
Cohesion: 0.09
Nodes (32): onBackButton(), MenuChip(), MenuChipOption, createDoubleTap(), DoubleTap, DoubleTapOptions, NO_DOUBLE_TAP, Press (+24 more)

### Community 44 - "maj-modeles-v236.spec.ts"
Cohesion: 0.04
Nodes (28): diagnostics, outfits, poses, files, [OUT, PORT, champ, d, tenue, look, label], VIEWS, [OUT, techs, extra = '', n = '7', angles = '0,35,90'], files (+20 more)

### Community 45 - "salles.py"
Cohesion: 0.10
Nodes (25): at, area(), bjj(), boxe(), glow(), heavy_bag(), hexrgb(), industrial_lamp() (+17 more)

### Community 46 - "render.py"
Cohesion: 0.09
Nodes (29): assign(), bezier(), boxing_glove(), _bsdf(), build_bjj(), build_boxe(), build_judo(), build_kickboxing() (+21 more)

### Community 47 - "Library.tsx"
Cohesion: 0.06
Nodes (72): react-router-dom, termForPartner(), termForTechnique(), ALLOWED, BY_TECHNIQUE, CHECKS, filterTechniques(), FRONT_KICKS (+64 more)

### Community 48 - "settings.ts"
Cohesion: 0.12
Nodes (17): cleanSetup(), COACH_PANEL_SIZES, CoachPanelSize, CUE_LABEL, CueId, DEFAULT_SETTINGS, dropRetired(), GROUND_MARK_LABEL (+9 more)

### Community 49 - "outfits.py"
Cohesion: 0.07
Nodes (24): _ao_dirs(), bake_ao(), blur(), cotton(), elastic(), export(), fabric(), file_key() (+16 more)

### Community 50 - "with"
Cohesion: 0.05
Nodes (42): concurrency, cancel-in-progress, group, name, url, rebuild, jobs, rebuild-amara (+34 more)

### Community 51 - "Settings.tsx"
Cohesion: 0.07
Nodes (47): useCoachAi, exportData(), clearDiag(), DiagEntry, DiagKind, diagText(), INCIDENT_KINDS, incidentCount() (+39 more)

### Community 52 - "outfit.ts"
Cohesion: 0.09
Nodes (28): @react-three/drei@^10.7.9, @react-three/drei, base64ToBuffer(), patchJsonModels(), photoAssetPath(), preloadPhotoCoach(), prewarmCoach(), morphologyFor() (+20 more)

### Community 53 - "CoachStage.tsx"
Cohesion: 0.05
Nodes (72): @react-three/fiber, championById(), championFor(), championLook(), championModel(), championStance(), EXTRA_COACHES, SkillId (+64 more)

### Community 54 - "PremiumPage.tsx"
Cohesion: 0.07
Nodes (43): benefitAvailable(), Entitlement, ENTITLEMENT_BY_ID, EntitlementId, ENTITLEMENTS, Implementation, PREMIUM_BENEFITS, PREMIUM_CATEGORIES (+35 more)

### Community 55 - "rooms.ts"
Cohesion: 0.09
Nodes (30): LIFE, RoomLife, stutterAt(), swayOf(), sweepAt(), V3, decodeDepth(), DEPTH_MAX (+22 more)

### Community 56 - "kadir/tete_proj.py"
Cohesion: 0.07
Nodes (16): rbf(), vnorm(), project(), sample(), tps(), f(), U(), uv_raster() (+8 more)

### Community 57 - "preload.ts"
Cohesion: 0.09
Nodes (28): BootGate(), BootScreen(), loaded, useHydrated(), usePlan(), BootItem, bootMessage(), bootPlan() (+20 more)

### Community 58 - "steps"
Cohesion: 0.05
Nodes (37): concurrency, cancel-in-progress, group, KEY_ALIAS, KEY_PASS, KS_B64, KS_PASS, SIGNED (+29 more)

### Community 59 - "Profile.tsx"
Cohesion: 0.13
Nodes (38): buildFullExport(), changeEmail(), changePassword(), getProvider(), linkEmail(), linkGoogle(), reauthenticate(), refreshUser() (+30 more)

### Community 60 - "domain/resume.ts"
Cohesion: 0.11
Nodes (26): ageDays(), isNum(), isStr(), matchesPlan(), MODES, PHASES, pickCard(), PlanBlockLike (+18 more)

### Community 61 - "DEFAULT_PROFILE"
Cohesion: 0.07
Nodes (9): DEFAULT_PROFILE, coachShown(), journal(), kinds(), Dress, dress(), shownDressed(), coachShown() (+1 more)

### Community 62 - "weighted"
Cohesion: 0.07
Nodes (22): belt(), bow_tie(), boxing_glove(), boxing_glove_v2(), collar(), curve(), ellipsoid(), lin() (+14 more)

### Community 63 - "outfit"
Cohesion: 0.10
Nodes (14): bra_low(), bra_v2(), brand_logos(), bridge_cleavage(), female_top(), _flat_mat(), hide_hands(), kanya_kit() (+6 more)

### Community 64 - "coachAi.ts"
Cohesion: 0.33
Nodes (6): COACH_HISTORY_MAX, COACH_SEEN_MAX, CoachAiSettings, CoachAiState, CoachExchange, DEFAULT_COACH_AI

### Community 65 - "equipement.py"
Cohesion: 0.09
Nodes (20): agility_ladder(), belt_board(), board_png(), clock_png(), cloth(), cubbies(), enso_png(), flag_png() (+12 more)

### Community 66 - "audit.ts"
Cohesion: 0.07
Nodes (44): auditTechnique(), auditTransitions(), balanceAt(), BalanceSample, CONTACTS, FLOOR_BONES, groundedSlide(), hull() (+36 more)

### Community 67 - "three"
Cohesion: 0.05
Nodes (28): three, Place, clamp(), MotionSmoother, BONES, STYLE, COMP, Gltf (+20 more)

### Community 68 - "package.json"
Cohesion: 0.04
Nodes (59): config, dependencies, @capacitor/android@^8.5.3, @capacitor/app@^8.1.2, @capacitor-community/keep-awake@^8.0.1, @capacitor-community/text-to-speech@^8.0.2, @capacitor/core@^8.5.3, @capacitor/filesystem@^8.1.5 (+51 more)

### Community 69 - "steps"
Cohesion: 0.06
Nodes (33): concurrency, cancel-in-progress, group, environment, if, runs-on, steps, VITE_FIREBASE_API_KEY (+25 more)

### Community 70 - "session.ts"
Cohesion: 0.23
Nodes (20): AuthCapabilities, AuthUser, scopeForUid(), wipeScope(), AccountState, adopt(), chain, configureAccountForTests() (+12 more)

### Community 71 - "FaceAnimator"
Cohesion: 0.10
Nodes (9): FaceAnimator, Mood, COACHES, applyWrinkles(), FaceWrinkles, WRINKLE_LOOK, WRINKLES_ON_COACHES, wrinkleStrength() (+1 more)

### Community 72 - "biomech.test.ts"
Cohesion: 0.11
Nodes (23): animationStatusOf(), STATUS, STATUS_HELP, STATUS_LABEL, SHEET_BY_ID, SHEETS, PILOT_SHEETS, SOURCE_BY_ID (+15 more)

### Community 73 - "NavSheets.tsx"
Cohesion: 0.27
Nodes (12): releaseDateLabel(), haptic(), NavScreen, navScreen(), CommandIcon(), NavSheets(), HOSTED, looksLikeQuestion() (+4 more)

### Community 74 - "SignIn.tsx"
Cohesion: 0.06
Nodes (33): firebase@^12.19.0, firebase, AUTH_EMULATOR, FIREBASE_ENABLED, firebaseConfig(), FirebaseWebConfig, FIRESTORE_EMULATOR, createFirebaseProvider() (+25 more)

### Community 76 - "consignes-v130.spec.ts"
Cohesion: 0.07
Nodes (9): IDS, NAMES, Cam, startJab(), SCREENS, closeCoachPanel(), showCoachTools(), tileNames() (+1 more)

### Community 77 - "kanya_build.mjs"
Cohesion: 0.06
Nodes (24): bun, bunMat, bunMesh, bunNode, bunTex, done, grid, headIdx (+16 more)

### Community 78 - "micro-life.test.ts"
Cohesion: 0.11
Nodes (14): DRIFT, EVENT_SHAPE, MICRO_EVENTS, MicroChannel, MicroEvent, MicroInput, MicroLife, mirror() (+6 more)

### Community 79 - "with"
Cohesion: 0.07
Nodes (29): runs-on, steps, timeout-minutes, concurrency, cancel-in-progress, group, GH_TOKEN, jobs (+21 more)

### Community 80 - "CoachAskPanel.tsx"
Cohesion: 0.10
Nodes (30): CoachAction, detectSpeechCapabilities(), ERRORS, getSpeechInput(), localFrenchVoice(), RecognitionCtor, recognitionCtor(), safeNative() (+22 more)

### Community 81 - "disciplines.tsx"
Cohesion: 0.12
Nodes (28): DisciplineEmblem(), Props, OUTLINE_DRAWINGS, defaultVariant(), DETAILED_FILES, EMBLEM_SIZES, EmblemEntry, emblemFile() (+20 more)

### Community 82 - "with"
Cohesion: 0.07
Nodes (28): concurrency, cancel-in-progress, group, jobs, render-ab, name, on, push (+20 more)

### Community 83 - "releases.ts"
Cohesion: 0.17
Nodes (10): test, Draft, LATEST_RELEASE, ORDER, Release, RELEASE_CATEGORY_LABEL, ReleaseCategory, ReleaseChange (+2 more)

### Community 84 - "projectFacts.ts"
Cohesion: 0.08
Nodes (30): androidVersion(), combos, DOCS, F, file, orgs, OUT, ROOT (+22 more)

### Community 85 - "appGuide.test.ts"
Cohesion: 0.10
Nodes (28): APP_GUIDE, APP_NOUNS, DEICTIC, ENTRY_BY_ID, GuideEntry, guideEntry(), GuideMatch, HOW (+20 more)

### Community 86 - "generate.mjs"
Cohesion: 0.07
Nodes (23): args, BADGES, c, CHAMPION, DISC, FORCE, IDS, JOBS (+15 more)

### Community 87 - "scenes.py"
Cohesion: 0.12
Nodes (16): chain(), _garment(), long_axis(), origin_to_geometry(), outfit(), pair(), rest_on_ground(), s_dojo() (+8 more)

### Community 88 - "BottomBar.tsx"
Cohesion: 0.18
Nodes (21): hasUnseenRelease(), initials(), BottomBar(), NO_KEBAB, openMenu(), useSmartBack(), backInRow(), barPlaceOf() (+13 more)

### Community 89 - "@gltf-transform/core"
Cohesion: 0.09
Nodes (20): @gltf-transform/core@^4.5.1, @gltf-transform/extensions@^4.5.1, @gltf-transform/core, @gltf-transform/extensions, ibm, io, io, [mode, glb, dir, out] (+12 more)

### Community 90 - "box"
Cohesion: 0.11
Nodes (20): battle_ropes(), bucket(), cones(), image_mat(), kettlebell(), mouthguard_box(), open_crate(), picture() (+12 more)

### Community 91 - "cyl"
Cohesion: 0.15
Nodes (19): bench(), champion_belt(), corner_stool(), double_end_bag(), dummy(), focus_mitt(), gong(), headgear() (+11 more)

### Community 92 - "catalog/types.ts"
Cohesion: 0.12
Nodes (22): CatalogQuery, fold(), hayCache, haystack(), LENGTH_BANDS, LengthBand, searchCombos(), CatalogDistance (+14 more)

### Community 93 - "with"
Cohesion: 0.08
Nodes (25): jobs, matched-webgl, runs-on, steps, timeout-minutes, name, on, pull_request (+17 more)

### Community 94 - "extra_textures.py"
Cohesion: 0.10
Nodes (15): bleed(), blur(), _box(), close(), fabric(), gacc(), halter_skin(), acc() (+7 more)

### Community 95 - "Encyclopedia.tsx"
Cohesion: 0.17
Nodes (20): subfamilyLabel(), imageOf(), coverage(), encyclopediaSource(), PARTNER_BY_ID, QueryChip(), DISC_NAME, discName() (+12 more)

### Community 96 - "steps"
Cohesion: 0.08
Nodes (24): runs-on, steps, timeout-minutes, jobs, amara-skin-checks, name, on, pull_request (+16 more)

### Community 97 - "vite"
Cohesion: 0.06
Nodes (25): vite@^8.3.4, vite, JOBS, [OUT, ...qs], PORT, queue, all, c (+17 more)

### Community 98 - "summary.mjs"
Cohesion: 0.09
Nodes (17): A, after, As, B, Bs, cb, ck(), COACHES (+9 more)

### Community 99 - "shorts"
Cohesion: 0.07
Nodes (21): crotch_relax(), fitted_band(), cloth_weights(), skin_weights(), grad_fabric(), paint_mma_compression(), painted_cloth_bottom(), painted_cloth_range() (+13 more)

### Community 100 - "with"
Cohesion: 0.09
Nodes (22): jobs, webgl-preview, name, on, pull_request, workflow_dispatch, permissions, contents (+14 more)

### Community 101 - "steps"
Cohesion: 0.09
Nodes (22): jobs, premium-skin-webgl, name, on, pull_request, workflow_dispatch, permissions, contents (+14 more)

### Community 102 - "with"
Cohesion: 0.09
Nodes (22): jobs, pilot-webgl, name, on, pull_request, workflow_dispatch, permissions, contents (+14 more)

### Community 103 - "ref_playwright"
Cohesion: 0.09
Nodes (15): boot, targets, [out = 'icons.png', w = '1400'], [base, out, prefix, champ='mma-kadir'], sets, V, screens, shots (+7 more)

### Community 104 - "session.test.ts"
Cohesion: 0.07
Nodes (35): zustand, HANDLED, registerScopedStore(), setReloadForTests(), catalogDef, COLLECTIONS, customDef, fightersDef (+27 more)

### Community 105 - "bmi.ts"
Cohesion: 0.19
Nodes (20): BMI_ADULT_AGE, BMI_CATEGORIES, BMI_GAUGE, BMI_HEIGHT_CM, BMI_LIMITS, BMI_MINOR_NOTE, BMI_WEIGHT_KG, BmiCategory (+12 more)

### Community 106 - "steps"
Cohesion: 0.09
Nodes (21): runs-on, steps, timeout-minutes, jobs, diagnose-torso, name, on, push (+13 more)

### Community 107 - "getMotion"
Cohesion: 0.13
Nodes (20): AnkleAngles, ankleAngles(), relative(), sideName(), getMotion(), ANKLE_LIMIT, ankleAngles(), _e (+12 more)

### Community 108 - "bra_field"
Cohesion: 0.16
Nodes (14): bra_field(), arm_clear(), armw(), field(), strap(), surf(), top_of(), paint_grad() (+6 more)

### Community 109 - "short_folds.mjs"
Cohesion: 0.15
Nodes (19): apply(), applyDir(), args, fade(), folder(), GAIN, invert(), local() (+11 more)

### Community 110 - "steps"
Cohesion: 0.10
Nodes (20): runs-on, steps, timeout-minutes, jobs, diagnose, name, on, push (+12 more)

### Community 111 - "disciplineArt.ts"
Cohesion: 0.25
Nodes (8): ART_PENDING, ArtSource, DISCIPLINE_ART, DisciplineArt, disciplineArt(), OWN, root, walk()

### Community 112 - "shell"
Cohesion: 0.11
Nodes (9): apply(), drape_pass(), iso_cut(), knee_pads(), keep(), shell(), shoes(), keep() (+1 more)

### Community 113 - "cat"
Cohesion: 0.32
Nodes (13): analyse(), cat(), distanceOf(), estimate(), isBody(), isHead(), isStrike(), keyList() (+5 more)

### Community 114 - "knowledge.ts"
Cohesion: 0.15
Nodes (17): MORE_FAQ, ALL_D, ALL_L, CATEGORY_NUANCE, ENTRY_BY_ID(), Faq, FAQ, KICK_D (+9 more)

### Community 115 - "steps"
Cohesion: 0.11
Nodes (18): runs-on, steps, timeout-minutes, jobs, amara-finish, name, on, pull_request (+10 more)

### Community 116 - "math"
Cohesion: 0.12
Nodes (10): belt_roll(), bend(), s_ceintures(), _twist(), belt_strip(), braid(), curve(), mesh_from_grid() (+2 more)

### Community 117 - "validate.ts"
Cohesion: 0.18
Nodes (21): importCatalog(), CatalogReport, DISCIPLINES, DISTANCES, GOALS, GUARDS, isDay(), isHttps() (+13 more)

### Community 118 - "store.ts"
Cohesion: 0.12
Nodes (18): MenuEntry, NavSlot, Tab, NavIconId, ActionView, CommandView, find(), Live (+10 more)

### Community 119 - "victor_build.mjs"
Cohesion: 0.11
Nodes (13): done, grid, ib, ibm, io, joints, meshNode, raw (+5 more)

### Community 120 - "images.ts"
Cohesion: 0.12
Nodes (12): add(), ALIASES, BASE, BY_ID, RenderRecipe, RENDERS, SceneRecipe, SCENES (+4 more)

### Community 121 - "catalog.test.ts"
Cohesion: 0.13
Nodes (19): EMPTY_IMPORT, CatalogCounts, catalogCounts(), isPlayable3D(), sequenceProblems(), file, of(), TARGET (+11 more)

### Community 122 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, isolatedModules, jsx, lib, module, moduleResolution, noEmit, noFallthroughCasesInSwitch (+9 more)

### Community 123 - "skin_paint.py"
Cohesion: 0.12
Nodes (5): at(), load(), raster(), save(), twins()

### Community 124 - "ChronoScreen.tsx"
Cohesion: 0.19
Nodes (19): CHRONO_FORMAT_BY_ID, CHRONO_FORMATS, CHRONO_LIMITS, ChronoFormat, chronoMode(), ChronoSetup, chronoTotal(), clock() (+11 more)

### Community 125 - "PhotoSheet.tsx"
Cohesion: 0.32
Nodes (10): Crop, cropRect(), decodePhoto(), DEFAULT_CROP, PHOTO_MAX_BYTES, PHOTO_SIZE, PHOTO_TYPES, photoProblem() (+2 more)

### Community 126 - "theme.ts"
Cohesion: 0.24
Nodes (12): isTraining(), ThemeColor(), applyTheme(), mq(), onSystemThemeChange(), readSavedTheme(), ResolvedTheme, resolveTheme() (+4 more)

### Community 127 - "visuels/compose.py"
Cohesion: 0.26
Nodes (8): blur(), blur3(), compose(), draw_marks(), main(), room(), subject_box(), value_noise()

### Community 128 - "check-amara-garments-v1377.py"
Cohesion: 0.27
Nodes (7): back_ridge(), chest_coverage(), fitted_bands(), load(), main(), mesh(), mma_shorts()

### Community 129 - "scripts"
Cohesion: 0.17
Nodes (12): scripts, android:aab, android:apk-test, android:open, build, build:android, dev, docs:sync (+4 more)

### Community 130 - "outfit-amara-v1374.test.ts"
Cohesion: 0.17
Nodes (4): INAYA_GIT_SHA, OUTFITS, references, GOOD_1370

### Community 131 - "salles/compose.py"
Cohesion: 0.27
Nodes (6): _box(), compose(), depth_png(), gblur(), hexrgb(), main()

### Community 132 - "domain/search.ts"
Cohesion: 0.29
Nodes (9): discShort(), entries(), Entry, PLACES, score(), SEARCH_GROUPS, searchApp(), SearchGroup (+1 more)

### Community 133 - "Sheet"
Cohesion: 0.30
Nodes (13): react-dom, canBlur(), overlayHost(), scrimHandlers(), SheetDismiss, useBackLayer(), useGlassLite(), useSheetDismiss() (+5 more)

### Community 134 - "profil.py"
Cohesion: 0.26
Nodes (7): landmarks(), main(), sigma(), ref_profile(), slice_profile(), smooth(), vertex_normals()

### Community 135 - "instructions.ts"
Cohesion: 0.15
Nodes (15): INSTRUCTIONS, KeyPoint, PointZone, RETOUR, TechniqueInstruction, CONSIGNE_SECS, ConsigneBand, ConsigneLine (+7 more)

### Community 136 - "kick_target_stand"
Cohesion: 0.18
Nodes (7): boxing_glove(), freestanding_bag(), glove_pair(), kick_shield(), kick_target_stand(), tilt(), vinyl()

### Community 137 - "rubber"
Cohesion: 0.20
Nodes (8): cord(), foam_roller(), hanging_loop(), jump_ropes(), medicine_ball(), resistance_bands(), rubber(), uchikomi_bands()

### Community 138 - "Glb"
Cohesion: 0.22
Nodes (3): Glb, add(), copy_view()

### Community 140 - "sway.ts"
Cohesion: 0.29
Nodes (6): applySway(), Entry, swingKind(), tmpM, tmpN, tmpV

### Community 141 - "pulse.ts"
Cohesion: 0.31
Nodes (8): Listener, listeners, onPulse(), pulse(), PULSE_MIN_GAP_MS, PulseKind, resetPulse(), usePulseFlash()

### Community 142 - "audit-coachs.mjs"
Cohesion: 0.33
Nodes (8): anatomy(), auditFile(), coaches, hullPerimeter(), invert(), io, mat4MulVec(), out

### Community 143 - "v230/captures.mjs"
Cohesion: 0.22
Nodes (8): AZ, DISC, errors, manifest, [OUT = 'docs/v230/captures/raw', coachArg = 'mma-kadir,mma-amara,nael,victor,inaya,kanya', techArg], PHASES, save(), TECHS

### Community 144 - "useSession.ts"
Cohesion: 0.25
Nodes (14): ac(), beep(), bell(), impact(), restSignal(), tone(), unlockAudio(), workProgress() (+6 more)

### Community 145 - "engine/registry.ts"
Cohesion: 0.08
Nodes (33): AnimationStatus, StanceStyle, acceleration(), checkLibrary(), checkMotion(), dist(), finite(), IntegrityLevel (+25 more)

### Community 146 - "training-layout.spec.ts"
Cohesion: 0.25
Nodes (5): camera(), EXERCISES, seed(), SIZES, steady()

### Community 148 - "theme.spec.ts"
Cohesion: 0.25
Nodes (4): ONLY, SCREENS, STUDIO, theme()

### Community 149 - "anatomie.py"
Cohesion: 0.32
Nodes (4): hull_perimeter(), measure(), girth(), sl()

### Community 150 - "behavior.ts"
Cohesion: 0.18
Nodes (12): FaceOptions, BehaviorEngine, CHEER_TIME, HUMAN_STATES, HumanSignals, HumanState, NEUTRAL_MOOD, newSignals() (+4 more)

### Community 151 - "ArScene.tsx"
Cohesion: 0.32
Nodes (7): ArScene(), blobTexture(), ShadowPortal(), tmpM, tmpP, tmpQ, tmpS

### Community 152 - "defaultLook"
Cohesion: 0.07
Nodes (23): @axe-core/playwright, defaultLook(), paint(), session, seed(), rail(), scrollLeft(), seed() (+15 more)

### Community 153 - "morphology-v220.test.ts"
Cohesion: 0.19
Nodes (14): applyMorphology(), Band, displace(), limbShare(), Morphology, MORPHOLOGY_V220, off(), weightAt() (+6 more)

### Community 154 - "Button.tsx"
Cohesion: 0.38
Nodes (5): Button(), ButtonProps, cls(), LinkButton(), Variant

### Community 156 - "ankle_supports"
Cohesion: 0.18
Nodes (8): ankle_supports(), centre(), keep(), leg_of(), mma_shin_guards(), centre(), keep(), push()

### Community 157 - "native.ts"
Cohesion: 0.29
Nodes (10): hasFrenchVoice(), pickVoice(), say(), setVoiceEnabled(), stopVoice(), voiceAvailable(), backHandlers, installNativeHandlers() (+2 more)

### Community 158 - "v250/captures.mjs"
Cohesion: 0.33
Nodes (4): errors, manifest, [OUT = 'docs/v250/captures/raw', coachArg = 'mma-kadir,mma-amara,nael,victor,inaya,kanya', viewArg], SHOTS

### Community 160 - "outfit-v032.test.ts"
Cohesion: 0.40
Nodes (4): COACHES, glb(), Gltf, maxWeight()

### Community 161 - "disciplines.test.ts"
Cohesion: 0.53
Nodes (4): DISCIPLINE_COLOR, ON_DISCIPLINE, contrast(), lum()

### Community 162 - "encyclopedia.test.ts"
Cohesion: 0.23
Nodes (11): FAMILIES, IMAGES, azIndex(), findTerms(), INDEX, initialOf(), normalize(), score() (+3 more)

### Community 163 - "retour-createur.spec.ts"
Cohesion: 0.47
Nodes (4): moves(), OLD, openEditor(), seed()

### Community 164 - "gEntry"
Cohesion: 0.50
Nodes (5): gEntry(), joinFr(), lc(), nameOf(), rle()

### Community 165 - "catalog-legends.mjs"
Cohesion: 0.40
Nodes (3): EXTRA_DISCIPLINES, INFO, NEW_CHAMPIONS

### Community 166 - "regenerate-amara-v1377.sh"
Cohesion: 0.60
Nodes (4): check_refs(), INAYA, run(), regenerate-amara-v1377.sh script

### Community 167 - "regenerate-outfits-v1371.sh"
Cohesion: 0.60
Nodes (4): build_one(), ONLY, regenerate-outfits-v1371.sh script, verify_references()

### Community 168 - "timeline.test.ts"
Cohesion: 0.22
Nodes (6): cfg, run(), TimelineConfig, TimelineEvent, TimelineItem, TimelineSeed

### Community 170 - "generateStriking"
Cohesion: 0.29
Nodes (7): allowed(), generateStriking(), gQuality(), makeCtx(), rngFrom(), validateIssues(), weightedPick()

### Community 171 - "Privacy.tsx"
Cohesion: 0.38
Nodes (3): PUBLISHER_EMAIL, Privacy, Privacy()

### Community 172 - "Toast.tsx"
Cohesion: 0.70
Nodes (4): Toaster(), ToastItem(), ToastState, useToasts

### Community 173 - "soak-3d.mjs"
Cohesion: 0.50
Nodes (3): [BASE = 'http://localhost:4190', SECS = '180', PATH = '/', COACH = 'homme'], log, t0

### Community 175 - "main"
Cohesion: 0.83
Nodes (4): main(), read(), view(), write()

### Community 176 - "side"
Cohesion: 0.67
Nodes (3): lastSide(), opposite(), side()

## Knowledge Gaps
- **3 isolated node(s):** `INAYA`, `ONLY`, `EXPECTED`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 2323 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `vitest` to `outfit-amara-v1374.test.ts`, `CoachSelect.tsx`, `store/catalog.ts`, `domain/search.ts`, `domain/types.ts`, `Discipline.tsx`, `amara-finish-v1380.test.ts`, `DisciplineId`, `rig.ts`, `dna.ts`, `react`, `instructions.ts`, `pulse.ts`, `engine/motion.ts`, `profile.ts`, `engine/registry.ts`, `AppIcon`, `photoMaterials.ts`, `Training.tsx`, `behavior.ts`, `nlu.ts`, `sync/engine.ts`, `atmosphere.ts`, `morphology-v220.test.ts`, `nav/config.ts`, `library/index.ts`, `outfit-v032.test.ts`, `suggest.ts`, `encyclopedia.test.ts`, `torsions.ts`, `face.ts`, `normalize.ts`, `disciplines.test.ts`, `timeline.test.ts`, `ArBridge`, `Privacy.tsx`, `layers.ts`, `Library.tsx`, `settings.ts`, `Settings.tsx`, `outfit.ts`, `CoachStage.tsx`, `PremiumPage.tsx`, `rooms.ts`, `preload.ts`, `domain/resume.ts`, `audit.ts`, `three`, `package.json`, `FaceAnimator`, `biomech.test.ts`, `NavSheets.tsx`, `SignIn.tsx`, `cache-modeles-v236.test.ts`, `micro-life.test.ts`, `disciplines.tsx`, `releases.ts`, `projectFacts.ts`, `appGuide.test.ts`, `BottomBar.tsx`, `Encyclopedia.tsx`, `session.test.ts`, `bmi.ts`, `getMotion`, `disciplineArt.ts`, `images.ts`, `catalog.test.ts`, `PhotoSheet.tsx`, `theme.ts`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **What connects `INAYA`, `ONLY`, `EXPECTED` to the rest of the system?**
  _3 weakly-connected nodes found - possible missing edges._
- **Should `engine/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06594071385359952 - nodes in this community are weakly interconnected._
- **Why does `@playwright/test` connect `@playwright/test` to `vite`, `vitest`, `retour-createur.spec.ts`, `package.json`, `nav-helpers.ts`, `chrono-seul.spec.ts`, `maj-modeles-v236.spec.ts`, `soak-3d.mjs`, `consignes-v130.spec.ts`, `v230/captures.mjs`, `training-layout.spec.ts`, `theme.spec.ts`, `generate.mjs`, `defaultLook`, `coach-panel-size.spec.ts`, `DEFAULT_PROFILE`, `v250/captures.mjs`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Should `edit` be split into smaller, more focused modules?**
  _Cohesion score 0.06824904408051367 - nodes in this community are weakly interconnected._
- **Why does `DisciplineId` connect `DisciplineId` to `vitest`, `CoachSelect.tsx`, `store/catalog.ts`, `domain/types.ts`, `Discipline.tsx`, `amara-finish-v1380.test.ts`, `react`, `profile.ts`, `engine/registry.ts`, `coach/engine.ts`, `AppIcon`, `Training.tsx`, `Champions.tsx`, `atmosphere.ts`, `library/index.ts`, `suggest.ts`, `disciplines.test.ts`, `normalize.ts`, `encyclopedia/index.ts`, `Library.tsx`, `outfit.ts`, `CoachStage.tsx`, `rooms.ts`, `preload.ts`, `Profile.tsx`, `domain/resume.ts`, `audit.ts`, `three`, `biomech.test.ts`, `disciplines.tsx`, `projectFacts.ts`, `catalog/types.ts`, `Encyclopedia.tsx`, `disciplineArt.ts`, `knowledge.ts`, `validate.ts`, `catalog.test.ts`, `ChronoScreen.tsx`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Should `vitest` be split into smaller, more focused modules?**
  _Cohesion score 0.024672859854160425 - nodes in this community are weakly interconnected._