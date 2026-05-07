import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function summarizeBook(title: string, content: string) {
  console.log('Summarizing book:', title, 'Content length:', content.length);
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Resuma o seguinte livro/conteúdo de forma estruturada para estudos:
      Título: ${title}
      Conteúdo: ${content}
      
      O resumo deve conter:
      1. Ideias principais
      2. Tópicos importantes
      3. Conclusão`,
    });
    console.log('Summary generated successfully');
    return response.text;
  } catch (error) {
    console.error('Gemini Summarization Error:', error);
    throw error;
  }
}

export async function chatWithBook(summary: string, question: string, history: { role: string, parts: { text: string }[] }[]) {
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: `Você é um assistente especializado no livro resumido abaixo. 
      Resumo: ${summary}
      Responda dúvidas de forma clara e educativa.`,
    },
  });
  
  // Note: sendMessage doesn't support history directly in this SDK version easily without manual contents management
  // but we can use the chat object if we manage it correctly.
  const response = await chat.sendMessage({ message: question });
  return response.text;
}

export async function generalChatStream(question: string, history: any[]) {
  try {
    const response = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: [...history, { role: "user", parts: [{ text: question }] }],
      config: {
        systemInstruction: "Você é o assistente virtual do QuickBook, um app inteligente de resumos e estudos. Responda de forma prestativa, curta e motivadora. Você pode ajudar com dúvidas sobre o app, dicas de estudo ou curiosidades literárias.",
        thinkingConfig: { thinkingLevel: "LOW" as any }
      },
    });
    return response;
  } catch (error) {
    console.error('Gemini General Chat Stream Error:', error);
    throw error;
  }
}
