import { PageHead } from '../components';
import { AppIcon } from '../icons';

/** Privacy policy, same content as docs/CONFIDENTIALITE.md. */
export function Privacy() {
  return (
    <div className="page">
      <PageHead title="Confidentialité" eyebrow="Tes données" fallback="/reglages" />
      <div className="card row nowrap" style={{ gap: 14, alignItems: 'flex-start' }}>
        <span className="icon-tile red" aria-hidden>
          <AppIcon id="privacy" />
        </span>
        <p>
          <b>Tout reste sur ton appareil.</b> Aucune mesure d’audience, aucune publicité. Rien n’est envoyé, sauf si tu actives toi-même la synchronisation d’un compte ou la saisie vocale en ligne.
        </p>
      </div>

      <article className="prose">
        <h2>Données conservées</h2>
        <p>L’application enregistre uniquement sur cet appareil (stockage local du navigateur ou de l’application, IndexedDB) :</p>
        <ul>
          <li>ton profil : pseudo, et si tu les indiques nom, prénom, date de naissance ou âge, taille, poids ; préférences d’affichage ;</li>
          <li>ton profil sportif : disciplines, niveaux, années de pratique, garde, fréquence, durée des séances, objectifs, difficulté ;</li>
          <li>tes limitations physiques si tu en indiques : chiffrées sur l’appareil (AES-GCM), jamais synchronisées ni envoyées ;</li>
          <li>tes combattants (apparence, nom) et tes réglages ;</li>
          <li>tes statistiques d’entraînement (temps actif, séances, répétitions) ;</li>
          <li>tes enchaînements, favoris, collections et objectifs personnels.</li>
        </ul>
        <p>Sans compte synchronisé, aucune de ces données n’est envoyée sur internet, ni à l’éditeur ni à un tiers. Ta taille, ton poids et ton âge ne servent qu’à ton suivi : l’application n’en tire aucune conclusion médicale ni d’aptitude.</p>
        <p>Plusieurs personnes peuvent utiliser le même appareil : les données de chaque compte et du mode invité sont rangées séparément.</p>

        <h2>Comptes et synchronisation</h2>
        <ul>
          <li>Le compte est facultatif : le mode invité donne accès à toute l’application, hors ligne.</li>
          <li>Les comptes en ligne ne sont pas activés dans cette version. S’ils le sont plus tard, ils passeront par Firebase Authentication (Google) : e-mail et mot de passe (le mot de passe est chiffré par Firebase, jamais enregistré par l’application) ou connexion Google.</li>
          <li>La synchronisation est désactivée par défaut. Si tu l’actives, ton profil (sans les limitations), tes combattants, séances, enchaînements, favoris et objectifs sont copiés dans ton espace en ligne, accessible à toi seul. Tu peux la couper à tout moment.</li>
          <li>Depuis ton profil : exporter toutes tes données (fichier JSON), supprimer tes données (sur l’appareil et en ligne) ou supprimer ton compte.</li>
        </ul>

        <h2>Coach IA</h2>
        <ul>
          <li>Tes questions au coach sont traitées sur l’appareil ; elles ne sont jamais envoyées.</li>
          <li>L’historique des échanges est facultatif et désactivé par défaut. S’il est activé, il reste sur l’appareil et tu peux l’effacer à tout moment.</li>
          <li>Les réponses lues à voix haute utilisent uniquement les voix installées sur l’appareil.</li>
          <li>
            La saisie vocale est désactivée par défaut. Si tu l’actives, elle utilise la reconnaissance vocale du navigateur, qui fonctionne <b>en ligne</b> : ta voix est envoyée au service de l’éditeur du navigateur (par exemple Google pour Chrome) pour être transcrite.
          </li>
        </ul>

        <h2>Réseau</h2>
        <ul>
          <li>Aucune mesure d’audience (analytics), aucune publicité, aucun traceur.</li>
          <li>Aucun appel réseau en dehors du chargement de l’application elle-même et de ses fichiers (modèles 3D, bibliothèque de combinaisons), sauf la synchronisation d’un compte et la saisie vocale en ligne, seulement si tu les actives.</li>
          <li>La synthèse vocale du coach utilise les voix installées sur l’appareil.</li>
        </ul>

        <h2>Export, import et effacement</h2>
        <ul>
          <li>L’export JSON est déclenché uniquement par toi, depuis les réglages ou ton profil ; le fichier reste où tu le ranges. L’export complet du profil contient tes limitations en clair.</li>
          <li>L’import lit un fichier que tu choisis ; rien n’est téléchargé automatiquement.</li>
          <li>« Supprimer mes données » (profil) et « Tout effacer » (réglages) suppriment les données de cet appareil, ainsi que la clé de chiffrement des limitations. Désinstaller l’application les supprime aussi.</li>
        </ul>

        <h2>Application Android</h2>
        <ul>
          <li>Seule la permission INTERNET est demandée aujourd’hui (permission normale, sans fenêtre d’autorisation), utilisée pour afficher l’application.</li>
          <li>La sauvegarde dans le cloud et le transfert vers un nouvel appareil sont désactivés : tes données ne quittent pas le téléphone. Pour les déplacer, utilise l’export JSON.</li>
        </ul>

        <h2>Caméra et réalité augmentée</h2>
        <ul>
          <li>La caméra est désactivée par défaut.</li>
          <li>Elle ne s’ouvre qu’après un appui sur « Activer la caméra » puis l’autorisation du navigateur.</li>
          <li>Les images sont traitées uniquement sur l’appareil par la réalité augmentée du navigateur (WebXR, ARCore) pour poser ton combattant dans la pièce.</li>
          <li>Aucune vidéo, aucune photo n’est enregistrée ; rien n’est envoyé.</li>
          <li>La caméra s’arrête dès que tu quittes la réalité augmentée ou l’écran d’entraînement.</li>
          <li>
            La réalité augmentée n’est pas encore disponible dans l’application Android. Un module ARCore natif est prévu : il ajoutera la permission CAMÉRA, avec exactement les mêmes règles.
          </li>
        </ul>

        <h2>Sécurité des données (Google Play)</h2>
        <ul>
          <li>Données collectées : aucune dans cette version (comptes en ligne non activés). La déclaration sera mise à jour avant d’activer les comptes.</li>
          <li>Données partagées avec des tiers : aucune ; la saisie vocale facultative passe par le service du navigateur.</li>
          <li>Les données restent sur l’appareil et peuvent être supprimées à tout moment par l’utilisateur (réglages ou désinstallation).</li>
        </ul>

        <h2>Contact</h2>
        <p>
          Adresse e-mail de l’éditeur : <b>[à compléter avant publication]</b>.
        </p>
        <p className="small muted">Cette adresse doit être renseignée par l’éditeur avant la publication de l’application.</p>
      </article>
    </div>
  );
}
