/*
  5️⃣
  αυτή εδώ επανοριζει διάφορα πράγματα όπως dotenv.config() / mongoose.connect(MONGODB_URI) γιατι θα τρέξει ως ανεξάρτητο σκριπτ μια και μόνο φορά οπότε δεν έχει προσβαση στα υπόλοιπα →  npx ts-node scripts/feedParagraphs.ts

  prev → backend\src\paragraphs\paragraph.dao.ts
  next → backend\src\vectorise\gptEmbedingsParagraph.service.ts
*/

/*
 after run got:
    Administrator@WINDOWS-4ABEJ0B MINGW64 /d/coding/tractatus/backend (main)  
    $ npm run feed:kuhn
    > rag-backend@1.0.0 feed:kuhn
    > ts-node src/paragraphs/paragraphMongoFeeder.script.ts
    [dotenv@17.2.3] injecting env (13) from .env -- tip: 👥 sync secrets across teammates & machines: https://dotenvx.com/ops
    ✅ Connected to MongoDB
    ✅ Inserted 1050 paragraphs
    🔌 MongoDB connection closed
    Administrator@WINDOWS-4ABEJ0B MINGW64 /d/coding/tractatus/backend (main)  
*/
import mongoose from 'mongoose'
// filesystem
import fs from 'fs'
// creates a filepath που μπορεί να χρησιμοποιηθεί παρα τις διαφορές των διάφορων Os (πχ / vs \) πχ path.join('uploads', 'file.txt') ή path.resolve() turns relative paths into absolute ones,
import path from 'path'
import dotenv from 'dotenv'
import { createManyParagraphs } from './paragraph.dao'
import type { ParagraphType } from './paragraph.types'

dotenv.config() // αυτο μάλλον είναι περιτό μιας και το κάνουμε και στην app αλλά ας το αφήσω

const MONGODB_URI = process.env.MONGODB_URI as string
const txtPath = path.resolve(__dirname, '../../uploads/Kuhn-StructureOfScientificRevolutions_CLEAN.txt') // το file path του αρχείου σε περίπτωση άλλου βιβλιου θα πρέπει να αλαχθει TODO → modular env

// ούτε Input ούτε outpout είναι ένα σκριπτ που διαχωρίζει τις παραγράφους απο το txt αρχείο και τις μετατρέπει σε mongo documents χρησιμοποιόντας τα dao που έχουμε φτιάξει
// αν αργότερα ανεβάζαμε το αρχείο μέσο multer αυτή η συνάρτηση θα έπρεπε να μετατραπεί σε controller
async function feedParagraphs(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB') //αυτό νομίζω είναι περιτό μιας και το κάνει το backend\src\server.ts δεν ξέρω όμως

    // fs.readFileSync(...) Αυτή η μέθοδος σημαίνει “διάβασε το αρχείο συγχρονισμένα”: readFileSync → “sync” = synchronous = μπλοκάρει την εκτέλεση μέχρι να διαβαστεί όλο το αρχείο. Υπάρχει και readFile (χωρίς Sync) → ασύγχρονη εκδοχή με callback ή promise.
    // Το textPath το φτιάχνω λίγο παραπάνω
    // Αυτή είναι **συμαντική**
    const text = fs.readFileSync(txtPath, 'utf-8')
    const rawParagraphs = text  //είναι ένα τεράστιο string με όλο το περιεχόμενο του .txt
      .split(/\n\s*\n/) // \n → νέα γραμμή (Enter) \s* → μηδέν ή περισσότερα κενά (spaces, tabs) | \n → άλλη μια νέα γραμμή Άρα /\n\s*\n/ σημαίνει:“Χώρισε όπου υπάρχουν δύο ή περισσότερες γραμμές κενού.”
      .map(p => p.trim())
      .filter(p => p.length > 0) // αφαιρεί τυχόν άδειες γραμμές

    // το docs είναι ένα array που προκείπτει απο το map που μου τα φτιάχνει στην μορφή του schema μου (με άδειο vector που θα προστεθέι αργότερα)
    const docs: ParagraphType[] = rawParagraphs.map((p, i) => ({
      paragraphNo: i + 1, // αύξων index
      text: p,
      vectors: []
    }))

    const inserted = await createManyParagraphs(docs)
    console.log(`✅ Inserted ${inserted.length} paragraphs`)
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('❌ Error feeding paragraphs:', error.message)
    } else {
      console.error('❌ Unknown error during feeding')
    }
  } finally {
    await mongoose.disconnect()
    console.log('🔌 MongoDB connection closed')
  }
}

feedParagraphs()
