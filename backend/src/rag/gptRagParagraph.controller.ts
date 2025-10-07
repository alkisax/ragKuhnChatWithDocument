/*
  1️⃣1️⃣ μου δημιουργεί το prompt με το context και καλεί την συνδεση με το openAI

  prev → backend\src\rag\gptRag.service.ts
  next → backend\src\rag\gptRagParagraph.routes.ts και μετά frontend
*/

import type { Request, Response } from 'express'
import dotenv from 'dotenv'
import { semanticSearchParagraphs } from '../vectorise/gptEmbedingsParagraph.service'
import { getGPTResponse } from './gptRag.service'

dotenv.config() // αυτό μάλλον δεν χρειάζετε μιας και δεν είναι standalone script αλλα κανονικός controller

const askWithContext = async (req: Request, res: Response) => {
  try {
    // η ερώτηση string απο το front // προστέθηκε να έρχετε και ένα μικρό ιστορικό των τελευταίων 4 ερωτοαπαντήσεων για να αποκτήσει λίγη μνήμη
    const { query, history } = req.body 
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ status: false, message: 'Missing query text' })
    }

    // διαμόρφωση του ιστορικού
    const chatHistory = Array.isArray(history)
      ? history.map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`).join('\n')
      : ''

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return res.status(500).json({ status: false, message: 'OPENAI_API_KEY not set' })
    }

    // 1️⃣ retrieve top 5 similar paragraphs
    const topParagraphs = await semanticSearchParagraphs(query, 5)

    // 2️⃣ build context string
    const context = topParagraphs
      .map(
        (p: { paragraphNo: number; text: string }, i: number) => `Excerpt ${i + 1} (Paragraph ${p.paragraphNo}):\n${p.text.trim()}`
      )
      .join('\n\n')

    // 3️⃣ construct full prompt
    const prompt = `
      You are a philosophy of science assistant specializing in Thomas Kuhn's *The Structure of Scientific Revolutions*.

      Recent conversation:
      ${chatHistory}

      Use the following excerpts as factual context to answer the user's question.
      Stay faithful to Kuhn’s terminology (paradigm, normal science, anomalies, crisis, revolution).
      Do not add external commentary or modern reinterpretations — base your answer strictly on the provided text.

      Context:
      ${context}

      Question:
      ${query}

      Answer:
    `.trim()

    // console.log(prompt)

    // 4️⃣ call OpenAI
    const gptAnswer = await getGPTResponse(prompt, apiKey)

    return res.json({
      status: true,
      question: query,
      answer: gptAnswer,
      context: topParagraphs
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return res.status(500).json({ status: false, message: msg })
  }
}

export const gptRagParagraphController = {
  askWithContext
}
