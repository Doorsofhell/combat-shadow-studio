---
paths:
  - "src/monetization/**"
  - "src/ui/premium/**"
  - "docs/monetisation/**"
---

# Monétisation (Shadow Pro)

- `MONETIZATION_ENABLED=false` (`src/monetization/rights.ts`) : `canAccessFeature` renvoie toujours vrai. Aucun vrai paiement, aucun blocage, aucun faux achat.
- Les décisions de Youssef sont dans `docs/monetisation/DECISIONS.md` : achat à vie de 29,99 € (19,99 € au lancement), offre gratuite = débutant et intermédiaire, Kadir et Amara gratuits, limites chiffrées. À lire avant de coder.
- Le catalogue des droits ne contient que des fonctions réelles. Les règles de marquage sont dans `src/monetization/premiumItems.ts`.
- Les testeurs reçoivent Premium par la licence de test Play Console et les codes promo, jamais par une liste d'adresses dans l'application.
- La simulation n'existe qu'en aperçu : `VITE_PREMIUM_SIMULATION=1`, e2e avec `-c playwright.sim.config.ts`.
