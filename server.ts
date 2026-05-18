import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// API Routes
app.post("/api/gemini/summarize", async (req, res) => {
  const { title, content } = req.body;
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    const prompt = `Resuma o seguinte livro/conteúdo de forma estruturada para estudos:
    Título: ${title}
    Conteúdo: ${content}
    
    O resumo deve conter:
    1. Ideias principais
    2. Tópicos importantes
    3. Conclusão`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    res.json({ text: response.text() });
  } catch (error: any) {
    console.error('Summarize Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/gemini/chat", async (req, res) => {
  const { summary, question } = req.body;
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview",
      systemInstruction: `Você é um assistente especializado no livro resumido abaixo. 
      Resumo: ${summary}
      Responda dúvidas de forma clara e educativa.`
    });
    
    const result = await model.generateContent(question);
    const response = await result.response;
    res.json({ text: response.text() });
  } catch (error: any) {
    console.error('Chat Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/gemini/general-chat", async (req, res) => {
  const { question, history } = req.body;
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview",
      systemInstruction: "Você é o assistente virtual do QuickBook, um app inteligente de resumos e estudos. Responda de forma prestativa, curta e motivadora. Você pode ajudar com dúvidas sobre o app, dicas de estudo ou curiosidades literárias."
    });
    
    const chat = model.startChat({
      history: history.map((m: any) => ({
        role: m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.parts[0].text }]
      }))
    });
    
    const result = await chat.sendMessage(question);
    const response = await result.response;
    res.json({ text: response.text() });
  } catch (error: any) {
    console.error('General Chat Error:', error);
    res.status(500).json({ error: error.message });
  }
});

async function setupApp() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
}

// Only listen if not on Vercel
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  setupApp().then(() => {
    const port = parseInt(process.env.PORT || '3000', 10);
    app.listen(port, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  });
}

export default app;
