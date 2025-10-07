import express from 'express'
import { gptRagParagraphController } from './gptRagParagraph.controller'

const router = express.Router()

// POST /api/rag/ask
router.post('/ask', gptRagParagraphController.askWithContext)

export default router
