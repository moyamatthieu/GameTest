#!/bin/bash

# Nom du fichier de sortie
OUTPUT_FILE="workspace_export.txt"

# Supprimer le fichier s'il existe déjà
rm -f "$OUTPUT_FILE"

echo "Génération de $OUTPUT_FILE..."

# Construction de la liste des fichiers
echo "Utilisation de find pour lister les fichiers du projet..."
# Liste des extensions à inclure
EXTENSIONS=("ts" "json" "md" "html" "css")

# Construction de la commande find
FIND_CMD="find . -type f"

# Exclure les dossiers inutiles
EXCLUDES=("-path '*/node_modules/*'" "-path '*/.git/*'" "-path '*/dist/*'" "-path '*/build/*'" "-path '*/.vscode/*'" "-path '*/.roo/*'")

for exc in "${EXCLUDES[@]}"; do
    FIND_CMD+=" ! $exc"
done

# Ajouter les filtres d'extension
FIND_CMD+=" \( "
first=true
for ext in "${EXTENSIONS[@]}"; do
    if [ "$first" = true ]; then
        FIND_CMD+="-name '*.$ext'"
        first=false
    else
        FIND_CMD+=" -o -name '*.$ext'"
    fi
done
FIND_CMD+=" \)"

# Exclure package-lock.json et le fichier d'export lui-même
FIND_CMD+=" ! -name 'package-lock.json'"
FIND_CMD+=" ! -name '$OUTPUT_FILE'"

FILES=$(eval "$FIND_CMD")


# Traiter chaque fichier
echo "$FILES" | sort | while read -r file; do
    [ -z "$file" ] && continue
    echo "Ajout de : $file"
    echo "================================================================================" >> "$OUTPUT_FILE"
    echo "FILE: $file" >> "$OUTPUT_FILE"
    echo "================================================================================" >> "$OUTPUT_FILE"
    cat "$file" >> "$OUTPUT_FILE"
    echo -e "\n\n" >> "$OUTPUT_FILE"
done

echo "Terminé ! Le code a été exporté dans $OUTPUT_FILE"
