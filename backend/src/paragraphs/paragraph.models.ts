/* 
  💥 η δουλειά του φακέλου paragraph είναι να παίρνει ένα text αρχείο να το σπάει σε παραγράφους και να μετατρέπει κάθε παράγραφο σε mongo document
  
  3️⃣
  ένα βασικό schema για να σώζωνται οι παράγραφοι μου στην mongo

  prev → backend\src\pdfToTxt\detectParagraph.ts
  next → backend\src\paragraphs\paragraph.dao.ts
*/

import mongoose from 'mongoose'
import type { ParagraphType } from './paragraph.types'

const paragraphSchema = new mongoose.Schema<ParagraphType>(
  {
    paragraphNo: { type: Number, required: true, unique: true },
    text: { type: String, required: true },
    vectors: { type: [Number], default: [] },
    page: { type: Number, required: false }
  },
  { timestamps: true }
)

export default mongoose.model<ParagraphType>('Paragraph', paragraphSchema)
