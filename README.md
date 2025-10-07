# 🧠 KuhnGPT — Chat with *The Structure of Scientific Revolutions*

**A Retrieval-Augmented Generation (RAG) app built with TypeScript and the MERN stack**

> “Each paradigm shift changes not only what scientists see but also how they see it.”  
> — Thomas S. Kuhn, *The Structure of Scientific Revolutions* (1962)

---

## 📘 Overview

**KuhnGPT** lets you have a conversation with Thomas Kuhn’s *The Structure of Scientific Revolutions* using a custom Retrieval-Augmented Generation pipeline.  
The system indexes every paragraph of the book, vectorizes it using OpenAI embeddings, and allows the user to query and receive grounded answers with cited excerpts.

This project is an educational and portfolio demonstration of a **complete MERN + AI stack** application combining:

- 🧩 **MongoDB** – paragraph storage and embeddings  
- ⚙️ **Express + Node.js** – backend API and RAG logic  
- 🧠 **OpenAI** – semantic embeddings + GPT contextual responses  
- 💬 **React + MUI** – chat interface with expandable source context  
- 🧾 **TypeScript** – strict typing across backend and frontend  

---

## 🚀 Features

- **Retrieval-Augmented Generation** (RAG) over a full book corpus  
- **Semantic search** using `text-embedding-3-small` (OpenAI)  
- **Context-aware GPT answers** with paragraph citations  
- **Basic memory** — includes the last few turns of dialog for continuity  
- **Dark-themed chat UI** built with React + Material UI  
- **Standalone preprocessing scripts** for feeding and vectorizing texts  
- **Mongo persistence** with progress tracking for long operations  

---

**Flow of data**

1. 🧾 `Kuhn-StructureOfScientificRevolutions_CLEAN.txt`  
   → split into ~1050 paragraphs → stored in MongoDB.  
2. 🧮 Each paragraph vectorized via OpenAI embeddings.  
3. 🔍 Query → embedding → cosine similarity search.  
4. 🧠 GPT model receives top N paragraphs as *context*.  
5. 💬 React frontend displays the answer + expandable context.

---

## ⚙️ Tech Stack

| Layer          | Technologies                                           |
|----------------|--------------------------------------------------------|
| **Frontend**   | React (Vite) · TypeScript · MUI · Axios                |
| **Backend**    | Node.js · Express · TypeScript                         |
| **Database**   | MongoDB Atlas (Mongoose ORM)                           |
| **AI / NLP**   | OpenAI API (`text-embedding-3-small`, `gpt-3.5-turbo`) |
| **Utilities**  | dotenv · axios · uuid · ts-node-dev                    |
| **Deployment** | Render (backend) + Vercel (frontend)                   |

---

## 🧮 Setup

### 1️⃣ Clone and install
```bash
git clone https://github.com/alkisax/ragTractatusChatWithDocument.git
cd backend && npm install
cd ../frontend && npm install
```

### 2️⃣ Environment variables
Create `backend/.env`:
```env
MONGODB_URI=your_mongo_connection_string
OPENAI_API_KEY=your_openai_key
BACK_END_PORT=3001
```


## 🛠️ Scripts

| Script | Description |
|--------|--------------|
| `npm run detect:kuhn` | Analyze `.txt` structure (paragraph detection) |
| `npm run feed:kuhn` | Feed paragraphs into MongoDB |
| `npm run vectorize:kuhn` | Generate embeddings for all paragraphs |
| `npm run dev` | Start backend server |

---

## 🧑‍💻 Author

**Pelopidas Kopakakis**  
- GitHub: [alkisax](https://github.com/alkisax)  
- LinkedIn: [Pelopidas Kopakakis](https://www.linkedin.com/in/pelopidas-kopakakis/)  
- Email: pelopidas.kopakakis@gmail.com  

