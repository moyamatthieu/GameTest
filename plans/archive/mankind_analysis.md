# Analyse Comparative : Mankind vs. Galactic Dominion

Ce document analyse les forces du MMORTS classique "Mankind" et définit comment Galactic Dominion s'en inspire tout en innovant pour surmonter ses faiblesses historiques.

## 1. L'Héritage de Mankind

Mankind (1998) a posé les bases du MMORTS persistant de masse. Ses piliers étaient :
- **Échelle Galactique :** Des milliers de systèmes stellaires interconnectés.
- **Économie de Marché :** Un système d'offre et de demande géré par les joueurs.
- **Souveraineté :** La capacité pour les corporations de conquérir et de taxer des territoires.
- **Logistique Réelle :** Le transport de ressources n'était pas instantané.

## 2. Analyse Critique & Innovations Proposées

| Concept | Approche Mankind | Innovation Galactic Dominion |
| :--- | :--- | :--- |
| **Logistique** | Transport souvent fastidieux, nécessitant une micro-gestion constante. | **Logistique Physique Automatisée :** Utilisation de scripts de comportement pour les flottes de cargos. |
| **Production** | Accumulation massive de stocks (Stockpiling). | **Just-in-Time (JIT) :** Les chaînes de production exigent un flux constant ; l'arrêt du flux arrête la production. |
| **Contrôle** | Unité par unité ou groupes simples. | **Fleet Component (ECS) :** Gestion de flottes comme une entité unique avec des comportements de groupe (V-shape, escort). |
| **Souveraineté** | Basée sur la présence militaire uniquement. | **Système de Balises de Souveraineté :** Infrastructure physique nécessaire pour revendiquer et taxer un système. |

## 3. Les Scripts de Comportement (Behavior Scripts)

L'innovation majeure réside dans l'automatisation intelligente. Au lieu de donner des ordres individuels, le joueur configure des "Templates de Comportement" :
- **Route Commerciale Sécurisée :** "Si menace détectée > Sauter vers système adjacent > Attendre escorte".
- **Minage Systématique :** "Miner astéroïde > Si plein > Décharger au spatioport le plus proche".
- **Patrouille de Frontière :** "Suivre route A-B-C > Engager tout ennemi de taille < X".

## 4. Trajectoire vers le MMORTS Persistant

Pour atteindre la masse critique sans sacrifier la performance :
1. **Persistance Décentralisée :** Utilisation de l'ECS pour gérer des milliers d'entités passives (cargos en transit) avec une mise à jour basse fréquence côté serveur.
2. **Économie Interdépendante :** La spécialisation planétaire (ex: Planète Minière vs Planète Industrielle) force le commerce et crée des points de friction naturels pour le PvP.
3. **Gouvernance de Corporation :** Outils intégrés pour la gestion des taxes, des droits d'accès aux structures et de la hiérarchie des membres.
