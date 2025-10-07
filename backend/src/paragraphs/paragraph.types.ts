import { Types } from 'mongoose'

export interface ParagraphType {
  _id?: Types.ObjectId
  paragraphNo: number
  text: string
  vectors: number[] // will stay empty for now
  page?: number     // optional: if later you want to group by page
  createdAt?: Date
  updatedAt?: Date
}
