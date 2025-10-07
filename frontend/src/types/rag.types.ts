export interface ParagraphContext {
  text: string
  page: number
  paragraphNoTotal: number
}

export interface RagResponse {
  answer: string
  context: ParagraphContext[]
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  context?: ParagraphContext[]
}
