import { Box, Typography, Accordion, AccordionSummary, AccordionDetails } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import type { Message } from '../types/rag.types'

interface Props {
  message: Message
}

const MessageBubble = ({ message }: Props) => {
  const isUser = message.role === 'user'

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        my: 1,
      }}
    >
      <Box
        sx={{
          bgcolor: isUser ? '#816700ff' : '#333', // user = yellow, assistant = dark gray
          color: isUser ? '#000' : '#f5f5f5', // black text for user, light text for assistant
          px: 2,
          py: 1,
          borderRadius: 2,
          maxWidth: '80%',
          boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
        }}
      >
        <Typography variant='body1' sx={{ whiteSpace: 'pre-wrap', fontWeight: 500 }}>
          {message.content}
        </Typography>
        
        {/* 
        Το Accordion είναι ένα expandable container, δηλαδή ένα κουτί που: στην αρχή δείχνει μόνο έναν τίτλο (summary), και όταν το πατήσεις, ξεδιπλώνεται (expand) για να δείξει το περιεχόμενο του (details).
        Ένα Accordion έχει τρεις βασικές ενότητες:
        <Accordion>
          <AccordionSummary> ...ό,τι βλέπεις όταν είναι κλειστό... </AccordionSummary>
          <AccordionDetails> ...ό,τι εμφανίζεται όταν το ανοίξεις... </AccordionDetails>
        </Accordion>
        */}

        {!isUser && message.context && message.context.length > 0 && (
          <Accordion
            sx={{
              bgcolor: '#444', // darker accordion background to match dark theme
              boxShadow: 'none',
              mt: 1,
              borderRadius: 1,
              '&:before': { display: 'none' },
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#ffcc00' }} />}>
              <Typography variant='subtitle2' sx={{ color: '#ffcc00', fontWeight: 600 }}>
                Context paragraphs
              </Typography>
            </AccordionSummary>

            <AccordionDetails
              sx={{
                bgcolor: '#222',
                borderRadius: 1,
                color: '#eee',
              }}
            >
              {message.context.map((p, i) => (
                <Typography key={i} variant='body2' sx={{ mb: 1, color: '#ccc' }}>
                  <b style={{ color: '#ffcc00' }}>Paragraph  {p.paragraphNoTotal }</b>: {p.text}
                </Typography>
              ))}
            </AccordionDetails>
          </Accordion>
        )}
      </Box>
    </Box>
  )
}

export default MessageBubble
