# Jeux du portfolio

Chaque jeu dispose de son propre dossier. Les liens du portfolio pointent directement sur les pages ci-dessous.

| Projet | Page principale |
| --- | --- |
| CESTUS | `CESTUS/index.html` |
| Neon Defense / Dark Rift | `neon-defense/index.html` |
| Dark Rift multijoueur | `neon-defense/multiplayer.html` |
| Ancien Neon Defense | `neon-defense/archive/index.html` |
| FluidEntities | `fluid-entities/index.html` |
| SN@KE | `snake/index.html` |
| Ancien SN@KE | `snake/archive/index.html` |
| Project Coming Soon | `project-coming-soon/index.html` |
| Pixel Trail | `pixel-trail/index.html` |
| Party Games | `party-games/index.html` |
| STICKMINE | `stickmine/index.html` |
| Algo Test Mouse | `algo-test-mouse/index.html` |

Les petits fichiers HTML à la racine de `games` sont des redirections de compatibilité. Ils conservent les anciens favoris et liens, y compris leur query string et fragment. Le code des jeux se trouve dans les dossiers dédiés.

Les images de Dark Rift sont dans `neon-defense/assets`. Les anciens atlas ODK et la seconde image Dark Rift sont conservés dans `assets/legacy`. Les deux images d'origine ont été préservées sous des noms distincts pour éviter la collision `darkrift.PNG` / `darkrift.png` sur Windows.

## Pixel Trail

`pixel-trail/index.html` est le fichier autonome à modifier pour mettre à jour le jeu. Son identifiant cloud conserve le chemin historique `/games/test.html` afin de retrouver le même monde après le déplacement. Les clés de sauvegarde locale restent inchangées.

Si le navigateur bloque le stockage local ou de session, Pixel Trail utilise une mémoire de secours limitée à la page ouverte pour le pseudo, les préférences et les identifiants de session. Cette mémoire disparaît au rechargement ou à la fermeture de l'onglet ; elle ne constitue pas une sauvegarde persistante.

Après un salon complet ou une erreur de démarrage, le bouton de départ de Pixel Trail peut relancer la tentative sur la connexion déjà ouverte.

Party Games ignore un historique récent sauvegardé sous une forme invalide pour permettre de continuer après la saisie du pseudo.

## Archives et points connus

L'ancien fichier SN@KE ne contenait aucun jeu (deux octets). Sa page d'archive propose désormais des liens vers SN@KE et le portfolio.

Les exports FluidEntities et Algo Test Mouse étaient strictement identiques avant rangement. Les deux entrées ont été conservées : il faut retrouver un export distinct de FluidEntities pour rétablir deux jeux réellement différents.

CESTUS conserve son dossier historique pour préserver le périmètre de son installation hors ligne. Son service worker ne supprime désormais que les caches `cestus-static-*`, et utilise uniquement son propre cache pour répondre aux requêtes. L'icône est incluse dans la copie hors ligne.

Dark Rift multijoueur vérifie désormais la présence des conteneurs du menu solo avant de les reconstruire. Les interfaces multijoueur les retirent volontairement ; une réinitialisation après leur retrait provoquait auparavant une erreur `innerHTML` au chargement.
