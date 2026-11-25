# Graph Report - combat-shadow-studio  (2026-11-25)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 6124 nodes · 17751 edges · 190 communities (164 shown, 26 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 611 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4ba4ccde`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 48
- Community 49
- Community 50
- Community 51
- Community 52
- Community 53
- Community 54
- Community 55
- Community 56
- Community 57
- Community 58
- Community 59
- Community 60
- Community 61
- Community 62
- Community 63
- Community 64
- Community 65
- Community 66
- Community 67
- Community 68
- Community 69
- Community 70
- Community 71
- Community 72
- Community 73
- Community 74
- Community 75
- Community 76
- Community 77
- Community 78
- Community 79
- Community 80
- Community 81
- Community 82
- Community 83
- Community 84
- Community 85
- Community 86
- Community 87
- Community 88
- Community 89
- Community 90
- Community 91
- Community 92
- Community 93
- Community 94
- Community 95
- Community 96
- Community 97
- Community 98
- Community 99
- Community 100
- Community 101
- Community 102
- Community 103
- Community 104
- Community 105
- Community 106
- Community 107
- Community 108
- Community 109
- Community 110
- Community 111
- Community 112
- Community 113
- Community 114
- Community 115
- Community 116
- Community 117
- Community 118
- Community 119
- Community 120
- Community 121
- Community 122
- Community 123
- Community 124
- Community 125
- Community 126
- Community 127
- Community 128
- Community 129
- Community 130
- Community 131
- Community 132
- Community 133
- Community 134
- Community 135
- Community 136
- Community 137
- Community 138
- Community 139
- Community 140
- Community 141
- Community 142
- Community 143
- Community 144
- Community 145
- Community 146
- Community 147
- Community 148
- Community 149
- Community 150
- Community 151
- Community 152
- Community 153
- Community 154
- Community 155
- Community 156
- Community 157
- Community 158
- Community 159
- Community 160
- Community 161
- Community 162
- Community 163
- Community 164
- Community 165
- Community 166
- Community 167
- Community 168
- Community 169
- Community 170
- Community 171
- Community 172
- Community 175
- Community 176
- Community 177
- Community 180
- Community 181
- Community 182
- Community 183
- Community 184
- Community 185
- Community 186
- Community 187

## God Nodes (most connected - your core abstractions)
1. `vitest` - 159 edges
2. `AppIcon()` - 134 edges
3. `DisciplineId` - 113 edges
4. `@playwright/test` - 110 edges
5. `CoachRig` - 109 edges
6. `react` - 99 edges
7. `three` - 96 edges
8. `edit()` - 95 edges
9. `deg()` - 92 edges
10. `v3()` - 83 edges

## Surprising Connections (you probably didn't know these)
- `seed()` --calls--> `defaultLook()`  [EXTRACTED]
  tests/e2e/discipline-art.spec.ts → src/editor/look.ts
- `save()` --indirect_call--> `mf()`  [INFERRED]
  scripts/v230/captures.mjs → src/engine/pose.ts
- `seed()` --calls--> `defaultLook()`  [EXTRACTED]
  tests/e2e/training-layout.spec.ts → src/editor/look.ts
- `seed()` --calls--> `defaultLook()`  [EXTRACTED]
  tests/e2e/coach-suggest.spec.ts → src/editor/look.ts
- `Seed` --calls--> `defaultLook()`  [EXTRACTED]
  tests/e2e/progress-seed.ts → src/editor/look.ts

## Import Cycles
- 2-file cycle: `src/engine/phases.ts -> src/engine/study.ts -> src/engine/phases.ts`
- 2-file cycle: `src/three/face.ts -> src/three/human/capabilities.ts -> src/three/face.ts`
- 2-file cycle: `src/ui/nav/NavSheets.tsx -> src/ui/nav/SearchSheet.tsx -> src/ui/nav/NavSheets.tsx`

## Communities (190 total, 26 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.03
Nodes (122): AnimationStatus, TechniqueCategory, auditTechnique(), auditTransitions(), balanceAt(), BalanceSample, CONTACTS, FLOOR_BONES (+114 more)

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (106): add(), Author, driveToward(), edit(), angleOut(), blockBody(), blockHigh(), boxingMotions() (+98 more)

### Community 2 - "Community 2"
Cohesion: 0.03
Nodes (82): COACH_STANCES, fields, skeletonFile(), STYLE, StanceStyle, balanceKeys(), centreOfMass(), move() (+74 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (100): buildProgram(), buildSessions(), CATALOGUE_GAPS, disciplineDefaults(), FOCUS, LEVEL_LOAD, levelPrerequisites(), MAT_EQUIP (+92 more)

### Community 4 - "Community 4"
Cohesion: 0.05
Nodes (93): sequenceView(), importCatalog(), ImportResult, MAX_IMPORT, buildCatalog(), CATALOG_URL, EMPTY_IMPORT, ImportedData (+85 more)

### Community 5 - "Community 5"
Cohesion: 0.04
Nodes (66): FluidityMeasure, POINTS, AnkleAngles, ankleAngles(), relative(), sideName(), ANKLE_LIMIT, ankleAngles() (+58 more)

### Community 6 - "Community 6"
Cohesion: 0.05
Nodes (78): When, CatalogPlanOptions, LEVEL_SPEED, BJJ, BOXE, build(), describe(), EXERCISE_BY_ID (+70 more)

### Community 7 - "Community 7"
Cohesion: 0.07
Nodes (71): zustand, HANDLED, SyncPrefsState, analyseCombo(), ANALYSIS_VERSION, AnalysisState, analysisState(), clamp() (+63 more)

### Community 8 - "Community 8"
Cohesion: 0.03
Nodes (71): all, BASE, BASE_1110, COACHES, headY(), headYCache, Metric, NEW_1110 (+63 more)

### Community 9 - "Community 9"
Cohesion: 0.07
Nodes (83): KbStyleChoice, Bucket, bucketDays(), buckets(), byExercise(), byKind(), byLevel(), compare() (+75 more)

### Community 10 - "Community 10"
Cohesion: 0.04
Nodes (19): main(), validate(), mask(), load(), sample(), blur(), color_stats(), main() (+11 more)

### Community 11 - "Community 11"
Cohesion: 0.07
Nodes (74): ALL_COACHES, ChampionCoach, filterExercises(), canOpenCoach(), isPremiumCoach(), ITEM_RIGHT, shouldShowPremiumMarker(), useRights() (+66 more)

### Community 12 - "Community 12"
Cohesion: 0.07
Nodes (56): react, filterTechniques(), MasteryCount, masteryCount(), PERIOD_PRESETS, techniquesFor(), useProgressView, formatDuration() (+48 more)

### Community 13 - "Community 13"
Cohesion: 0.03
Nodes (18): load(), vnorm(), rest_snapshot(), rest_snapshot(), yaw(), components(), f(), fill() (+10 more)

### Community 14 - "Community 14"
Cohesion: 0.06
Nodes (40): ac(), beep(), bell(), impact(), restSignal(), tone(), unlockAudio(), CHRONO_FORMAT_BY_ID (+32 more)

### Community 15 - "Community 15"
Cohesion: 0.05
Nodes (60): ChestFrameFn, clone(), lagHand(), StanceDef, STANCES, vec(), withOffsets(), _arcA (+52 more)

### Community 16 - "Community 16"
Cohesion: 0.07
Nodes (60): idb-keyval, b64(), cache, cryptoAvailable(), deleteKey(), getKey(), isSealed(), keyStore() (+52 more)

### Community 17 - "Community 17"
Cohesion: 0.06
Nodes (58): DisciplineEmblem(), Props, OUTLINE_DRAWINGS, defaultVariant(), DETAILED_FILES, EMBLEM_SIZES, EmblemEntry, emblemFile() (+50 more)

### Community 18 - "Community 18"
Cohesion: 0.11
Nodes (65): guideEntry(), answerEntry(), answerTechnique(), appHelp(), article(), askCoach(), balance(), cantSee() (+57 more)

### Community 19 - "Community 19"
Cohesion: 0.07
Nodes (44): island_mask(), pad(), save(), victor_body(), delight(), nb(), sat(), components() (+36 more)

### Community 20 - "Community 20"
Cohesion: 0.07
Nodes (41): three, vitest, clamp(), MotionSmoother, FACE_RENDER, FaceRenderUniforms, isHeadSkin(), newFaceRenderUniforms() (+33 more)

### Community 21 - "Community 21"
Cohesion: 0.06
Nodes (53): BY_CATEGORY, BY_TECHNIQUE, CAMERA_MODES, CameraMode, CameraView, FULL, MANUAL, manualView() (+45 more)

### Community 22 - "Community 22"
Cohesion: 0.06
Nodes (28): main(), smooth(), build(), joint_index(), sculpt(), smooth(), welded_normals(), Glb (+20 more)

### Community 23 - "Community 23"
Cohesion: 0.05
Nodes (59): APP_GUIDE, APP_NOUNS, DEICTIC, ENTRY_BY_ID, GuideEntry, GuideMatch, HOW, isAppQuestion() (+51 more)

### Community 24 - "Community 24"
Cohesion: 0.07
Nodes (60): AXIS_OF, comboDna(), Dna, DNA_AXES, DnaAxis, DnaAxisDef, DnaAxisId, dnaSummary() (+52 more)

### Community 25 - "Community 25"
Cohesion: 0.07
Nodes (35): catalogDef, CollectionDef, customDef, fightersDef, goalsDef, LOCAL_ONLY_PROFILE_FIELDS, profileDef, statsDef (+27 more)

### Community 26 - "Community 26"
Cohesion: 0.07
Nodes (59): AnimalId, ANIMALS, applyOverride(), ATMOSPHERE_OVERRIDES, AtmosphereInput, AtmosphereOverride, atmosphereSignature(), AtmosphereSourceField (+51 more)

### Community 27 - "Community 27"
Cohesion: 0.06
Nodes (45): ankle_supports(), centre(), keep(), axis_point(), keep(), bunch(), drape(), fold_weights() (+37 more)

### Community 28 - "Community 28"
Cohesion: 0.03
Nodes (56): ALL_CHAMPIONS, ANGLES, ARCH, ARCH_TIP, B_GROUND, BASE_W, BASE_WEIGHTS, body (+48 more)

### Community 29 - "Community 29"
Cohesion: 0.08
Nodes (52): hasUnseenRelease(), releaseDateLabel(), BottomBar(), haptic(), NO_KEBAB, openMenu(), openSearch(), BACK (+44 more)

### Community 30 - "Community 30"
Cohesion: 0.04
Nodes (41): out, combos, DOCS, F, file, orgs, OUT, ROOT (+33 more)

### Community 31 - "Community 31"
Cohesion: 0.07
Nodes (27): anatomy_masks(), git_blob(), glb_read(), glb_read_bytes(), main(), patch_binary(), repair_color(), skin_image() (+19 more)

### Community 32 - "Community 32"
Cohesion: 0.04
Nodes (24): @playwright/test, [BASE = 'http://localhost:4190', CRASHES = '1', COACH = 'homme'], t0, CASES, [OUT, BASE = 'http://localhost:5173', PATH = '/#/'], [OUT, PORT], [OUT, PORT], [OUT, PORT] (+16 more)

### Community 33 - "Community 33"
Cohesion: 0.07
Nodes (51): CoachScreen, CoachContext, family(), APP_ANYWHERE, BY_CATEGORY, BY_TECHNIQUE, FAQ_PHRASES, FAQ_RANK (+43 more)

### Community 34 - "Community 34"
Cohesion: 0.05
Nodes (42): expressionWeights(), FACE_BASES, FACE_EXPRESSIONS, FACE_GAIN, FaceBaseId, FaceExpression, FaceIdle, FaceOptions (+34 more)

### Community 35 - "Community 35"
Cohesion: 0.06
Nodes (48): variants, Side, BODIES, DOC, f1(), fails(), HOOKS, markdown() (+40 more)

### Community 36 - "Community 36"
Cohesion: 0.13
Nodes (35): box(), _casque(), curve_obj(), cyl(), _digit_text(), frame(), ground(), hexrgb() (+27 more)

### Community 37 - "Community 37"
Cohesion: 0.07
Nodes (45): look(), BeardStyle, BottomType, defaultLook(), FeetGearType, HairStyle, HandsType, HeadType (+37 more)

### Community 38 - "Community 38"
Cohesion: 0.06
Nodes (39): REST_SKIN, bakeAmaraCleanSurface(), applyBreath(), Breath, BreathUniforms, dropStillMorphs(), shareFaceRender(), applyWrinkles() (+31 more)

### Community 39 - "Community 39"
Cohesion: 0.10
Nodes (31): @axe-core/playwright, session, HUB_TILE, PLACE, place(), PLACE_URL, KB, OLD (+23 more)

### Community 40 - "Community 40"
Cohesion: 0.07
Nodes (40): FAMILY_BY_ID, AzEntry, azIndex(), BY_TECHNIQUE, DISCIPLINE_WORDS, familyLabel, findTerms(), INDEX (+32 more)

### Community 41 - "Community 41"
Cohesion: 0.08
Nodes (48): setEffectsVolume(), setVoiceVolume(), ActivityDetail, App(), AudioSync(), ChampionPage, Champions, ChronoScreen (+40 more)

### Community 42 - "Community 42"
Cohesion: 0.08
Nodes (31): ArBridge, ArState, ArView, ArSupport, detectAr(), hasFrenchVoice(), pickVoice(), say() (+23 more)

### Community 43 - "Community 43"
Cohesion: 0.08
Nodes (37): onBackButton(), CoachContext, CoachScreen(), CoachUi, FsApi, NO_REF, useCoachUi(), createDoubleTap() (+29 more)

### Community 44 - "Community 44"
Cohesion: 0.04
Nodes (28): diagnostics, outfits, poses, files, [OUT, PORT, champ, d, tenue, look, label], VIEWS, [OUT, techs, extra = '', n = '7', angles = '0,35,90'], files (+20 more)

### Community 45 - "Community 45"
Cohesion: 0.10
Nodes (25): at, area(), bjj(), boxe(), glow(), heavy_bag(), hexrgb(), industrial_lamp() (+17 more)

### Community 46 - "Community 46"
Cohesion: 0.09
Nodes (29): assign(), bezier(), boxing_glove(), _bsdf(), build_bjj(), build_boxe(), build_judo(), build_kickboxing() (+21 more)

### Community 47 - "Community 47"
Cohesion: 0.11
Nodes (39): react-router-dom, termForPartner(), termForTechnique(), exerciseForTechnique(), AnimationBadge(), ModeBadge(), PlaybackControls(), GuideCard() (+31 more)

### Community 48 - "Community 48"
Cohesion: 0.08
Nodes (37): cleanSetup(), CUE_LABEL, CueId, DEFAULT_SETTINGS, dropRetired(), GROUND_MARK_LABEL, GroundMarkId, RETIRED (+29 more)

### Community 49 - "Community 49"
Cohesion: 0.08
Nodes (23): _ao_dirs(), bake_ao(), blur(), cotton(), elastic(), export(), fabric(), file_key() (+15 more)

### Community 50 - "Community 50"
Cohesion: 0.05
Nodes (42): concurrency, cancel-in-progress, group, name, url, rebuild, jobs, rebuild-amara (+34 more)

### Community 51 - "Community 51"
Cohesion: 0.11
Nodes (27): clearDiag(), DiagEntry, DiagKind, diagText(), INCIDENT_KINDS, incidentCount(), log3d(), readDiag() (+19 more)

### Community 52 - "Community 52"
Cohesion: 0.08
Nodes (32): applyMorphology(), Band, displace(), limbShare(), Morphology, MORPHOLOGY_V220, morphologyFor(), off() (+24 more)

### Community 53 - "Community 53"
Cohesion: 0.12
Nodes (29): @react-three/fiber, championById(), championFor(), championLook(), championModel(), CHAMPIONS, championStance(), EXTRA_COACHES (+21 more)

### Community 54 - "Community 54"
Cohesion: 0.09
Nodes (30): Entitlement, ENTITLEMENT_BY_ID, EntitlementId, ENTITLEMENTS, Implementation, PREMIUM_BENEFITS, PREMIUM_CATEGORIES, PREMIUM_COMING_SOON (+22 more)

### Community 55 - "Community 55"
Cohesion: 0.11
Nodes (30): LIFE, RoomLife, stutterAt(), swayOf(), sweepAt(), V3, decodeDepth(), DEPTH_MAX (+22 more)

### Community 56 - "Community 56"
Cohesion: 0.07
Nodes (16): rbf(), vnorm(), project(), sample(), tps(), f(), U(), uv_raster() (+8 more)

### Community 57 - "Community 57"
Cohesion: 0.10
Nodes (29): BootGate(), BootScreen(), loaded, useHydrated(), usePlan(), BootItem, bootMessage(), bootPlan() (+21 more)

### Community 58 - "Community 58"
Cohesion: 0.05
Nodes (37): concurrency, cancel-in-progress, group, KEY_ALIAS, KEY_PASS, KS_B64, KS_PASS, SIGNED (+29 more)

### Community 59 - "Community 59"
Cohesion: 0.14
Nodes (34): emailLooksValid(), passwordProblem(), passwordStrength(), buildFullExport(), reauthenticate(), sendPasswordReset(), signInGoogle(), useAccount (+26 more)

### Community 60 - "Community 60"
Cohesion: 0.09
Nodes (30): ageDays(), isNum(), isStr(), matchesPlan(), MODES, PHASES, pickCard(), PlanBlockLike (+22 more)

### Community 61 - "Community 61"
Cohesion: 0.07
Nodes (12): DEFAULT_PROFILE, audit(), measureRendered(), SCREENS, Dress, dress(), shownDressed(), open() (+4 more)

### Community 62 - "Community 62"
Cohesion: 0.09
Nodes (19): belt(), bow_tie(), boxing_glove(), collar(), curve(), ellipsoid(), neck_ring(), neck_tie() (+11 more)

### Community 63 - "Community 63"
Cohesion: 0.08
Nodes (17): boxing_glove_v2(), bra_low(), bra_v2(), brand_logos(), bridge_cleavage(), female_top(), _flat_mat(), hide_hands() (+9 more)

### Community 64 - "Community 64"
Cohesion: 0.11
Nodes (31): DEFAULT_CATALOG_USER, COACH_HISTORY_MAX, COACH_SEEN_MAX, CoachAiSettings, CoachAiState, CoachExchange, DEFAULT_COACH_AI, useCoachAi (+23 more)

### Community 65 - "Community 65"
Cohesion: 0.09
Nodes (20): agility_ladder(), belt_board(), board_png(), clock_png(), cloth(), cubbies(), enso_png(), flag_png() (+12 more)

### Community 66 - "Community 66"
Cohesion: 0.26
Nodes (31): armbar(), backControl(), behind(), closedGuard(), duo(), duoScenes(), Frame, guardPass() (+23 more)

### Community 67 - "Community 67"
Cohesion: 0.07
Nodes (20): COMP, Gltf, readGlb(), SIZE, SkinnedPart, key(), relief(), COACHES (+12 more)

### Community 68 - "Community 68"
Cohesion: 0.08
Nodes (31): config, devDependencies, @axe-core/playwright@^4.14.0, @capacitor/cli@^8.5.3, fake-indexeddb@^6.2.6, @gltf-transform/functions@^4.5.1, jsdom@^30.1.3, meshoptimizer@^1.3.0 (+23 more)

### Community 69 - "Community 69"
Cohesion: 0.06
Nodes (33): concurrency, cancel-in-progress, group, environment, if, runs-on, steps, VITE_FIREBASE_API_KEY (+25 more)

### Community 70 - "Community 70"
Cohesion: 0.16
Nodes (32): AuthCapabilities, scopeForUid(), wipeScope(), AccountState, adopt(), chain, changeEmail(), changePassword() (+24 more)

### Community 71 - "Community 71"
Cohesion: 0.07
Nodes (10): FaceAnimator, Mood, Exertion, COACHES, FaceWrinkles, WRINKLE_LOOK, WRINKLES_ON_COACHES, wrinkleStrength() (+2 more)

### Community 72 - "Community 72"
Cohesion: 0.10
Nodes (23): animationStatusOf(), STATUS, STATUS_HELP, STATUS_LABEL, SHEET_BY_ID, SHEETS, PILOT_SHEETS, SOURCES (+15 more)

### Community 73 - "Community 73"
Cohesion: 0.12
Nodes (26): benefitAvailable(), formatPrice(), PREMIUM_OFFER, purchaseAvailable(), RestoreResult, MenuChipOption, navIconPaths(), NavIcon() (+18 more)

### Community 74 - "Community 74"
Cohesion: 0.15
Nodes (21): firebase, AUTH_EMULATOR, FIREBASE_ENABLED, firebaseConfig(), FirebaseWebConfig, FIRESTORE_EMULATOR, createFirebaseProvider(), firebaseApp() (+13 more)

### Community 76 - "Community 76"
Cohesion: 0.07
Nodes (9): IDS, NAMES, Cam, startJab(), SCREENS, closeCoachPanel(), showCoachTools(), tileNames() (+1 more)

### Community 77 - "Community 77"
Cohesion: 0.06
Nodes (24): bun, bunMat, bunMesh, bunNode, bunTex, done, grid, headIdx (+16 more)

### Community 78 - "Community 78"
Cohesion: 0.09
Nodes (16): FACE_BASE_DEFAULT, DRIFT, EVENT_SHAPE, MICRO_EVENTS, MicroChannel, MicroEvent, MicroInput, MicroLife (+8 more)

### Community 79 - "Community 79"
Cohesion: 0.07
Nodes (29): runs-on, steps, timeout-minutes, concurrency, cancel-in-progress, group, GH_TOKEN, jobs (+21 more)

### Community 80 - "Community 80"
Cohesion: 0.11
Nodes (22): CoachAction, SpeechInput, COACH_PANEL_SIZES, CoachPanelSize, COACH_HISTORY_ROUTE, CoachAskPanel(), CoachAskPanelProps, CoachBubble() (+14 more)

### Community 81 - "Community 81"
Cohesion: 0.08
Nodes (9): DISCIPLINES, IDS, seedProfile(), openChronoOptions(), sheet(), combo, PNG, startSession() (+1 more)

### Community 82 - "Community 82"
Cohesion: 0.07
Nodes (28): concurrency, cancel-in-progress, group, jobs, render-ab, name, on, push (+20 more)

### Community 83 - "Community 83"
Cohesion: 0.09
Nodes (18): test, PUBLISHER_EMAIL, Draft, LATEST_RELEASE, ORDER, Release, RELEASE_CATEGORY_LABEL, ReleaseCategory (+10 more)

### Community 84 - "Community 84"
Cohesion: 0.11
Nodes (23): androidVersion(), begin(), ComboCatalogFile, DisciplineFacts, end(), etatBlock(), FactsInput, frDate() (+15 more)

### Community 85 - "Community 85"
Cohesion: 0.13
Nodes (26): BONES, rigs, worstNdc(), cameraBasis(), centerOnSpheres(), corner, fitDistance(), fitSpheres() (+18 more)

### Community 86 - "Community 86"
Cohesion: 0.07
Nodes (23): args, BADGES, c, CHAMPION, DISC, FORCE, IDS, JOBS (+15 more)

### Community 87 - "Community 87"
Cohesion: 0.12
Nodes (16): chain(), _garment(), long_axis(), origin_to_geometry(), outfit(), pair(), rest_on_ground(), s_dojo() (+8 more)

### Community 88 - "Community 88"
Cohesion: 0.07
Nodes (27): dependencies, @capacitor/android@^8.5.3, @capacitor/app@^8.1.2, @capacitor-community/keep-awake@^8.0.1, @capacitor-community/text-to-speech@^8.0.2, @capacitor/core@^8.5.3, @capacitor/filesystem@^8.1.5, @capacitor/share@^8.0.3 (+19 more)

### Community 89 - "Community 89"
Cohesion: 0.09
Nodes (20): @gltf-transform/core@^4.5.1, @gltf-transform/extensions@^4.5.1, @gltf-transform/core, @gltf-transform/extensions, ibm, io, io, [mode, glb, dir, out] (+12 more)

### Community 90 - "Community 90"
Cohesion: 0.11
Nodes (20): battle_ropes(), bucket(), cones(), image_mat(), kettlebell(), mouthguard_box(), open_crate(), picture() (+12 more)

### Community 91 - "Community 91"
Cohesion: 0.15
Nodes (19): bench(), champion_belt(), corner_stool(), double_end_bag(), dummy(), focus_mitt(), gong(), headgear() (+11 more)

### Community 92 - "Community 92"
Cohesion: 0.13
Nodes (24): SOURCE_BY_ID, ALLOWED, BY_TECHNIQUE, CHECKS, FRONT_KICKS, inKbStyle(), KB_STYLES, kbOnlyIn() (+16 more)

### Community 93 - "Community 93"
Cohesion: 0.08
Nodes (25): jobs, matched-webgl, runs-on, steps, timeout-minutes, name, on, pull_request (+17 more)

### Community 94 - "Community 94"
Cohesion: 0.10
Nodes (15): bleed(), blur(), _box(), close(), fabric(), gacc(), halter_skin(), acc() (+7 more)

### Community 95 - "Community 95"
Cohesion: 0.16
Nodes (22): FAMILIES, subfamilyLabel(), imageOf(), coverage(), TERM_BY_ID, encyclopediaSource(), QueryChip(), DISC_NAME (+14 more)

### Community 96 - "Community 96"
Cohesion: 0.08
Nodes (24): runs-on, steps, timeout-minutes, jobs, amara-skin-checks, name, on, pull_request (+16 more)

### Community 97 - "Community 97"
Cohesion: 0.08
Nodes (18): vite@^8.3.4, vite, JOBS, [OUT, ...qs], PORT, queue, all, c (+10 more)

### Community 98 - "Community 98"
Cohesion: 0.09
Nodes (17): A, after, As, B, Bs, cb, ck(), COACHES (+9 more)

### Community 99 - "Community 99"
Cohesion: 0.09
Nodes (12): crotch_relax(), fitted_band(), cloth_weights(), skin_weights(), grad_fabric(), paint_grad(), painted_cloth_bottom(), painted_cloth_range() (+4 more)

### Community 100 - "Community 100"
Cohesion: 0.09
Nodes (22): jobs, webgl-preview, name, on, pull_request, workflow_dispatch, permissions, contents (+14 more)

### Community 101 - "Community 101"
Cohesion: 0.09
Nodes (22): jobs, premium-skin-webgl, name, on, pull_request, workflow_dispatch, permissions, contents (+14 more)

### Community 102 - "Community 102"
Cohesion: 0.09
Nodes (22): jobs, pilot-webgl, name, on, pull_request, workflow_dispatch, permissions, contents (+14 more)

### Community 103 - "Community 103"
Cohesion: 0.09
Nodes (15): boot, targets, [out = 'icons.png', w = '1400'], [base, out, prefix, champ='mma-kadir'], sets, V, screens, shots (+7 more)

### Community 104 - "Community 104"
Cohesion: 0.17
Nodes (17): CoachId, FighterLook, Fighter, FightersState, now(), syncProfile(), uid(), useFighters (+9 more)

### Community 105 - "Community 105"
Cohesion: 0.19
Nodes (20): BMI_ADULT_AGE, BMI_CATEGORIES, BMI_GAUGE, BMI_HEIGHT_CM, BMI_LIMITS, BMI_MINOR_NOTE, BMI_WEIGHT_KG, BmiCategory (+12 more)

### Community 106 - "Community 106"
Cohesion: 0.09
Nodes (21): runs-on, steps, timeout-minutes, jobs, diagnose-torso, name, on, push (+13 more)

### Community 107 - "Community 107"
Cohesion: 0.12
Nodes (13): CoachAnswer, groundingPassages(), acceptLlmOutput(), askCoachAsync(), FORBIDDEN, GroundingPassage, LlmEngine, LlmRequest (+5 more)

### Community 108 - "Community 108"
Cohesion: 0.13
Nodes (16): bra_field(), arm_clear(), armw(), field(), strap(), surf(), top_of(), paint_mma_compression() (+8 more)

### Community 109 - "Community 109"
Cohesion: 0.15
Nodes (19): apply(), applyDir(), args, fade(), folder(), GAIN, invert(), local() (+11 more)

### Community 110 - "Community 110"
Cohesion: 0.10
Nodes (20): runs-on, steps, timeout-minutes, jobs, diagnose, name, on, push (+12 more)

### Community 111 - "Community 111"
Cohesion: 0.13
Nodes (16): ART_PENDING, ArtSource, DISCIPLINE_ART, DisciplineArt, disciplineArt(), OWN, root, walk() (+8 more)

### Community 112 - "Community 112"
Cohesion: 0.11
Nodes (9): apply(), drape_pass(), iso_cut(), knee_pads(), keep(), shell(), shoes(), keep() (+1 more)

### Community 113 - "Community 113"
Cohesion: 0.19
Nodes (20): allowed(), analyse(), cat(), distanceOf(), estimate(), generateStriking(), gQuality(), isBody() (+12 more)

### Community 114 - "Community 114"
Cohesion: 0.15
Nodes (17): MORE_FAQ, ALL_D, ALL_L, CATEGORY_NUANCE, ENTRY_BY_ID(), Faq, FAQ, KICK_D (+9 more)

### Community 115 - "Community 115"
Cohesion: 0.11
Nodes (18): runs-on, steps, timeout-minutes, jobs, amara-finish, name, on, pull_request (+10 more)

### Community 116 - "Community 116"
Cohesion: 0.12
Nodes (10): belt_roll(), bend(), s_ceintures(), _twist(), belt_strip(), braid(), curve(), mesh_from_grid() (+2 more)

### Community 117 - "Community 117"
Cohesion: 0.19
Nodes (15): BehaviorTraits, DEFAULT_TRAITS, cleanBoneName(), cleanMorphName(), FaceCapabilities, faceCapabilities(), FaceLevel, glbNames() (+7 more)

### Community 118 - "Community 118"
Cohesion: 0.12
Nodes (18): MenuEntry, NavSlot, Tab, NavIconId, ActionView, CommandView, find(), Live (+10 more)

### Community 119 - "Community 119"
Cohesion: 0.11
Nodes (13): done, grid, ib, ibm, io, joints, meshNode, raw (+5 more)

### Community 120 - "Community 120"
Cohesion: 0.12
Nodes (12): add(), ALIASES, BASE, BY_ID, IMAGES, RenderRecipe, RENDERS, SceneRecipe (+4 more)

### Community 122 - "Community 122"
Cohesion: 0.11
Nodes (17): compilerOptions, isolatedModules, jsx, lib, module, moduleResolution, noEmit, noFallthroughCasesInSwitch (+9 more)

### Community 123 - "Community 123"
Cohesion: 0.12
Nodes (5): at(), load(), raster(), save(), twins()

### Community 124 - "Community 124"
Cohesion: 0.22
Nodes (13): react-dom, boot(), isLab, addPreviewFreeProgram(), setRestrictionsSimulated(), setRightsSource(), addMixedExample(), applySimulation() (+5 more)

### Community 125 - "Community 125"
Cohesion: 0.25
Nodes (12): Crop, cropRect(), decodePhoto(), DEFAULT_CROP, PHOTO_MAX_BYTES, PHOTO_SIZE, PHOTO_TYPES, photoProblem() (+4 more)

### Community 126 - "Community 126"
Cohesion: 0.20
Nodes (13): isTraining(), ThemeColor(), ids, uiFiles(), MENU_ENTRIES, applyTheme(), mq(), onSystemThemeChange() (+5 more)

### Community 127 - "Community 127"
Cohesion: 0.26
Nodes (8): blur(), blur3(), compose(), draw_marks(), main(), room(), subject_box(), value_noise()

### Community 128 - "Community 128"
Cohesion: 0.27
Nodes (7): back_ridge(), chest_coverage(), fitted_bands(), load(), main(), mesh(), mma_shorts()

### Community 129 - "Community 129"
Cohesion: 0.17
Nodes (12): scripts, android:aab, android:apk-test, android:open, build, build:android, dev, docs:sync (+4 more)

### Community 130 - "Community 130"
Cohesion: 0.17
Nodes (4): INAYA_GIT_SHA, OUTFITS, references, GOOD_1370

### Community 131 - "Community 131"
Cohesion: 0.27
Nodes (6): _box(), compose(), depth_png(), gblur(), hexrgb(), main()

### Community 132 - "Community 132"
Cohesion: 0.26
Nodes (10): TERMS, discShort(), entries(), Entry, PLACES, score(), SEARCH_GROUPS, searchApp() (+2 more)

### Community 133 - "Community 133"
Cohesion: 0.38
Nodes (10): canBlur(), overlayHost(), scrimHandlers(), SheetDismiss, useBackLayer(), useGlassLite(), useSheetDismiss(), useSwipeDown() (+2 more)

### Community 134 - "Community 134"
Cohesion: 0.26
Nodes (7): landmarks(), main(), sigma(), ref_profile(), slice_profile(), smooth(), vertex_normals()

### Community 135 - "Community 135"
Cohesion: 0.22
Nodes (10): @react-three/drei@^10.7.9, @react-three/drei, BodyFocus, arc(), END_BONE, FOCUS, head(), JOINTS (+2 more)

### Community 136 - "Community 136"
Cohesion: 0.18
Nodes (7): boxing_glove(), freestanding_bag(), glove_pair(), kick_shield(), kick_target_stand(), tilt(), vinyl()

### Community 137 - "Community 137"
Cohesion: 0.20
Nodes (8): cord(), foam_roller(), hanging_loop(), jump_ropes(), medicine_ball(), resistance_bands(), rubber(), uchikomi_bands()

### Community 138 - "Community 138"
Cohesion: 0.22
Nodes (3): Glb, add(), copy_view()

### Community 140 - "Community 140"
Cohesion: 0.24
Nodes (6): applySway(), Entry, swingKind(), tmpM, tmpN, tmpV

### Community 141 - "Community 141"
Cohesion: 0.31
Nodes (8): Listener, listeners, onPulse(), pulse(), PULSE_MIN_GAP_MS, PulseKind, resetPulse(), usePulseFlash()

### Community 142 - "Community 142"
Cohesion: 0.33
Nodes (8): anatomy(), auditFile(), coaches, hullPerimeter(), invert(), io, mat4MulVec(), out

### Community 143 - "Community 143"
Cohesion: 0.22
Nodes (8): AZ, DISC, errors, manifest, [OUT = 'docs/v230/captures/raw', coachArg = 'mma-kadir,mma-amara,nael,victor,inaya,kanya', techArg], PHASES, save(), TECHS

### Community 144 - "Community 144"
Cohesion: 0.33
Nodes (6): hydrated(), tick(), session, settle(), settle(), profileWrites()

### Community 145 - "Community 145"
Cohesion: 0.42
Nodes (8): acceleration(), checkLibrary(), checkMotion(), dist(), finite(), IntegrityLevel, MAX_GROUND_PENETRATION, xyz()

### Community 146 - "Community 146"
Cohesion: 0.25
Nodes (5): camera(), EXERCISES, seed(), SIZES, steady()

### Community 148 - "Community 148"
Cohesion: 0.25
Nodes (4): ONLY, SCREENS, STUDIO, theme()

### Community 149 - "Community 149"
Cohesion: 0.32
Nodes (4): hull_perimeter(), measure(), girth(), sl()

### Community 150 - "Community 150"
Cohesion: 0.25
Nodes (7): [avantDir, apresDir, outRoot = 'captures/v1564-reorganisation'], cases, COACHS, D, manifest, servers, STYLE

### Community 151 - "Community 151"
Cohesion: 0.32
Nodes (7): ArScene(), blobTexture(), ShadowPortal(), tmpM, tmpP, tmpQ, tmpS

### Community 152 - "Community 152"
Cohesion: 0.32
Nodes (4): rail(), scrollLeft(), seed(), swipe()

### Community 153 - "Community 153"
Cohesion: 0.29
Nodes (6): disc, entries, FAM, files, reg, uses

### Community 154 - "Community 154"
Cohesion: 0.38
Nodes (5): Button(), ButtonProps, cls(), LinkButton(), Variant

### Community 157 - "Community 157"
Cohesion: 0.33
Nodes (4): [BASE, OUT, coachArg, viewArg], log, SCALE, VIEWS

### Community 158 - "Community 158"
Cohesion: 0.33
Nodes (4): errors, manifest, [OUT = 'docs/v250/captures/raw', coachArg = 'mma-kadir,mma-amara,nael,victor,inaya,kanya', viewArg], SHOTS

### Community 160 - "Community 160"
Cohesion: 0.40
Nodes (4): COACHES, glb(), Gltf, maxWeight()

### Community 161 - "Community 161"
Cohesion: 0.53
Nodes (4): DISCIPLINE_COLOR, ON_DISCIPLINE, contrast(), lum()

### Community 162 - "Community 162"
Cohesion: 0.47
Nodes (3): coachShown(), journal(), kinds()

### Community 163 - "Community 163"
Cohesion: 0.47
Nodes (4): moves(), OLD, openEditor(), seed()

### Community 164 - "Community 164"
Cohesion: 0.50
Nodes (5): gEntry(), joinFr(), lc(), nameOf(), rle()

### Community 165 - "Community 165"
Cohesion: 0.40
Nodes (3): EXTRA_DISCIPLINES, INFO, NEW_CHAMPIONS

### Community 166 - "Community 166"
Cohesion: 0.60
Nodes (4): check_refs(), INAYA, run(), regenerate-amara-v1377.sh script

### Community 167 - "Community 167"
Cohesion: 0.60
Nodes (4): build_one(), ONLY, regenerate-outfits-v1371.sh script, verify_references()

### Community 171 - "Community 171"
Cohesion: 0.50
Nodes (3): [OUT = 'docs/v046-encyclopedie/captures'], PROFILE, VIEWS

### Community 175 - "Community 175"
Cohesion: 0.83
Nodes (4): main(), read(), view(), write()

### Community 176 - "Community 176"
Cohesion: 0.67
Nodes (3): lastSide(), opposite(), side()

## Knowledge Gaps
- **3 isolated node(s):** `INAYA`, `ONLY`, `EXPECTED`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 2318 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **26 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `Community 20` to `Community 0`, `Community 2`, `Community 3`, `Community 4`, `Community 132`, `Community 6`, `Community 7`, `Community 5`, `Community 9`, `Community 8`, `Community 130`, `Community 12`, `Community 140`, `Community 14`, `Community 141`, `Community 16`, `Community 144`, `Community 17`, `Community 18`, `Community 21`, `Community 23`, `Community 24`, `Community 25`, `Community 26`, `Community 156`, `Community 29`, `Community 30`, `Community 160`, `Community 33`, `Community 34`, `Community 35`, `Community 161`, `Community 37`, `Community 38`, `Community 168`, `Community 42`, `Community 43`, `Community 172`, `Community 47`, `Community 48`, `Community 51`, `Community 52`, `Community 53`, `Community 54`, `Community 55`, `Community 57`, `Community 60`, `Community 67`, `Community 68`, `Community 70`, `Community 71`, `Community 72`, `Community 74`, `Community 75`, `Community 78`, `Community 83`, `Community 84`, `Community 85`, `Community 92`, `Community 95`, `Community 104`, `Community 105`, `Community 107`, `Community 111`, `Community 117`, `Community 120`, `Community 125`, `Community 126`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **What connects `INAYA`, `ONLY`, `EXPECTED` to the rest of the system?**
  _3 weakly-connected nodes found - possible missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.027670775552131485 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Community 12` to `Community 0`, `Community 3`, `Community 4`, `Community 133`, `Community 6`, `Community 7`, `Community 135`, `Community 9`, `Community 11`, `Community 141`, `Community 14`, `Community 17`, `Community 21`, `Community 151`, `Community 24`, `Community 26`, `Community 154`, `Community 29`, `Community 33`, `Community 38`, `Community 41`, `Community 42`, `Community 43`, `Community 47`, `Community 48`, `Community 51`, `Community 52`, `Community 53`, `Community 54`, `Community 55`, `Community 57`, `Community 59`, `Community 60`, `Community 64`, `Community 68`, `Community 73`, `Community 80`, `Community 85`, `Community 88`, `Community 95`, `Community 111`, `Community 118`, `Community 124`, `Community 125`, `Community 126`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.08848893888263967 - nodes in this community are weakly interconnected._
- **Why does `DisciplineId` connect `Community 6` to `Community 0`, `Community 2`, `Community 3`, `Community 4`, `Community 7`, `Community 8`, `Community 9`, `Community 11`, `Community 12`, `Community 14`, `Community 16`, `Community 17`, `Community 18`, `Community 21`, `Community 24`, `Community 26`, `Community 33`, `Community 161`, `Community 37`, `Community 40`, `Community 47`, `Community 52`, `Community 53`, `Community 55`, `Community 57`, `Community 59`, `Community 60`, `Community 67`, `Community 72`, `Community 84`, `Community 85`, `Community 95`, `Community 111`, `Community 114`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.032714412024756855 - nodes in this community are weakly interconnected._