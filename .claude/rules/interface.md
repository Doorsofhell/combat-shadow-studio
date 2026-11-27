---
paths:
  - "src/ui/**"
  - "src/**/*.css"
  - "src/boot/**"
  - "index.html"
  - "PRODUCT.md"
  - "DESIGN.md"
---

# Interface : règles produit de Youssef

Ces règles complètent le skill `impeccable` (obligatoire, voir `CLAUDE.md`). En cas d'écart, elles priment.

- Style « Android pur » (Material 3). Proposer des maquettes dynamiques avant de coder une refonte, et ne rien coder avant le choix de Youssef.
- Les écrans principaux tiennent sans défilement quand c'est demandé (Progrès, Disciplines, Chrono). Rien n'encombre l'écran, et le coach reste grand pendant les séances.
- Pendant une séance, aucun texte ne masque le coach. Pas d'appui long. L'interaction reste minimale.
- Retour : un appui = une étape (fermer la feuille, puis quitter le plein écran, puis mettre en pause avec « Quitter la séance ? »).
- Jamais de chiffre inventé (kcal, intensité, pourcentages, statistiques), jamais de faux bouton de connexion, jamais de fausse image.
- Ne jamais écrire « combat » pour parler de l'entraînement. Les textes sont en français, avec un ton simple et pédagogique pour débutant.
- Premium (Shadow Pro) : micro-badge PRO, cadenas seulement sur une vraie restriction (aucune tant que `MONETIZATION_ENABLED` est à false), écran Premium gardé sur Android.
- Toute disparition de contenu est interdite lors d'une réorganisation (« aucune perte de contenu ») : garder une table de correspondance des écrans.
- Le Coach IA est local (recherche BM25, aucun LLM) : il répond selon l'écran et explique l'application.
