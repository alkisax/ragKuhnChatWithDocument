/*
  2️⃣ ένα απλό standalone script που θα τρέξει μια φορα με npx και θα μου μετρίσει πχ πόσα διπλά enter ή tabs κλπ υπάρχουν ώστε να καταλάβω τι χρισιμοποιεί το αρχείο για να ορισει την παράγραφο το κεφάλαιο κλπ. Αυτό θα το χρησιμοποιήσω αργότερα για να σπάσω το εννιαίο κείμενο σε παραγραφους που θα τις κάνω mongo documents

  npx ts-node backend/src/pdfToTxt/detectParagraph.ts

  prev → backend\src\pdfToTxt\pdf_to_txt.ts
  next → backend\src\paragraphs\paragraph.models.ts
*/

import fs from 'fs'
import path from 'path'

// το file path του αρχείου pdf και του υπο δημιουργεία txt. Σε περίπτωση άλλου βιβλιου θα πρέπει να αλαχθει TODO → modular env
// Go two levels up from src/pdfToTxt to reach backend/uploads
const filePath = path.resolve(__dirname, '../../uploads/Quotations_from_Chairman_Mao_Tse-tung.txt')

const txt = fs.readFileSync(filePath, 'utf-8')

console.log({
  doubleNewlines: (txt.match(/\n\s*\n/g) || []).length, // /\n\s*\n/g βρίσκει όλα τα σημεία όπου υπάρχει μια κενή γραμμή ανάμεσα σε κείμενο
  tabCount: (txt.match(/\t/g) || []).length, //πόσες φορές εμφανίζεται ένας tab χαρακτήρας
  formFeeds: (txt.match(/\f/g) || []).length, // \f είναι ο χαρακτήρας “form feed”, που χρησιμοποιούν κάποια PDF ή εκτυπωτές για να δηλώσουν τέλος σελίδας.
  totalLines: txt.split('\n').length
})

// 🧠 Ανίχνευση πιθανών τίτλων / υποτίτλων
const lines = txt.split('\n')

const potentialTitles = lines.filter(line => {
  const trimmed = line.trim()

  // 1️⃣ Αγνόησε εντελώς άδειες γραμμές
  if (trimmed.length === 0) return false

  // 2️⃣ Αγνόησε πάρα πολύ μεγάλες γραμμές (μάλλον είναι παράγραφοι)
  if (trimmed.length > 80) return false

  // 3️⃣ Αν είναι ΟΛΟ κεφαλαία ή περιέχει "CHAPTER", "SECTION" κ.λπ.
  if (/^[A-Z\s\d.,:'"-]+$/.test(trimmed)) return true

  // 4️⃣ Αν τελειώνει με άνω κάτω τελεία (π.χ. “On Practice:”)
  if (/:$/.test(trimmed)) return true

  // 5️⃣ Αν περιέχει ρωμαϊκούς αριθμούς ή "Part I", "II", "III"
  if (/Part\s+[IVXLC]+/i.test(trimmed)) return true

  // 6️⃣ Αν ξεκινά με αριθμό και τελεία (π.χ. "1.", "2.")
  if (/^\d+\.\s+/.test(trimmed)) return true

  return false
})

console.log('\n🔎 Potential Titles Detected (first 10):')
console.log(potentialTitles.slice(0, 10))


/*
TODO
Θα μπορούσες τώρα:
να πάρεις το ίδιο regex που έπιασε τους τίτλους
να το ενσωματώσεις μέσα στο feedParagraphs.ts
ώστε κάθε παράγραφος να “κληρονομεί” τον πιο πρόσφατο τίτλο πάνω της.
*/