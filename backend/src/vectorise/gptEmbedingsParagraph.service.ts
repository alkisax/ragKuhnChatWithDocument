/*
  💥Η δουλειά του φακέλου vectorize είναι να προσθέσει vector στο field vector[] των mongo documents μου μέσο openAI.
  Αυτα δεν είναι πια standalone scripts αλλα μέρος του σχετικού endpoint. και ο λόγος είναι οτι το ερωτημα που θα έρχεται απο το front πρέπει και αυτό να γίνει vectorise

  6️⃣ εδώ βρίσκονται 3 συμαντικές συναρτήσεις. Η getEmbedding που μου μετατρέπει ένα κείμενο σε vector. Η cosineSimilarity και η semanticSearchParagraphs

  prev → backend\src\paragraphs\paragraphMongoFeeder.script.ts
  next → backend\src\vectorise\gptEmbedingsParagraph.controller.ts
*/

import axios from 'axios'
import Paragraph from '../paragraphs/paragraph.models'
import type { ParagraphType } from '../paragraphs/paragraph.types'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY as string

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

// input: string | outpout: vector[]
const getEmbedding = async (text: string): Promise<number[]> => {
  const url = 'https://api.openai.com/v1/embeddings'
  const response = await axios.post(
    url,
    { model: 'text-embedding-3-small', input: text },
    {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  )
  return response.data.data[0].embedding
}

// αυτός είναι ο μαθηματικός τύπος. το παίρνεις απλως copy paste
const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  const dot = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0)
  const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0))
  const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0))
  return dot / (normA * normB)
}

// input: η ερώτηση μας και πόσες απαντήσεις θέλουμε
export const semanticSearchParagraphs = async (query: string, topN = 5) => {

  // κάνουμε vector το ερώτημά μας
  const queryVector = await getEmbedding(query)

  // Fetch only fields we need
  const paragraphs = await Paragraph.find(
    { vectors: { $exists: true, $ne: [] } },
    { paragraphNo: 1, text: 1, vectors: 1 }
  ).lean<ParagraphType[]>()

  // remove junk before scoring
  // μας έβγαζε λάθος προτάσεις γιατί το Parse δεν είχε γίνει καλά. Όπως "The Structure of Scientific Revolutions" "The Nature and Necessity of Scientific Revolutions" "Revolutions in science, 6-8, 92-98, 101-2" που ήταν τίτλοι σελιδών υποσημειώσεις κλπ. Για αυτό πριν στήλουμε τις παραγράφους για σύγγριση περνάμε ένα ακόμα φίλτρο
  const cleanParagraphs = paragraphs.filter(p =>
    p.text.length > 50 &&  //κόβει πολύ μικρά αποσπάσματα
    !/^\d+(\s|$)/.test(p.text) && // /^\d+(\s|$)/. ^ αρχή string → μετά \d+ ένα ή περισσότερα ψηφία → μετά (\s|$) είτε κενό είτε τέλος γραμμής. Πιάνει πράγματα τύπου '10', '42 ' κ.λπ. (π.χ. αριθμούς σελίδων στην αρχή).
    !/^(contents|index|references)/i.test(p.text) &&
    !/^(the\sstructure|the\sname|revolutions\s?in\s?science)/i.test(p.text)
  )

  // αυτό που θα μου επιστραφεί τελικά θα είναι ένα json obj με { paragraphNo, text, score }
  const ranked = cleanParagraphs
    .map(p => ({
      paragraphNo: p.paragraphNo,
      text: p.text,
      score: cosineSimilarity(queryVector, p.vectors!)
    }))
    .sort((a, b) => b.score - a.score)

  // Only keep the 5 best
  return ranked.slice(0, topN)
}

export const gptEmbedingsService ={
  getEmbedding,
  cosineSimilarity,
  semanticSearchParagraphs
}
