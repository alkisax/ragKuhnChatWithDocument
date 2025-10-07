/*
  💥 Η δουλειά του φακέτου pdf_to_text είναι να πέρνει ένα Pdf και να εξάγει ένα .txt. Μας βοηθάει ακόμα να εντοπίσουμε την μορφή αυτού του txt αρχείου
  
  1️⃣ μετατροπή απο pdf σε txt
  Δεν είναι του κλασικού μοντέλου dao/controller/routes (οπως και το επόμενο αρχείο) αυτα είναι scripts που κάνουν μια δουλειά προεργασίας στο κειμενό μου και τρέχουν μόνο μια φορα με npm απο το cli. Αν αυτα ήταν μέρος μιας διαδικασίας όπου ο χρήστης ανεβάζει αρχεία με multer θα έπρεπε να αλάξει η δομή και να γίνουν controller. Ακομα είναι standalone αρχεια και θα έπρεπε να φορτωθούν πράγματα απο την αρχή πχ dotenv.config()

  next → backend\src\pdfToTxt\detectParagraph.ts
*/

import fs from 'fs'
import path from 'path'
// βιβλιοθήκη για Pdf
import pdf from 'pdf-parse'

// το file path του αρχείου pdf και του υπο δημιουργεία txt. Σε περίπτωση άλλου βιβλιου θα πρέπει να αλαχθει TODO → modular env
const inputPath = path.resolve(__dirname, '../../uploads/Quotations_from_Chairman_Mao_Tse-tung.pdf')
const outputPath = path.resolve(__dirname, '../../uploads/Quotations_from_Chairman_Mao_Tse-tung.txt')

// κανένα input ή outpout είναι ένα standalone cli script
async function convertPdfToTxt(): Promise<void> {
  try {
    // όταν διαβάζουμε αρχεία γενικά αυτά βρήσκονται στην μορφή buffer (01)
    // fs.readFileSync(...) Αυτή η μέθοδος σημαίνει “διάβασε το αρχείο συγχρονισμένα”: readFileSync → “sync” = synchronous = μπλοκάρει την εκτέλεση μέχρι να διαβαστεί όλο το αρχείο. Υπάρχει και readFile (χωρίς Sync) → ασύγχρονη εκδοχή με callback ή promise.
    // Το inputPath το φτιάχνω λίγο παραπάνω
    // Αυτή είναι **συμαντική**
    const dataBuffer = fs.readFileSync(inputPath)

    // η συνταξη είναι λίγο παράξενη. Σθνήθος έχουμε `const func = () => {}. Εδω παίρνουμε την pdf (που είναι ήδη μια συνάρτηση που την πείραμε με import παραπάνω) και απλώς της αλλάζουμε το όνομα σε parsePdf αλλά ορίζοντας τα input και output types. Βασικα η επόμενη γραμμη εξυπηρετη την TS
    const parsePdf = (pdf as unknown as (data: Buffer) => Promise<{ text: string }>)

    // το input είναι buffer (δηλ ένα τεράστιο αρχείο απο 01) και το output είναι ένα obj της μορφής { text }. Δηλ τελικά το data έχει ένα τεράστειο ενιαίο κείμενο με όλο το κείμενο του pdf που δώσαμε
    const data = await parsePdf(dataBuffer)

    // αποθέτω όλο το data.text σε ένα txt αρχείο στο Path που όρισα στην αρχή
    fs.writeFileSync(outputPath, data.text, { encoding: 'utf-8' })
    console.log('✅ PDF successfully converted to TXT:', outputPath)
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('❌ Error converting PDF to TXT:', error.message)
    } else {
      console.error('❌ Unknown error during conversion')
    }
  }
}

// επειδή είναι σκριπτ την καλώ και μια στο τέλος για να τρέξει
convertPdfToTxt()
