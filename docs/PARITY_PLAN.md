Parité LaBrute — Plan d’implémentation (vivant)

Objectif
- Cloner fidèlement la logique de combat de LaBrute côté serveur (moteur autoritaire, seedé), avec un front Phaser + Spine pour l’affichage.

État actuel (V08)
- Endpoint unique POST `/api/fights` renvoie un combat seedé avec StepType numériques (basic Move/AttemptHit/Evade/Hit/MoveBack/Death/End).
- RNG: mulberry32 (seed optionnelle via body.seed).
- Front: la scène `FightSceneSpine` consomme les steps serveur et les rejoue (mouvements/tirs/HP synchro). Barres HP corrigées (gauche→droite, droite→gauche).
- Simplifications connues: formules et courbes (accuracy/block/evade/crit/armor) minimales; pas encore d’initiative/tempo officiel, ni armes/skills/pets complets.

Étapes (ordre de marche)
1) Données officielles
   - Importer constants/armes/skills/pets depuis `fichiers_labrute-officiel` (reach, tempo, accuracy, types, IDs).
   - Sortie: modules JS/TS consommables par le moteur.

2) PRNG & déterminisme
   - Vérifier zéro `Math.random` dans le moteur; tout passe par `mulberry32` injecté.
   - Test: deux combats seedés -> steps identiques (snapshot JSON).

3) Statistiques & formules fidèles
   - `getFighterStat`: ACCURACY/BLOCK/EVASION/CRITICAL(CHANCE/DAMAGE)/TEMPO/ARMOR/REACH/DEXTERITY, y compris modifs armes/skills.
   - `getDamage`: variantes (thrown, piledriver/hammer), multiplicateurs de skills, arme endommagée, resistant cap, armor finale, crit.

4) Timeline & initiative
   - Ordo: initiative la plus basse joue d’abord, incrément post‑action (tempo arme).
   - Séquence: Arrive → Move → AttemptHit → (Evade/Block/Counter) → Hit → effets (sabotage/disarm/ironHead) → MoveBack → Death/End.
   - Durées Move/MoveBack: selon Golden Rule (distances / coeffs + min).

5) Armes/skills/pets
   - Armes: reach/tempo/accuracy/types, toss, usure.
   - Skills passifs/actifs: durées/priorités, hooks activation/désactivation.
   - Pets: IA, cible, mort/respawn, tamer.

6) IA & ciblage
   - `getRandomOpponent` avec filtres (trapped/stunned/pets/boss/focus).

7) Replays & validation
   - Replays (seed + steps), endpoints save/get; validate (re-sim + hash match).
   - Snapshots: scripts `--seed` + diff JSON.

8) Spine mapping
   - Mapping StepType → animations, attachments d’armes/pets, sons/FX.

Suivi d’avancement
- [x] Endpoint `/api/fights` seedé + steps numériques
- [x] Front rejoue les steps serveur
- [x] Correctif barres HP
- [ ] Import data officielles armes/skills/pets
- [ ] Statistiques & formules fidèles (accuracy/block/evade/crit/armor)
- [ ] Initiative/tempo officiel
- [ ] Armes/skills/pets complets
- [ ] IA & ciblage complet
- [ ] Replays + validation
- [ ] Mapping Spine avancé

Notes licence
- Les mécaniques sont ré-implémentées depuis des specs publiques/données, sans copier du code sous licence incompatible. Les noms/valeurs publiques sont chargés comme data.

