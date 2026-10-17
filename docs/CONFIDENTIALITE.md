# Politique de confidentialité — Combat Shadow Studio

Dernière mise à jour : 17 octobre 2026. Cette politique est aussi affichée dans l’application (Réglages › Confidentialité, route `/confidentialite`).

## En résumé

Tout reste sur ton appareil. Aucune mesure d’audience, aucune publicité. Rien n’est envoyé, sauf si l’utilisateur active lui-même la synchronisation d’un compte (non disponible dans cette version) ou la saisie vocale en ligne du coach IA.

## Données conservées

L’application enregistre uniquement sur l’appareil (stockage local du navigateur ou de l’application, IndexedDB) :

- le profil : pseudo (utilisé par le coach pour s’adresser à l’utilisateur), et s’il les indique nom, prénom, date de naissance ou âge, taille, poids ; langue et préférences d’affichage ;
- le profil sportif : disciplines, niveau par discipline, années de pratique, garde, fréquence, durée habituelle, objectifs, difficulté préférée ;
- les limitations physiques, facultatives : chiffrées au repos (AES-GCM 256, clé non extractible propre à chaque utilisateur, gardée dans IndexedDB), jamais synchronisées, jamais envoyées ;
- les combattants (apparence, nom) et les réglages ;
- les statistiques d’entraînement (temps actif, séances, répétitions) ;
- les enchaînements, favoris, collections et objectifs personnels.

Sans synchronisation activée, aucune de ces données n’est envoyée sur internet, ni à l’éditeur ni à un tiers.
La taille, le poids et l’âge servent uniquement au suivi de l’utilisateur : l’application n’en déduit aucune aptitude
ni contre-indication médicale.

Les données sont rangées par utilisateur (`u:<utilisateur>:<clé>` dans IndexedDB ; `local` pour le mode invité) :
plusieurs comptes et le mode invité ne partagent rien sur un même appareil. Seuls les réglages de l’appareil (son, 3D)
sont communs.

Limite du chiffrement : il protège contre la lecture des fichiers de l’application (copie, sauvegarde, inspection),
pas contre du code exécuté dans l’application ni contre une personne qui utilise l’appareil déverrouillé.

## Comptes et synchronisation

Détails techniques : `docs/COMPTES.md`.

- Le compte est facultatif ; le mode invité donne accès à toute l’application, hors ligne.
- Dans cette version, **les comptes en ligne ne sont pas activés** (aucun projet Firebase configuré) : aucune donnée
  ne quitte l’appareil.
- Une fois activés : Firebase Authentication (Google LLC) — e-mail et mot de passe (le mot de passe est haché par
  Firebase, jamais enregistré par l’application), connexion Google ; jetons de session gérés par le SDK Firebase.
- Synchronisation **désactivée par défaut**, activable dans le profil, seulement avec une adresse e-mail vérifiée.
  Données copiées dans Cloud Firestore (`users/{uid}/…`, accessible au seul utilisateur d’après les règles de
  sécurité) : profil sans les limitations, combattants, séances et temps d’entraînement, enchaînements, favoris,
  collections, objectifs. Non synchronisés : limitations physiques, réglages de l’appareil, données du coach IA.
- Droits (RGPD) : accès et portabilité (« Exporter mes données », fichier JSON complet), rectification (profil),
  effacement (« Supprimer mes données » sur l’appareil et en ligne, « Supprimer mon compte »), opposition (couper la
  synchronisation, se déconnecter).

## Coach IA

- Les questions posées au coach sont traitées sur l’appareil ; elles ne sont jamais envoyées.
- L’historique des échanges est facultatif, **désactivé par défaut** ; s’il est activé il reste sur l’appareil et peut
  être effacé à tout moment.
- Les réponses lues à voix haute utilisent uniquement les voix installées sur l’appareil.
- La saisie vocale est **désactivée par défaut**. Si l’utilisateur l’active, elle utilise la reconnaissance vocale du
  navigateur (Web Speech API), qui fonctionne en ligne : l’audio est envoyé au service de l’éditeur du navigateur
  (par exemple Google pour Chrome) pour être transcrit.

## Réseau

- Aucune mesure d’audience (analytics), aucune publicité, aucun traceur.
- Aucun appel réseau en dehors du chargement de l’application et de ses propres fichiers (modèles 3D, bibliothèque de combinaisons), sauf, sur demande explicite de l’utilisateur, la synchronisation d’un compte et la saisie vocale en ligne. Les polices sont intégrées à l’application (pas de service de polices en ligne).
- La synthèse vocale utilise les voix installées sur l’appareil.

## Export, import et effacement

- L’export JSON est déclenché uniquement par l’utilisateur, depuis les réglages ou le profil (« Exporter mes données » : export complet, limitations comprises, en clair).
- L’import lit un fichier choisi par l’utilisateur.
- « Supprimer mes données » (profil) et « Tout effacer » (réglages) suppriment les données de l’utilisateur courant sur l’appareil, avec sa clé de chiffrement ; la désinstallation supprime tout.

## Application Android

- Permission demandée aujourd’hui : `INTERNET` uniquement (permission normale, accordée à l’installation sans fenêtre).
- Sauvegarde cloud et transfert d’appareil désactivés : `android:allowBackup="false"`, `android:fullBackupContent="false"` et `data_extraction_rules.xml` qui exclut tous les domaines. Les données se déplacent avec l’export JSON.

## Caméra et réalité augmentée

- Caméra désactivée par défaut.
- Elle ne s’ouvre qu’après un appui sur « Activer la caméra » puis l’autorisation du navigateur.
- Images traitées uniquement sur l’appareil par la réalité augmentée du navigateur (WebXR, ARCore).
- Aucune vidéo, aucune photo enregistrée ; rien n’est envoyé.
- La caméra s’arrête en quittant la réalité augmentée ou l’écran d’entraînement.
- La réalité augmentée n’est pas encore disponible dans l’application Android. Un module ARCore natif est prévu ; il ajoutera la permission `CAMERA`, avec exactement la même politique.

## Sécurité des données (Google Play)

Réponses au formulaire « Sécurité des données » de la Play Console :

| Question | Réponse |
| --- | --- |
| L’application collecte-t-elle des données utilisateur ? | Non (version actuelle : comptes en ligne non activés) |
| L’application partage-t-elle des données avec des tiers ? | Non |
| Types de données collectées | Aucun |
| Données chiffrées en transit | Sans objet (aucune donnée transmise) |
| L’utilisateur peut-il demander la suppression ? | Oui : « Tout effacer » dans les réglages, ou désinstallation |

**À revoir avant d’activer les comptes** : il faudra déclarer « Informations personnelles › Adresse e-mail » et
« Identifiants utilisateur » (compte), « Activité dans l’application » et « Santé et remise en forme › Infos
sur la condition physique » si la synchronisation est utilisée (collecte facultative, chiffrée en transit, suppression
possible), et vérifier la saisie vocale en ligne (audio traité par le service du navigateur).

Note : selon les définitions de Google Play, des données traitées uniquement sur l’appareil et jamais transmises ne sont pas « collectées ». Si le module ARCore natif est ajouté, les images de la caméra restent traitées sur l’appareil : la réponse ne change pas.

## Contact

Adresse e-mail de l’éditeur : **[À COMPLÉTER AVANT PUBLICATION]**.

Cette adresse doit obligatoirement être renseignée ici et dans l’écran Confidentialité de l’application (`src/ui/screens/Privacy.tsx`) avant la publication sur Google Play.
