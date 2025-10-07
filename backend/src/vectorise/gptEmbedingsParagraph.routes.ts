/*
  9️⃣ routes

  prev → backend\src\vectorise\gptEmbedingsParagraph.routes.ts
  next → backend\src\rag\gptRag.service.ts
*/

import express from 'express'
import { gptEmbedingsParagraphController } from './gptEmbedingsParagraph.controller'

const router = express.Router()

// GET /api/vectorise/search?query=...
router.get('/search', gptEmbedingsParagraphController.searchHandler)

// POST /api/vectorise/embed
router.post('/embed', gptEmbedingsParagraphController.embedHandler)

export default router
