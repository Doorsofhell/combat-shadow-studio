# Coach IA — questions au coach pendant l’entraînement

État au 17/10/2026. Ce document décrit ce qui tourne **aujourd’hui** (une base locale de recherche, sans modèle de
langage) et l’étude des options embarquées (reconnaissance vocale hors ligne, LLM sur l’appareil). **Aucun LLM
embarqué ni aucun moteur de reconnaissance vocale hors ligne n’a été installé ni testé.**

## 1. Ce qui tourne maintenant (web et APK)

| Brique | Fichier | Rôle |
| --- | --- | --- |
| Base de connaissances | `src/coach/knowledge.ts` | 1 entrée par technique de `TECHNIQUES` (description, consignes, points clés, étapes et erreurs de `GUIDES`, note solo) + FAQ prudente écrite à la main (pivot du pied arrière, hanches, garde, menton, retour en garde, déplacements et angles, équilibre sur les coups de pied, respiration, jab / direct, crochet / uppercut, teep, genoux, coudes, sprawl, échauffement, repos, douleur, articulations en shadow, puissance et vitesse, hauteurs de kicks, shadow, débuter, garde gaucher, distance). Chaque entrée : `id`, `title`, `text` (+ `simple` débutant, `nuance` avancé), `tags`, `disciplines`, `levels`, `source` (id de technique ou `faq`), `related` (ids existants, vérifiés au chargement). |
| Compréhension | `src/coach/nlu.ts` | Normalisation (accents, casse, apostrophes), synonymes (cross = direct = droit arrière, middle = coup de pied circulaire au corps, hook = crochet…), noms / ids / appels des techniques, « cet exercice ». Liste de gestes **absents** de la bibliothèque (spinning back fist, superman punch, tornado kick, soumissions…) pour ne jamais les rapprocher d’une technique voisine. Intentions : `explain`, `why`, `improve`, `difference`, `demo`, `slow`, `repeat`, `suggest_combo`, `balance`, `smalltalk`, `cant_see` (« corrige-moi », « tu me vois ? »), `safety` (douleur), `off_topic` (y compris demandes dangereuses : bagarre, déshydratation…), `unknown_technique`, `unknown`. |
| Recherche | `src/coach/retrieval.ts` | BM25 sur la base (titre et étiquettes comptés double), racinisation légère, bonus technique citée ×2,2, technique liée ×1,5, technique à l’écran ×1,12, malus hors discipline ×0,7. |
| Moteur | `src/coach/engine.ts` | `askCoach(question, context) → { text, actions, sources, intent, confidence, engine: 'base-locale', techniqueId?, suggestions? }`. Réponses rédigées par gabarits à partir des seules entrées retrouvées, adaptées au niveau (débutant : étape par étape ; intermédiaire : points clés + erreur ; avancé : consignes + nuance ; expert : concis + tactique), à la longueur choisie, à la garde (inversion gauche / droite signalée en garde gaucher), à la discipline (technique hors discipline signalée) et au pseudo. Déterministe, synchrone, < 1 ms par question après la première (≈ 10 ms pour construire l’index). |
| Actions | `engine.ts` | `{type:'demo', techniqueId}`, `{type:'slow', techniqueId, speed:0.25}`, `{type:'repeat', techniqueId}`, `{type:'start-exercise', exerciseId}`, `{type:'start-combo', comboId}` — chaque action a un `label`. Les ids viennent toujours de `TECHNIQUES`, `EXERCISES` ou du catalogue chargé (filtré par discipline, niveau, garde). |
| LLM (interface) | `src/coach/llm.ts` | `LlmEngine`, `SYSTEM_PROMPT` strict, `askCoachAsync()` : la base locale répond d’abord ; un LLM éventuel ne ferait que reformuler à partir des passages retrouvés, sortie contrôlée (`acceptLlmOutput`), actions et sources inchangées. **Aucun moteur enregistré.** |
| Voix | `src/coach/speech.ts` | `SpeechInput`, `detectSpeechCapabilities()`, `getSpeechInput({allowOnline})`, `speakReply()`. |
| Réglages / historique | `src/store/coachAi.ts` | zustand + `idbStorage` : `enabled` (oui), `voiceReplies` (non), `detail` (`court`), `keepHistory` (non), `onlineSpeechOptIn` (non), `history` (100 max, effacé si l’historique est désactivé), `clearHistory`. |
| Interface | `src/ui/coach-ai/CoachAskPanel.tsx`, `src/ui/screens/CoachHistory.tsx` | Panneau clair compact pour l’entraînement ; écran sombre historique + réglages. |

### Garde-fous

- Le coach ne prétend jamais voir l’utilisateur : les demandes de correction reçoivent une réponse honnête (« je ne peux pas te voir ») et une liste de points à vérifier soi-même (miroir, vidéo) + la démo au ralenti.
- Technique inconnue → « ne fait pas partie de ma bibliothèque validée », sans explication inventée.
- Douleur, malaise → arrêter, consulter un professionnel de santé ; 15 / 112 en cas de douleur thoracique ou de malaise important. Aucun conseil médical.
- Question non comprise → « je n’ai pas trouvé de réponse fiable », avec des exemples de questions (mode de repli).
- Les combinaisons « inspirées » du catalogue sont présentées comme telles (« pas une séquence réellement exécutée en combat »).

## 2. Voix

### Synthèse (réponses lues)

`src/audio/voice.ts` choisit en priorité une voix fr-FR dont le nom contient « Google », « Amélie », « Thomas »…, **sans
regarder `localService`**. Dans Chrome de bureau, les voix « Google … » sont en général des voix réseau
(`localService: false`, donc le texte part sur un service distant). Pour les réponses du coach, `speakReply()` utilise
donc sa propre sélection : **uniquement une voix française avec `localService === true`** ; sans voix locale, la réponse
reste écrite. Sur Android, c’est le moteur TTS du système (plugin `@capacitor-community/text-to-speech`), qui utilise les
voix installées. Recommandation (fichier hors de mon périmètre) : faire préférer `localService` dans `pickVoice()` de
`voice.ts`. Définition de `localService` :
[MDN](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice/localService).

### Reconnaissance (questions à voix haute)

**Rien n’est actif par défaut, et aucun bouton micro n’apparaît** tant qu’aucun moteur n’est disponible.

- **Web Speech API (Chrome)** : « On some browsers, like Chrome, using Speech Recognition on a web page involves a
  server-based recognition engine. Your audio is sent to a web service for recognition processing, so it won't work
  offline. » ([MDN SpeechRecognition](https://developer.mozilla.org/docs/Web/API/SpeechRecognition)). Elle n’est donc
  proposée qu’en **option explicite**, désactivée par défaut, dans l’écran Coach IA : « Saisie vocale du navigateur (en
  ligne) — l’audio est envoyé au service de reconnaissance du navigateur ». Un badge « Micro en ligne » s’affiche alors
  dans le panneau. Une propriété expérimentale `processLocally` et les méthodes `available()` / `install()` existent pour
  la reconnaissance sur l’appareil ([MDN processLocally](https://developer.mozilla.org/docs/Web/API/SpeechRecognition/processLocally)),
  mais la prise en charge par navigateur n’est pas documentée sur ces pages : non utilisée, à réévaluer.
- La WebView Android n’expose pas cette API de façon fiable : dans l’APK, pas de micro aujourd’hui.

Options **réellement hors ligne** (non installées, non testées) :

| Option | Taille | Licence / coût | Remarques |
| --- | --- | --- | --- |
| Android `SpeechRecognizer` sur l’appareil, via plugin Capacitor | 0 Mo dans l’APK (pack de langue français du système, téléchargé par Android) | Plugin `@capgo/capacitor-speech-recognition` v8 (Capacitor 8) : MPL-2.0, gratuit ; `@capacitor-community/speech-recognition` : MIT mais sans option hors ligne documentée | API : `createOnDeviceSpeechRecognizer` et `isOnDeviceRecognitionAvailable` (API 31, Android 12), `checkRecognitionSupport` et `triggerModelDownload` (API 33) ; `RecognizerIntent.EXTRA_PREFER_OFFLINE` pour les versions plus anciennes (préférence, pas une garantie). Le plugin Capgo a une option `useOnDeviceRecognition` et prévient qu’un modèle peut devoir être téléchargé. Nécessite la permission `RECORD_AUDIO` (à ajouter au manifeste et à la politique de confidentialité). **Meilleure option pour l’APK.** |
| Vosk (WASM, `vosk-browser`) | modèle `vosk-model-small-fr-0.22` : 41 Mo (WER 24 % Common Voice) ; grand modèle 1,4 Go (serveur) | Moteur et `vosk-browser` : Apache-2.0 ; modèle small-fr-0.22 : Apache-2.0 (éviter `small-fr-pguyot` CC-BY-NC-SA et `linto` AGPL) | Fonctionne dans le navigateur et la WebView ; 41 Mo à télécharger une fois puis cache ; précision limitée mais suffisante pour un vocabulaire restreint (on peut contraindre la grammaire). |
| whisper.cpp (WASM ou natif) | tiny 75 Mio (≈ 273 Mo RAM), base 142 Mio (≈ 388 Mo), small 466 Mio (≈ 852 Mo) | MIT ; modèles Whisper MIT | Exemples `whisper.wasm` et `whisper.android` ; plus précis que Vosk small mais plus lourd et lent sur mobile d’entrée de gamme. |

Sources : [Vosk models](https://alphacephei.com/vosk/models), [vosk-browser package.json](https://cdn.jsdelivr.net/npm/vosk-browser@0.0.8/package.json),
[whisper.cpp](https://github.com/ggml-org/whisper.cpp), [SpeechRecognizer API 31](https://developer.android.com/sdk/api_diff/31/changes/android.speech.SpeechRecognizer),
[SpeechRecognizer API 33](https://developer.android.com/sdk/api_diff/33/changes/android.speech.SpeechRecognizer),
[RecognizerIntent](https://developer.android.com/reference/android/speech/RecognizerIntent),
[plugin Capgo (README v8.1.10)](https://cdn.jsdelivr.net/npm/@capgo/capacitor-speech-recognition@8.1.10/README.md), [dépôt Capgo (licence)](https://github.com/Cap-go/capacitor-speech-recognition),
[capacitor-community/speech-recognition](https://github.com/capacitor-community/speech-recognition).

Intégration prévue : une classe qui implémente `SpeechInput` avec `offline: true` ; `getSpeechInput()` la renverra en
priorité, et le bouton micro apparaîtra sans option « en ligne ».

## 3. Étude : LLM sur l’appareil

### Pourquoi pas encore

- La base locale répond déjà aux questions visées avec des contenus validés, en < 1 ms, sur tous les appareils.
- Un LLM ajoute un risque d’invention (techniques, conseils) qu’il faut contenir ; ici il ne pourrait que reformuler.
- Poids : 0,5 à 3 Go de modèle à télécharger, 0,7 à 2 Go de mémoire en plus ; inadapté aux téléphones d’entrée de gamme
  et lourd pour une PWA.
- Rien n’a été mesuré sur un appareil réel.

### Android : LiteRT-LM (successeur de MediaPipe LLM Inference)

Tailles publiées dans la documentation LiteRT-LM ([overview](https://developers.google.com/edge/litert-lm/overview)) :

| Modèle | Fichier | Remarques |
| --- | --- | --- |
| Gemma3-1B | 1005 Mo | Le plus réaliste pour une reformulation courte en français. |
| Gemma-3n-E2B | 2965 Mo | S24 Ultra : décodage ≈ 16 jetons/s (CPU et GPU) d’après la fiche du modèle ([Hugging Face](https://huggingface.co/google/gemma-3n-E2B-it-litert-lm/blob/refs%2Fpr%2F2/README.md)). |
| Gemma4-E2B | 2583 Mo | Pic mémoire S26 Ultra : 1733 Mo (CPU) / 676 Mo (GPU) ; décodage 52 jetons/s (GPU). Licence propre à Gemma 4, à vérifier séparément. |
| Qwen2.5-0.5B / Qwen3-0.6B | 521 / 586 Mo | Plus légers ; qualité du français à évaluer. |

- API Kotlin stable ; nécessiterait un plugin Capacitor maison (Kotlin) exposant `available()` / `generate()`.
- Appareils de référence cités par Google : Samsung S24 / S25 / S26 Ultra, Vivo X300 Pro (haut de gamme). Minimum
  raisonnable à valider : 6–8 Go de RAM, Android 12+, 1,5 à 3 Go de stockage libre.
- Licence Gemma ([conditions](https://ai.google.dev/gemma/terms)) : transmettre les restrictions d’usage et la politique
  d’usage interdit aux utilisateurs, fournir une copie de l’accord, inclure un fichier Notice (« Gemma is provided under
  and subject to the Gemma Terms of Use found at ai.google.dev/gemma/terms »), marquer les modifications. Pas de
  redevance mentionnée. Le modèle ne doit pas être intégré à l’APK (taille) : téléchargement à la demande, avec accord.

### Navigateur

| Option | Exemples (mémoire GPU requise) | Licence | Remarques |
| --- | --- | --- | --- |
| WebLLM (WebGPU) | `gemma3-1b-it-q4f16_1` 711 Mo ; `Llama-3.2-1B-Instruct-q4f16_1` 879 Mo ; `Qwen2.5-0.5B-Instruct-q4f16_1` 945 Mo ; `SmolLM2-360M-Instruct-q4f16_1` 376 Mo ; `gemma-2-2b-it-q4f16_1` 1895 Mo | Apache-2.0 (bibliothèque) + licence de chaque modèle | WebGPU obligatoire ; chiffres `vram_required_MB` de `src/config.ts` du dépôt ([web-llm](https://github.com/mlc-ai/web-llm)). |
| transformers.js v3 (WebGPU ou WASM) | `onnx-community/Qwen2.5-0.5B-Instruct` : q4f16 483 Mo, int8 512 Mo, q4 786 Mo | Apache-2.0 (bibliothèque) | `device: 'webgpu'`, `dtype: 'q4f16'` ; WebGPU ≈ 70 % des navigateurs en octobre 2024 ([billet v3](https://www.huggingface.co/blog/transformersjs-v3), [fichiers ONNX](https://huggingface.co/onnx-community/Qwen2.5-0.5B-Instruct/tree/main/onnx)). |
| LiteRT-LM JavaScript | — | — | « Early Preview » selon la documentation. |

### Plan de test sur un vrai Android (avant toute activation)

1. Appareils : un haut de gamme (8–12 Go RAM, Android 14+), un milieu de gamme (6 Go, Android 12), un entrée de gamme (4 Go) pour vérifier le refus propre.
2. Reconnaissance : plugin Capgo en `useOnDeviceRecognition`, mode avion activé, pack français installé / absent ; mesurer le taux de compréhension sur les 6 questions d’exemple dites dans une salle bruyante, à 1–2 m du téléphone.
3. LLM : Gemma3-1B via LiteRT-LM (plugin Kotlin), modèle téléchargé à la demande ; mesurer temps jusqu’au 1er jeton, jetons/s, pic mémoire, chauffe et batterie sur 20 questions, en parallèle du rendu 3D de l’entraînement (fps du coach).
4. Qualité : 200 questions (dont pièges : techniques inexistantes, « corrige-moi », douleur) ; la sortie du LLM ne doit introduire aucun fait absent des passages ; `acceptLlmOutput` + relecture humaine.
5. Garder la base locale comme repli automatique (modèle absent, mémoire insuffisante, délai > 3 s).

## 4. Tests

`npx vitest run src/coach` : 31 tests (les 6 questions d’exemple, adaptation au niveau / longueur / garde / discipline,
pseudo, honnêteté, hors sujet, demandes dangereuses, techniques inconnues, douleur, ids d’actions existants pour 4
disciplines × 2 niveaux, déterminisme, < 20 ms par question, interface LLM avec faux moteur, voix, store).
