# Comptes, profils et synchronisation

Dernière mise à jour : 22 octobre 2026 (v0.37.0).

## Ce qui est actif dans cette version (v0.37.0, 22 octobre 2026)

Projet Firebase « Combat Shadow Studio » (`combat-shadow-studio`), forfait **Spark** gratuit, créé par le propriétaire.
La configuration web publique est injectée seulement dans la version publiée sur GitHub Pages
(`.github/workflows/preview.yml`) ; les tests automatiques et la version Claude restent en mode invité.

| Fonction | État |
| --- | --- |
| Mode invité (sans compte, hors ligne) | **Actif**, par défaut, aucune inscription obligatoire |
| E-mail + mot de passe : inscription, vérification, renvoi du lien, mot de passe oublié | **Actif** sur la page GitHub Pages (fournisseur activé, vérifié le 22/10 avec un compte de test supprimé aussitôt) |
| Modifier l’adresse e-mail (lien de confirmation envoyé à la nouvelle adresse) et le mot de passe | **Actif** (v0.37), avec confirmation du mot de passe actuel |
| Indicateur de robustesse du mot de passe | **Actif** (v0.37), à titre de conseil |
| Connexion Google (web, fenêtre Google) | **Actif** sur `doorsofhell.github.io` (domaine autorisé, fournisseur activé) |
| Connexion Google dans l’application Android | **Non disponible** : module natif à ajouter (plan ci-dessous), le bouton est masqué |
| Photo de profil : photo Google, ou photo personnelle (appareil photo, galerie, cadrage, compression, sans métadonnées) | **Actif** (v0.37). La photo personnelle reste **sur l’appareil** (pas de Cloud Storage) et n’est pas restaurée sur un autre appareil |
| Lier e-mail et Google, retirer une méthode (jamais la dernière), supprimer le compte | **Actif** |
| Synchronisation Firestore (facultative, désactivée par défaut) | **Codée** ; elle fonctionne dès que les règles `firestore.rules` sont **publiées dans la console** (voir « À faire dans la console »). Avant cela, l’état affiche « Erreur de synchronisation : le serveur a refusé l’accès » et rien n’est perdu |
| Préparation Premium à vie | Chemin `users/{uid}/entitlements/*` **lisible seulement** par l’application ; seul un futur serveur de vérification des achats pourra l’écrire |
| Facebook, Instagram, Apple, SMS, téléphone | **Retirés** du périmètre (correctif 0 €, 22/10) : aucun bouton |
| Clés d’accès (passkeys) | **Non proposé** (Firebase n’a pas de fournisseur passkey) |

Règle : **aucun bouton de connexion n’est affiché s’il ne fonctionne pas réellement**.

### À faire dans la console Firebase (propriétaire)

1. *Firestore Database* › *Règles* : remplacer `allow read, write: if false;` par le contenu complet du fichier
   `firestore.rules` du dépôt, puis **Publier**. Sans cette étape, la connexion fonctionne mais la sauvegarde en
   ligne est refusée.
2. *Authentication* › *Templates* : choisir le français pour les e-mails (vérification, réinitialisation,
   changement d’adresse). Facultatif mais conseillé.
3. Rien d’autre à activer : pas de Cloud Storage, pas de Functions, pas de Blaze.

### Coûts (forfait Spark, d’après https://firebase.google.com/pricing consultée le 22 octobre 2026)

| Service | Forfait | Coût au lancement | Quota gratuit | Limites connues | Risque de facturation | État |
| --- | --- | --- | --- | --- | --- | --- |
| Authentication (e-mail, Google) | Spark | 0 € | 50 000 utilisateurs actifs par mois (chiffre de la page tarifs) | Firebase limite le nombre d’e-mails envoyés (vérification, réinitialisation) : voir la page « Limits » d’Authentication | Aucun : sans compte de facturation, Google ne peut rien facturer, le service refuse au-delà | Configuré |
| Cloud Firestore (default), europe-west9 | Spark | 0 € | 1 Gio stocké, 10 Gio sortants par mois, 50 000 lectures, 20 000 écritures et 20 000 suppressions par jour | Au-delà : erreur « quota » jusqu’au lendemain ; l’application continue en local | Aucun (pas de facturation sur Spark) | Base créée, **règles à publier** |
| Cloud Storage | Non utilisé | 0 € | — | Absent de la liste des produits Spark sur la page tarifs | — | Non activé : photo personnelle locale |
| Hébergement | GitHub Pages | 0 € | — | — | Aucun | Actif |

Consommation estimée : un document par collection et par utilisateur (6 au plus) ; une synchronisation lit au
plus 6 documents et n’écrit que ceux qui ont changé, après 1,5 s sans nouvelle modification. Les clés et quotas
réels sont ceux de la console ; ne jamais supposer une capacité illimitée.

### Localisation

Firestore : `europe-west9` (Paris). Firebase Authentication et la connexion Google sont des services mondiaux de
Google : leurs traitements ne sont pas exclusivement hébergés en France ni dans l’EEE.

## Architecture

```
src/account/
  auth/types.ts        interface AuthProvider (fournisseur neutre), règles mot de passe / e-mail
  auth/guest.ts        fournisseur invité (toujours disponible)
  auth/firebase.ts     fournisseur Firebase Authentication (SDK modulaire, chargé à la demande)
  auth/config.ts       lecture de VITE_FIREBASE_* à la compilation
  auth/index.ts        choix du fournisseur (Firebase seulement si configuré)
  session.ts           état de session (useAccount) et actions : inscription, connexion, déconnexion,
                       vérification, liaison, suppression des données et du compte, démarrage de la sync
  scope.ts             changement d’utilisateur : rechargement des stores, déplacement invité → compte
  crypto.ts            chiffrement AES-GCM des données sensibles
  export.ts            export complet des données de l’utilisateur courant
  syncPrefs.ts         choix « synchronisation » (par utilisateur, désactivé par défaut)
  sync/model.ts        modèle de document et résolution des conflits (fonctions pures)
  sync/engine.ts       moteur hors ligne d’abord (file d’attente, reprise en ligne), interface SyncAdapter
  sync/collections.ts  correspondance stores ↔ documents
  sync/firestore.ts    adaptateur Firestore (chargé à la demande)
src/ui/screens/account/SignIn.tsx   /connexion
src/ui/screens/account/Profile.tsx  /profil
firestore.rules                     règles de sécurité Firestore
```

Le SDK Firebase n’est jamais dans le paquet principal : `auth/firebase.ts`, `sync/firestore.ts` et `firebase/*`
sont importés dynamiquement, et la condition est écrite avec `import.meta.env.VITE_FIREBASE_*` en clair pour que la
compilation **supprime complètement** les morceaux Firebase quand la configuration est absente (vérifié : aucun
fichier Firebase dans `dist/` sans configuration ; avec configuration, le paquet principal garde la même taille).

### Espaces de données par utilisateur

Toutes les clés persistées passent par `src/store/storage.ts`, qui préfixe chaque clé par l’utilisateur courant :
`css-profile` → `u:local:css-profile` (invité) ou `u:fb-<uid>:css-profile` (compte). Exceptions, communes à
l’appareil : `css-settings` (son, 3D, rounds) et les métadonnées `css-meta:*` (utilisateur courant, migration).

- **Migration** au premier lancement de cette version : les anciennes clés sans préfixe (`css-profile`, `css-stats`,
  `css-custom`, `css-goals`, `css-fighters`, `css-catalog`, `css-coach-ai`, et toute autre clé `css-*` d’utilisateur)
  sont copiées dans `u:local:`, puis un marqueur est écrit, puis les anciennes clés sont supprimées. Une valeur déjà
  présente n’est jamais écrasée : une interruption ne peut laisser qu’un doublon, jamais une perte.
- **Changement d’utilisateur** (`switchScope`) : écritures suspendues, stores remis à leur état initial, nouvel
  utilisateur enregistré, stores relus. Un store persistant non déclaré dans `scope.ts` provoque un rechargement
  complet de la page plutôt qu’un risque de fuite (`registerScopedStore` permet de l’éviter).
- **Invité → compte** : à la création du compte (ou à la connexion si la case est cochée), les données invité sont
  copiées dans l’espace du compte (les valeurs déjà présentes du compte sont gardées), les limitations sont
  rechiffrées avec la clé du compte, puis l’espace invité est vidé.
- **Déconnexion** : retour en invité ; les données du compte restent sur l’appareil pour la prochaine connexion,
  sauf si l’utilisateur coche « Effacer les données de ce compte sur cet appareil ».

### Profil (`src/store/profile.ts`)

Champs ajoutés avec valeurs par défaut (les profils existants restent valides) : `pseudo`, `firstName`, `lastName`,
`avatar` (`fighter` = le combattant 3D personnalisé, ou `initiales`), `birthDate` (l’âge en est déduit) ou `age`,
`heightCm`, `weightKg`, `language` (`fr`), `display` (taille du texte, animations réduites), `disciplines`
pratiquées, `levels` par discipline, `yearsExperience`, `guard`, `daysPerWeek`, `sessionMinutes`, `goals` (les huit
objectifs : Apprentissage technique, Amélioration de la coordination, Travail des déplacements, Amélioration de la
vitesse, Endurance cardiovasculaire, Mobilité, Perfectionnement des enchaînements, Découverte d’une nouvelle
discipline ; les anciens identifiants sont convertis), `difficulty`, `limitations` (chiffré), `coachAi.usePseudo`.
Le coach IA lit `useProfile.getState().profile.pseudo`.

Aucune aptitude médicale n’est déduite du poids, de la taille ou de l’âge ; l’écran le dit.

### Chiffrement des limitations

WebCrypto AES-GCM 256, IV aléatoire de 12 octets à chaque écriture, une clé par utilisateur générée sur l’appareil
avec `extractable: false` et rangée dans une base IndexedDB séparée (`css-keys`). Le texte n’est jamais écrit en
clair ; si WebCrypto manque (contexte non sécurisé), il n’est pas enregistré du tout et l’écran le signale.
« Supprimer mes données » supprime aussi la clé : un reste de données chiffrées devient illisible.

**Limites (honnêtes)** : protège contre la lecture des fichiers de l’application (copie, sauvegarde, inspection
d’IndexedDB) ; ne protège **pas** contre du code exécuté dans l’application (une extension malveillante, une
faille XSS) ni contre une personne qui utilise l’appareil déverrouillé. Les limitations ne sont jamais synchronisées.
L’export complet les contient en clair (c’est un droit d’accès : le fichier appartient à l’utilisateur).

## Fournisseur Firebase

- **E-mail + mot de passe** : mot de passe de 8 caractères minimum avec lettre et chiffre (vérifié avant l’envoi) ;
  Firebase le hache (scrypt) côté serveur, l’application ne le stocke jamais. Un e-mail de vérification part à
  l’inscription ; le profil propose « Renvoyer l’e-mail » et « J’ai vérifié ». La réinitialisation répond toujours
  le même message neutre (pas d’énumération des comptes).
- **Sessions** : gérées par le SDK (jeton d’identité d’une heure renouvelé automatiquement, jeton de rafraîchissement
  dans IndexedDB). L’application ne copie aucun jeton ailleurs. La suppression du compte exige une
  réauthentification récente (mot de passe ou Google).
- **Liaison de méthodes** : ajouter e-mail + mot de passe à un compte Google, ou relier Google à un compte e-mail ;
  retirer une méthode s’il en reste au moins une.
- **Google sur le web** : `signInWithPopup`. **Dans l’application Android**, la WebView Capacitor ne gère pas les
  fenêtres de connexion : le bouton est masqué.

### Plan pour Google dans l’application Android (non installé)

Module recommandé : **`@capacitor-firebase/authentication`** (Capawesome, version 8.x compatible Capacitor 8,
dépend de `firebase` ^12.6). Il utilise les bibliothèques AndroidX Credentials (Credential Manager) et Google Play
Services pour afficher le sélecteur de compte natif.

1. `npm install @capacitor-firebase/authentication` puis, dans `capacitor.config.ts` :
   `plugins: { FirebaseAuthentication: { skipNativeAuth: true, providers: ['google.com'] } }`
   (`skipNativeAuth: true` : le module ne sert qu’à obtenir le jeton Google ; la session reste dans le SDK web).
2. Dans `android/variables.gradle` : `rgcfaIncludeGoogle = true` (et la version AndroidX Credentials demandée par
   la documentation du module), puis `npx cap sync android`.
3. Console Firebase : ajouter l’application Android (identifiant du paquet de `capacitor.config.ts`), télécharger
   `google-services.json` dans `android/app/`, ajouter les empreintes **SHA-1** de la clé de debug
   (`./gradlew signingReport`) et de la clé de signature Google Play (Play Console › Intégrité de l’application).
4. Dans `auth/firebase.ts` : sur Android, `FirebaseAuthentication.signInWithGoogle()` puis
   `signInWithCredential(auth, GoogleAuthProvider.credential(result.credential.idToken))`, et passer
   `capabilities.google` à `true` sur Android.

## Clés d’accès (passkeys)

Firebase Authentication **ne fournit pas de fournisseur passkey/WebAuthn** à ce jour. Les solutions existantes
font la cérémonie WebAuthn à côté (service tiers comme Corbado, ou extension avec Cloud Functions qui vérifie la
signature puis émet un *custom token* Firebase) : elles exigent un serveur (Cloud Functions = forfait Blaze) et un
service ou du code serveur que ce projet n’a pas. Rien n’est donc affiché. À réévaluer si Firebase ajoute un
fournisseur natif, ou si un backend est ajouté.

## Facebook (étude, rien dans l’application)

Faisable avec le fournisseur `FacebookAuthProvider` de Firebase, mais coûteux à maintenir :

- créer une application Meta for Developers (identifiant + clé secrète saisis dans la console Firebase, la clé
  secrète ne va jamais dans l’application) ;
- passer la vérification d’entreprise / l’examen de l’application Meta pour un usage public, fournir une URL de
  politique de confidentialité et une procédure (ou URL de rappel) de suppression des données ;
- sur Android, SDK Facebook natif (hachages de clé, `facebook_app_id`), la popup web ne fonctionnant pas dans la
  WebView ;
- collisions d’adresses e-mail avec un compte e-mail ou Google existant à gérer (liaison).

Recommandation : seulement si une demande réelle apparaît, après Google natif.

## Pourquoi pas WhatsApp ni Instagram

- **WhatsApp** n’est pas un fournisseur d’identité grand public : pas de « Se connecter avec WhatsApp » pour une
  application tierce (l’API WhatsApp Business sert à envoyer des messages, par exemple des codes, payants, et
  nécessite un compte Business et un serveur).
- **Instagram** : l’ancienne « Instagram Basic Display API » a été arrêtée par Meta (décembre 2024) ; il n’existe
  plus de connexion Instagram pour des comptes personnels dans une application tierce. La voie Meta reste Facebook.

## Synchronisation

- **Facultative, désactivée par défaut**, par utilisateur (`syncPrefs`), seulement pour un compte connecté avec une
  adresse e-mail vérifiée (Google : vérifiée d’office). Tout fonctionne hors ligne sans elle.
- **Modèle** : un document par collection et par utilisateur, `users/{uid}/sync/{collection}` (`profile`, `stats`,
  `custom`, `goals`, `fighters`, `catalog`). Chaque document a `updatedAt`, des `fields` (valeur + `updatedAt`) et
  des `items` (`updatedAt`, `data`, ou `deleted: true` = pierre tombale).
- **Suivi local** : à chaque changement d’un store, l’instantané est comparé au dernier document connu ; les champs
  et éléments modifiés reçoivent l’heure courante (jamais antérieure au dernier horodatage du document), les éléments
  disparus deviennent des pierres tombales.
- **File d’attente hors ligne** : les collections modifiées sont notées « en attente » sur l’appareil ; à la reprise
  du réseau (événement `online`), au lancement ou sur « Synchroniser maintenant », le moteur récupère chaque
  document, fusionne, applique le résultat au store et renvoie le document si le serveur était en retard.
- **Stratégie de conflit (explicite)** : dernier écrit gagne **par élément** (une séance, un combattant, un
  enchaînement, un favori…) et **par champ** pour le profil et les objectifs. Une suppression plus récente gagne sur
  une modification plus ancienne, et inversement ; en cas d’égalité parfaite la suppression gagne, sinon la valeur la
  plus grande (ordre déterministe). La fusion est commutative, associative et idempotente : tous les appareils
  convergent (testé sur 200 cas aléatoires). Deux modifications du **même** élément sur deux appareils hors ligne :
  la plus récente gagne entièrement (pas de fusion à l’intérieur d’un combattant).
- **Limites** : l’horodatage vient de l’horloge de l’appareil (une horloge très décalée peut faire perdre une
  modification concurrente) ; pierres tombales purgées après 180 jours (un appareil resté hors ligne plus longtemps
  peut faire réapparaître un élément supprimé) ; un document Firestore est limité à 1 Mio (largement assez pour des
  milliers de séances ; à découper si besoin).
- **Non synchronisé** : limitations physiques, réglages de l’appareil, données du coach IA (historique local).
- **Règles** (`firestore.rules`) : chaque utilisateur ne lit et n’écrit que `users/{uid}/**`, avec e-mail vérifié et
  un document au bon format ; tout le reste est refusé.

## Activer Firebase (pour le propriétaire)

1. Créer un projet sur <https://console.firebase.google.com> (forfait **Spark**, gratuit, sans carte bancaire).
2. *Authentication* › *Sign-in method* : activer **E-mail/Mot de passe** et **Google** (adresse e-mail d’assistance
   à choisir). *Settings* › *Authorized domains* : ajouter le domaine de la PWA. Laisser la protection contre
   l’énumération des e-mails activée. Personnaliser les modèles d’e-mail (français) et, idéalement, un domaine
   d’envoi.
3. *Firestore Database* : créer la base en mode production, région européenne (par exemple `europe-west1`) pour le
   RGPD, puis déployer les règles : `npx firebase-tools deploy --only firestore:rules` (avec `firebase.json` pointant
   vers `firestore.rules`) ou les coller dans la console.
4. *Project settings* › *Your apps* › application Web : copier la configuration dans un fichier `.env.local` (non
   versionné) ou dans les variables du service de déploiement :
   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=<projet>.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=<projet>
   VITE_FIREBASE_APP_ID=1:...:web:...
   ```
   Ces valeurs sont des **identifiants publics** du projet (présents dans toute application web Firebase), pas des
   secrets : la sécurité repose sur l’authentification et les règles Firestore. Restreindre la clé d’API par
   référent HTTP / application Android dans Google Cloud Console est conseillé. **Aucune clé privée, compte de
   service ou secret ne doit aller dans le frontend.**
5. Recompiler (`npm run build`). Les écrans affichent alors e-mail + mot de passe et Google (web).
6. Mettre à jour la politique de confidentialité (contact, sous-traitant Google, région) et le formulaire « Sécurité
   des données » de Google Play (voir `docs/CONFIDENTIALITE.md`).

### Coûts (à revérifier sur <https://firebase.google.com/pricing> au moment de l’activation)

- **Authentication** sur Spark : e-mail/mot de passe et Google sans frais (la page tarifs indique 50 000 utilisateurs
  actifs par mois sur le niveau gratuit). Pas d’authentification par téléphone sur Spark (non utilisée ici). Les
  envois d’e-mails (vérification, réinitialisation) ont des plafonds quotidiens.
- **Cloud Firestore** sur Spark : 1 Gio stocké, 50 000 lectures, 20 000 écritures et 20 000 suppressions par jour,
  10 Gio de transfert sortant par mois. Une synchronisation complète coûte au plus 6 lectures et 6 écritures ; les
  modifications sont regroupées (délai de 1,5 s), ce qui laisse de la marge pour plusieurs centaines d’utilisateurs
  actifs par jour.
- Pas de Cloud Functions nécessaire (elles exigeraient le forfait Blaze).

### Tester en local avec les émulateurs

Java 11+ requis. Les tests du fournisseur Firebase et des règles tournent contre les émulateurs Auth et Firestore
avec un projet de démonstration (aucun compte Google nécessaire) :

```
npx firebase-tools emulators:exec --only auth,firestore --project demo-css \
  "FIREBASE_EMULATORS=1 npx vitest run src/account/__tests__/firebase.emulator.test.ts"
```

(`firebase.json` minimal : `{ "firestore": { "rules": "firestore.rules" }, "emulators": { "auth": { "port": 9099 },
"firestore": { "port": 8080 } } }`.) Pour l’application elle-même, compiler avec
`VITE_FIREBASE_AUTH_EMULATOR=http://127.0.0.1:9099` et `VITE_FIREBASE_FIRESTORE_EMULATOR=127.0.0.1:8080` en plus de
la configuration de démonstration.

## RGPD

- Minimisation : seul le pseudo est demandé (facultatif) ; nom, prénom, date de naissance, mesures et limitations
  sont facultatifs.
- Données de santé : les limitations physiques sont des données sensibles (art. 9) ; elles restent sur l’appareil,
  chiffrées, jamais transmises.
- Accès / portabilité : « Exporter mes données » (JSON complet, importable). Rectification : profil.
  Effacement : « Supprimer mes données » (appareil + copie en ligne) et « Supprimer mon compte » (copie en ligne,
  compte Firebase, données locales du compte). Opposition : couper la synchronisation, se déconnecter.
- Isolation : données séparées par utilisateur sur l’appareil, règles Firestore par utilisateur.
- Avant activation : registre des traitements, mention de Google (sous-traitant, clauses contractuelles), région UE,
  adresse de contact dans la politique de confidentialité.
