---
paths:
  - "src/account/**"
  - "firestore.rules"
  - "docs/COMPTES.md"
---

# Comptes et sauvegarde en ligne

- Coût mensuel 0 € : Firebase Spark seulement. Pas de Blaze, de Storage, de Functions ni d'e-mail payant.
- Connexion : e-mail avec mot de passe, et Google. Rien d'autre (pas de Facebook, Instagram, Apple ni SMS). Le mode invité est conservé.
- La photo personnalisée reste sur l'appareil (non synchronisée). La photo Google est lue par son URL.
- Synchronisation différentielle dans les quotas Spark. Statistiques dans `users/{uid}/sync/stats-AAAA-tN` (trimestre UTC). L'ancien document `stats` est lu une fois et jamais réécrit. Garde de taille à 900 ko. Pas de synchronisation pendant une séance (`src/account/syncHold.ts`).
- Firebase ne peut pas être déployé depuis le cloud. Les règles Firestore sont publiées par Youssef dans la console : lui donner les étapes.
- Sans `VITE_FIREBASE_*`, Firebase est masqué (invité et profils locaux seulement).
