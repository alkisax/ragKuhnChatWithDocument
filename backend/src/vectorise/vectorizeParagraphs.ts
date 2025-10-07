/*
  8️⃣ Aαυτό είναι ένα standalone script που θα μου προσθέσει vector σε όλα τα mongo documents στο dield Που ήδη έχουν

  npx ts-node backend/src/vectorise/vectorizeParagraphs.ts

  prev → backend\src\vectorise\gptEmbedingsParagraph.controller.ts
  next → backend\src\vectorise\gptEmbedingsParagraph.routes.ts 
*/

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import axios from 'axios'
import fs from 'fs'
import path from 'path'
import Paragraph from '../paragraphs/paragraph.models'
import type { ParagraphType } from '../paragraphs/paragraph.types'

dotenv.config() // είμαστε σε standalone script τα φορτώνουμε όλα απο την αρχή

const MONGODB_URI = process.env.MONGODB_URI as string
const OPENAI_API_KEY = process.env.OPENAI_API_KEY as string
const MODEL = 'text-embedding-3-small' // απλώς ένα string για να το βάλουμε στο req του openAi
const PROGRESS_FILE = path.resolve(__dirname, 'vectorize.progress.json')

// αυτή εδώ είναι ιδια με την συνάρτηση στο backend\src\vectorise\gptEmbedingsParagraph.service.ts αλλά μιας και είμαστε σε standalone script ας μήνει ξανά εδώ
const getEmbedding = async (text: string): Promise<number[]> => {
  const url = 'https://api.openai.com/v1/embeddings'
  const response = await axios.post(
    url,
    { model: MODEL, input: text },
    {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  )
  // εξήγηση του obj που επιστρέφετε στο τέλος
  return response.data.data[0].embedding
}

// η resolve καλεί τον εαυτό της μετά απο timeout. οποτε η sleep(200) πχ απλώς παρεμβάλει μικρά κενα
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

interface Progress {
  completedIds: string[]
}

const loadProgress = (): Progress => {
  if (fs.existsSync(PROGRESS_FILE)) {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8')) as Progress
  }
  return { completedIds: [] }
}

const saveProgress = (progress: Progress) => {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), 'utf-8')
}

// αυτή είναι η κεντρική συνάρτηση εδω
async function vectorizeAllParagraphs(): Promise<void> {
  await mongoose.connect(MONGODB_URI) // είμαστε σε standalone
  console.log('✅ Connected to MongoDB')

  const progress = loadProgress()
  // Θέλουμε να φέρουμε μόνο τα Mongo documents από τη συλλογή Paragraph: που δεν έχουν ακόμη vectors και που δεν έχουν ήδη ολοκληρωθεί (σύμφωνα με το αρχείο προόδου vectorize.progress.json)
  const paragraphs: ParagraphType[] = await Paragraph.find({
    _id: { $nin: progress.completedIds }, //$nin σημαίνει “not in”
    vectors: { $size: 0 } //Αν vectors είναι άδειο array []
  })

  const total = paragraphs.length
  console.log(`🟦 Found ${total} paragraphs left to vectorize`)

  let done = 0

  for (const p of paragraphs) {
    try {
      if (!p._id) {
        console.warn(`⚠️ Paragraph missing _id, skipping...`)
        continue
      }

      let cleanText = p.text
        .replace(/\r/g, '')              // remove carriage returns
        .replace(/-\n/g, '')             // fix hyphenated line breaks
        .replace(/\n+/g, ' ')            // flatten newlines
        .replace(/[^\S\r\n]+/g, ' ')     // normalize spaces
        .trim();

      if (!cleanText) {
        console.warn(`⚠️ Empty after cleaning paragraph ${p.paragraphNo}, skipping...`);
        progress.completedIds.push(String(p._id));
        saveProgress(progress);
        continue;
      }

      const vector = await getEmbedding(cleanText) // sends ONE paragraph to OpenAI
      await Paragraph.findByIdAndUpdate(p._id, { vectors: vector }) // προσθέτει το vector

      progress.completedIds.push(String(p._id))
      saveProgress(progress)
      done++

      const percent = ((done / total) * 100).toFixed(1)
      process.stdout.write(`\r📈 Progress: ${done}/${total} (${percent}%)`)

      await sleep(200) // small delay to avoid rate limits
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error(`\n❌ Error at paragraph ${p.paragraphNo}: ${message}`)
      break
    }
  }


  console.log(`\n🎯 Finished vectorizing ${done}/${total} paragraphs`)
  await mongoose.disconnect()
  console.log('🔌 MongoDB connection closed')
}

vectorizeAllParagraphs()


/*
  εξήγηση του: return response.data.data[0].embedding

  Αν στείλεις:
  {
    "model": "text-embedding-3-small",
    "input": "Mao Tse-tung thought"
  }

  τότε το API απαντά κάπως έτσι:
  {
    "object": "list",
    "data": [
      {
        "object": "embedding",
        "index": 0,
        "embedding": [0.0123, -0.0456, 0.0789, ...] 
      }
    ],
    "model": "text-embedding-3-small",
    "usage": {
      "prompt_tokens": 5,
      "total_tokens": 5
    }
  }

  Επομένως...
  response.data
  είναι όλο αυτό το JSON αντικείμενο.
  response.data.data
  είναι ο πίνακας data: [ { … } ].
  response.data.data[0]
  είναι το πρώτο στοιχείο του πίνακα — δηλαδή το embedding για το πρώτο input.
  response.data.data[0].embedding
  είναι το πραγματικό διάνυσμα αριθμών (number[]), που θέλεις να αποθηκεύσεις στο Mongo.
*/