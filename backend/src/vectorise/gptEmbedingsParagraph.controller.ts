/*
  7️⃣ δύο controller συναρτήσεις. searchHandler που κάνει όλη την διαχείρησης της ερώτησης (vectorise, cosine search, απάντηση Ν κοντινότερων) και embedHandler για να κάνω vector την DB μου

  prev → backend\src\vectorise\gptEmbedingsParagraph.controller.ts
  next → backend\src\vectorise\gptEmbedingsParagraph.routes.ts
*/

import type { Request, Response } from 'express'
import { gptEmbedingsService } from './gptEmbedingsParagraph.service'


// 1. GET /api/vectorise/search?query=...
const searchHandler = async (req: Request, res: Response) => {
  try {
    // αν GET /api/vectorise/search?query=mao
    // τότε:
    // req.query = {
    //   query: 'mao'
    // }
    // οπότε req.query.query
    const q = req.query.query
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ status: false, message: 'Missing query' })
    }

    // μου κάνει vector την ερώτηση, κάνει cosine similarity search και μου επιστρέφει τις 5 πιο κοντινες νοηματικά παραγράφους. Aυτό που θα μου επιστραφεί τελικά θα είναι ένα json obj με { paragraphNo, text, score }
    const results = await gptEmbedingsService.semanticSearchParagraphs(q, 5)
    return res.json({ status: true, data: results })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return res.status(500).json({ status: false, message: msg })
  }
}

// αυτή είναι μια κάπως "μιας χρήσης" συνάρτηση που μου κάνει vector ένα κείμενο. Εινε "μίας χρήσης" για θα τρέξει μόνο μια φορά σε κάποιο script για να μου κάνει vectorise συνολικά την βάση δεδομένων
// 2. POST /api/vectorise/embed
const embedHandler = async (req: Request, res: Response) => {
  try {
    const { text } = req.body
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ status: false, message: 'Missing text' })
    }

    const vector = await gptEmbedingsService.getEmbedding(text)
    return res.json({ status: true, vector })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return res.status(500).json({ status: false, message: msg })
  }
}

export const gptEmbedingsParagraphController = {
  searchHandler,
  embedHandler
}

