/*
  🔟 routes

  prev → backend\src\vectorise\gptEmbedingsParagraph.routes.ts
  next → backend\src\rag\gptRagParagraph.controller.ts
*/

import axios from 'axios'

// input: string | output: string
// αυτή εδώ είναι η κεντρική σύνδεση για τον gpt wraper. Κάνουμε ένα post(url,parameters,auth) όπου μέσα στους parameters βρίσκετε το prompt μου. Το prompt (που στην rag περίπτωσή μας περιλαμβάνει και το context που έχει προκύψει απο την cosine similarity search το φτιάχνουμε παρακάτω) 
export const getGPTResponse = async (
  prompt: string,
  apiKey: string
): Promise<string> => {
  const url = 'https://api.openai.com/v1/chat/completions'

  try {
    const response = await axios.post(
      url,
      {
        model: 'gpt-3.5-turbo', 
        messages: [{ role: 'user', content: prompt }]
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    )

    // μορφή του json response στο τέλος
    return response.data.choices[0].message.content
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown GPT error'
    throw new Error(`Error fetching GPT response: ${msg}`)
  }
}

/*
η επιστροφή του json response απο το openAi api είναι της μορφής

{
  "id": "chatcmpl-8XYZaBc123",
  "object": "chat.completion",
  "created": 1720000000,
  "model": "gpt-3.5-turbo",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "This is the AI's answer to your prompt."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 14,
    "completion_tokens": 8,
    "total_tokens": 22
  },
  "system_fingerprint": "fp_abc123"
}

για αυτό κρατάμε
return response.data.choices[0].message.content
*/
