/*
  4️⃣
  prev → backend\src\pdfToTxt\detectParagraph.ts 
  next → backend\src\paragraphs\paragraphMongoFeeder.script.ts
*/

import Paragraph from './paragraph.models'
import type { ParagraphType } from './paragraph.types'
import { ValidationError } from '../utils/error/errors.types'

// input paragraphNo, paragraph text - export mongo document
export const createParagraph = async (data: Partial<ParagraphType>): Promise<ParagraphType> => {
  if (typeof data.paragraphNo !== 'number' || !data.text) {
    throw new ValidationError('paragraphNo and text are required')
  }

  const paragraph = new Paragraph(data)
  return await paragraph.save()
}

export const createManyParagraphs = async (paragraphs: ParagraphType[]): Promise<ParagraphType[]> => {
  if (!paragraphs.length) {
    throw new ValidationError('Paragraph list is empty')
  }

  return await Paragraph.insertMany(paragraphs, { ordered: false })
}
