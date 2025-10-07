/*
  σχόλια για όλο το front:
  εχουμε 2 βασικά components:
    chat cntainer: η handleAsk κάνει axios.post<RagResponse>(`${backendUrl}/api/rag/ask`, { query })
    και κάνει render το background το βασικό κουτι και το κουτί διαλόγου
    MessageBubble: μου κάνει render τα στοιχεία του διαλόγου (και το expandable με τις πηγές)
    ( το RagChat είναι ένα δοκιμαστικό αρχείο που δεν καλείτε κάπου )
*/

import { useState } from 'react'
import { Box, TextField, Button, CircularProgress, Typography, ThemeProvider, createTheme } from '@mui/material'
import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'
import MessageBubble from './components/MessageBubble'
import { VariablesProvider, useVariables } from './context/VariablesContext'
import type { Message, RagResponse } from './types/rag.types'
import copernicusRobot from './assets/copernicusRobot.png'

// 🌙 Define dark theme
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    primary: {
      main: '#ffcc00', // yellowish tone
    },
  },
  typography: {
    allVariants: {
      color: '#fff',
    },
  },
})

const ChatContainer = () => {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const { backendUrl } = useVariables()

  const handleAsk = async () => {
    if (!query.trim()) return
    const userMsg: Message = { id: uuidv4(), role: 'user', content: query }
    setMessages(prev => [...prev, userMsg])  // Γιατί δεν γράφουμε setMessages([...messages, userMsg]) Αν το κάναμε έτσι, θα υπήρχε κίνδυνος να χάσεις state: σε async συναρτήσεις ή πολλές ταυτόχρονες ενημερώσεις, η μεταβλητή messages μπορεί να έχει “παλιά” τιμή (stale closure).
    setLoading(true)
    setQuery('')

    try {
      // με αυτό το call δεν είχαμε μνήμη. κάθε pprompt ηταν απομονωμένο
      // const res = await axios.post<RagResponse>(`${backendUrl}/api/rag/ask`, { query })

      // στέλνω μαζί με το prompt και τις τελευταιες 4 ερωτήσεις και απαντήσεις
      // θα χρειαστούν αλαγές και στο gptRagParagraph.controller.ts
      // TODO αργότερα θα μπορούσα να στέλνω και ένα summirise όλων των προηγούμενων
      const history = messages.slice(-4).map(m => ({ role: m.role, content: m.content }))
      const res = await axios.post<RagResponse>(`${backendUrl}/api/rag/ask`, { query, history })
      const { answer, context } = res.data
      const assistantMsg: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: answer.trim(),
        context,
      }
      setMessages(prev => [...prev, assistantMsg])  // δύο set messages. Στην πρώτη θέλουμε να εμφανιστεί το μύνημα του χρίστη και ένας loader. και μετα οταν έρθει η απάντηση να αντικατασταθεί ο loader απο την απάντηση
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        py: 4,
      }}
    >
      {/* Logo + Title */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <img
          src={copernicusRobot}
          alt="kuhnGPT"
          style={{
            width: '180px',
            borderRadius: '12px',
            marginBottom: '12px',
          }}
        />
        <Typography
          variant="h3"
          sx={{
            color: '#ffcc00',
            fontWeight: 'bold',
            letterSpacing: 2,
          }}
        >
          kuhnGPT
        </Typography>
      </Box>

      {/* Chat */}
      <Box sx={{ width: '90%', maxWidth: 700 }}>
        <Box
          sx={{
            mb: 3,
            height: '60vh',
            overflowY: 'auto',
            border: '1px solid #333',
            borderRadius: 2,
            p: 2,
            bgcolor: 'background.paper',
          }}
        >
          {messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {loading && <CircularProgress size={24} sx={{ display: 'block', mx: 'auto', my: 2 }} />}
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            label="Ask about Kuhn's Structure of scientific revolutions..."
            variant="filled"
            value={query}
            onChange={e => setQuery(e.target.value)}
            sx={{
              bgcolor: '#2a2a2a',
              borderRadius: 1,
            }}
            slotProps={{
              inputLabel: { style: { color: '#bbb' } },
              input: { style: { color: 'white' } }
            }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleAsk}
            disabled={loading}
            sx={{ fontWeight: 'bold' }}
          >
            Send
          </Button>
        </Box>
      </Box>
    </Box>
  )
}


// πολύ ασχημο, δεν πειράζει
const App = () => (
  <ThemeProvider theme={darkTheme}>
    <VariablesProvider>
      <ChatContainer />
    </VariablesProvider>
  </ThemeProvider>
)

export default App
