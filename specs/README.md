# Spécifications - Galactic Dominion

Ce dossier contient les spécifications fonctionnelles et techniques pour chaque feature du projet, suivant la méthodologie **Spec-Driven Development**.

## 📂 Structure

Chaque feature possède son propre dossier numéroté :

```
specs/
├── 001-feature-name/
│   ├── spec.md          # Spécification fonctionnelle
│   ├── plan.md          # Plan d'implémentation technique
│   ├── research.md      # Recherches et comparaisons techniques
│   ├── data-model.md    # Modèles de données
│   ├── contracts/       # Contrats API/réseau
│   ├── quickstart.md    # Scénarios de validation
│   └── tasks.md         # Liste de tâches actionnables
├── 002-autre-feature/
└── ...
```

## 🔢 Numérotation

Les features sont numérotées séquentiellement (001, 002, 003...). La numérotation est automatique lors de l'utilisation de `/speckit.specify`.

## 🌿 Branches Git

Chaque spécification correspond à une branche git :
- `001-feature-name`
- `002-autre-feature`
- etc.

Pour travailler sur une spec, basculez sur sa branche :
```bash
git checkout 003-feature-name
```

## 📝 Workflow

1. **Créer une spec** : `/speckit.specify Description de la feature`
2. **Planifier** : `/speckit.plan Stack technique et architecture`
3. **Décomposer** : `/speckit.tasks`
4. **Implémenter** : `/speckit.implement`

## 📚 Voir Aussi

- [Guide Spec Kit complet](../SPEC_KIT_GUIDE.md)
- [Constitution du projet](../.specify/memory/constitution.md)
- [Architecture technique](../ARCHITECTURE.md)
