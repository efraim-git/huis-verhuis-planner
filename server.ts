import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '1mb' }));

function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

app.post('/api/ai/assist', async (req, res) => {
  try {
    const { question, lang, context } = req.body ?? {};
    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({
        error: lang === 'en' ? 'Please enter a question.' : 'Vul eerst een vraag in.',
      });
    }

    const ai = getAiClient();
    if (!ai) {
      return res.status(503).json({
        error:
          lang === 'en'
            ? 'AI service is not configured. Please add GEMINI_API_KEY in Settings > Secrets.'
            : 'De AI-assistent is nog niet geconfigureerd. Controleer GEMINI_API_KEY bij Instellingen > Secrets.',
      });
    }

    const isEnglish = lang === 'en';
    const systemInstruction = isEnglish
      ? `You are a practical, expert Dutch home-buying and moving advisor ("Huis & Verhuis Planner").
Explain Dutch housing procedures clearly in English while keeping standard Dutch terms where helpful (e.g., Koopovereenkomst, Kosten Koper, Eindinspectie, Notaris, BRP-inschrijving, Overdrachtsbelasting, Waarborgsom).
Keep the main answer concise (2-4 short paragraphs or bullet points, max ~180 words) and actionable.
Also suggest 1 to 3 concrete checklist tasks that the homeowner can add directly to their planner, choosing the best matching phaseId:
- "fase-1": Signing & Reflection period (Koopovereenkomst & Bedenktijd)
- "fase-2": Mortgage & Valuation (Hypotheek & Taxatie)
- "fase-3": Preparation & Utilities (Voorbereiding & Nutsvoorzieningen)
- "fase-4": Transfer & Notary (De Overdracht & Notaris)
- "fase-5": Moving & Address Changes (Verhuizing & Adreswijzigingen)`
      : `Je bent een deskundige, praktische adviseur voor huizenkopers en verhuizers in Nederland ("Huis & Verhuis Planner").
Geef helder, concreet advies afgestemd op de Nederlandse woningmarkt en wetgeving (bijv. wettelijke 3 dagen bedenktijd, ontbindende voorwaarden, NWWI-taxatie, notaris/nota van afrekening, eindinspectie, BRP-inschrijving, VvE/MJOP).
Houd het antwoord overzichtelijk en praktisch (maximaal ~180 woorden, gebruik korte alinea's of opsommingstekens).
Stel daarnaast 1 tot 3 concrete actietaken voor die de gebruiker met één tik aan zijn checklist kan toevoegen, met de juiste phaseId:
- "fase-1": Koopovereenkomst & Bedenktijd (Direct na aankoop)
- "fase-2": Hypotheek & Taxatie (Week 1 – 4)
- "fase-3": Voorbereiding & Nutsvoorzieningen (4 – 6 weken voor overdracht)
- "fase-4": De Overdracht & Notaris (Week van de sleuteloverdracht)
- "fase-5": Verhuizing & Adreswijzigingen (Na sleuteloverdracht)`;

    const contextSummary = context
      ? `\n\nHuidige voortgang van de gebruiker: ${context.completionPercent ?? 0}% afgerond.${
          context.upcomingDate ? ` Eerstvolgende mijlpaal: ${context.upcomingDate}.` : ''
        }`
      : '';

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `${question.trim()}${contextSummary}`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            answer: {
              type: Type.STRING,
              description: 'Practical advice answering the user question.',
            },
            suggestedTasks: {
              type: Type.ARRAY,
              description: '1 to 3 actionable checklist tasks the user can add.',
              items: {
                type: Type.OBJECT,
                properties: {
                  title: {
                    type: Type.STRING,
                    description: 'Concise actionable task title.',
                  },
                  phaseId: {
                    type: Type.STRING,
                    description: 'One of fase-1, fase-2, fase-3, fase-4, fase-5.',
                  },
                  timingNote: {
                    type: Type.STRING,
                    description: 'Short timing note, e.g. "2 weken voor overdracht".',
                  },
                  details: {
                    type: Type.STRING,
                    description: 'Short practical tip or explanation for this task.',
                  },
                  urgent: {
                    type: Type.BOOLEAN,
                    description: 'Whether this task has a strict deadline or high priority.',
                  },
                },
                required: ['title', 'phaseId', 'timingNote', 'details', 'urgent'],
              },
            },
          },
          required: ['answer', 'suggestedTasks'],
        },
      },
    });

    const rawText = (response.text ?? '{}').trim();
    const parsed = JSON.parse(rawText);
    return res.json(parsed);
  } catch (err: unknown) {
    console.error('AI assist error:', err);
    const message = err instanceof Error ? err.message : 'Onbekende fout bij AI-aanvraag.';
    return res.status(500).json({ error: message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Huis & Verhuis Planner server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
