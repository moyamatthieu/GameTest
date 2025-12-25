/**
 * Script d'indexation du code dans Qdrant pour Roo Code
 * Usage: node dev-tools/index-codebase.js
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { QdrantClient } from '@qdrant/js-client-rest'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.join(__dirname, '..')

const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333'
const COLLECTION_NAME = 'jeux_gestion_codebase'

// Extensions de fichiers à indexer
const ALLOWED_EXTENSIONS = ['.js', '.json', '.md', '.html', '.css']

// Dossiers à ignorer
const IGNORED_DIRS = ['node_modules', 'dist', '.git', 'dev-tools/qdrant_storage']

/**
 * Parcourt récursivement les fichiers du projet
 */
function* walkDir(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true })

  for (const file of files) {
    const filePath = path.join(dir, file.name)
    const relativePath = path.relative(PROJECT_ROOT, filePath)

    // Ignorer certains dossiers
    if (file.isDirectory()) {
      if (IGNORED_DIRS.some(ignored => relativePath.includes(ignored))) {
        continue
      }
      yield* walkDir(filePath)
    } else {
      const ext = path.extname(file.name)
      if (ALLOWED_EXTENSIONS.includes(ext)) {
        yield { path: filePath, relativePath }
      }
    }
  }
}

/**
 * Découpe un texte en chunks de taille raisonnable
 */
function chunkText(text, maxChunkSize = 1000) {
  const lines = text.split('\n')
  const chunks = []
  let currentChunk = []
  let currentSize = 0

  for (const line of lines) {
    if (currentSize + line.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.join('\n'))
      currentChunk = [line]
      currentSize = line.length
    } else {
      currentChunk.push(line)
      currentSize += line.length + 1
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join('\n'))
  }

  return chunks
}

/**
 * Génère un embedding simple (à remplacer par un vrai modèle)
 * Pour un vrai usage, utiliser OpenAI, Cohere, ou un modèle local
 */
function generateSimpleEmbedding(text) {
  // Embedding factice de dimension 384 (taille commune)
  // En production, utiliser un vrai modèle d'embeddings
  const dim = 384
  const embedding = new Array(dim).fill(0)

  // Hash simple basé sur le contenu
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i)
    embedding[i % dim] += charCode
  }

  // Normalisation
  const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
  return embedding.map(val => val / (norm || 1))
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🚀 Démarrage de l\'indexation du code...')
  console.log(`📍 URL Qdrant: ${QDRANT_URL}`)

  // Connexion à Qdrant
  const client = new QdrantClient({ url: QDRANT_URL })

  try {
    // Vérifier la connexion
    const health = await client.api('cluster').clusterStatus()
    console.log('✅ Connexion à Qdrant établie')
  } catch (error) {
    console.error('❌ Impossible de se connecter à Qdrant:', error.message)
    console.log('💡 Assurez-vous que Qdrant tourne avec: docker-compose up -d')
    process.exit(1)
  }

  // Recréer la collection
  try {
    await client.deleteCollection(COLLECTION_NAME)
    console.log('🗑️  Collection existante supprimée')
  } catch (error) {
    // Collection n'existait pas, c'est OK
  }

  await client.createCollection(COLLECTION_NAME, {
    vectors: {
      size: 384,
      distance: 'Cosine'
    }
  })
  console.log(`✨ Collection "${COLLECTION_NAME}" créée`)

  // Indexer les fichiers
  let totalChunks = 0
  const points = []

  for (const { path: filePath, relativePath } of walkDir(PROJECT_ROOT)) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      const chunks = chunkText(content, 800)

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]
        const embedding = generateSimpleEmbedding(chunk)

        points.push({
          id: totalChunks,
          vector: embedding,
          payload: {
            file: relativePath,
            chunk_index: i,
            total_chunks: chunks.length,
            content: chunk,
            extension: path.extname(filePath)
          }
        })

        totalChunks++
      }

      console.log(`📄 ${relativePath} - ${chunks.length} chunks`)
    } catch (error) {
      console.warn(`⚠️  Erreur lecture ${relativePath}:`, error.message)
    }
  }

  // Uploader par batches
  const BATCH_SIZE = 100
  for (let i = 0; i < points.length; i += BATCH_SIZE) {
    const batch = points.slice(i, i + BATCH_SIZE)
    await client.upsert(COLLECTION_NAME, {
      wait: true,
      points: batch
    })
    console.log(`⬆️  Uploadé ${Math.min(i + BATCH_SIZE, points.length)}/${points.length} chunks`)
  }

  console.log(`\n✅ Indexation terminée!`)
  console.log(`📊 Total: ${totalChunks} chunks indexés`)
  console.log(`🌐 Qdrant UI: http://localhost:6333/dashboard`)
}

main().catch(console.error)
