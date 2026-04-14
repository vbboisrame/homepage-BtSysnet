# Git — Guide de travail

---

## Branches

| Branche | Rôle |
|---|---|
| `main` | Version stable, déployée en production |
| `dev` | Développement en cours |

**Règle :** on ne travaille jamais directement sur `main`.
Tous les changements passent par `dev`, puis sont fusionnés dans `main`
quand la version est validée.

---

## Workflow quotidien

```bash
# S'assurer d'être sur dev
git checkout dev

# ... faire ses modifications dans VS Code ...

# Vérifier ce qui a changé
git status
git diff

# Ajouter les fichiers modifiés
git add .

# Créer un commit
git commit -m "Description courte de ce qui a changé"

# Pousser sur GitHub
git push origin dev
```

---

## Passer une version de dev → main (mise en production)

```bash
# 1. Basculer sur main
git checkout main

# 2. Fusionner dev dans main (avec un commit de merge explicite)
git merge --no-ff dev -m "Merge dev → main : description de la version"

# 3. Pousser main sur GitHub
git push origin main

# 4. Revenir sur dev pour continuer à travailler
git checkout dev
```

---

## Déployer sur la VM après un push

```bash
# Sur la VM (EVR-DEBDOCK-001)
cd ~/homepage-BtSysnet
git pull
docker compose up -d --build
```

Si `init.sql` a été modifié :

```bash
docker compose down -v && docker compose up -d --build
```

---

## Taguer une version stable

Les tags permettent de marquer un état précis de l'historique
et de retrouver facilement une version fonctionnelle.

```bash
# Créer un tag sur le commit actuel
git tag v1.0 -m "Première version stable"

# Pousser le tag sur GitHub
git push origin v1.0

# Lister les tags existants
git tag
```

---

## Revenir à une version précédente

```bash
# Voir l'historique des commits
git log --oneline

# Revenir à un tag spécifique (sans modifier l'historique)
git checkout v1.0

# Revenir au dernier commit de dev
git checkout dev
```

---

## Commandes utiles

```bash
# Voir sur quelle branche on est
git branch

# Voir l'état des fichiers modifiés
git status

# Voir les derniers commits
git log --oneline -10

# Annuler les modifications d'un fichier (avant commit)
git restore nom-du-fichier

# Voir les différences avant de committer
git diff
```
