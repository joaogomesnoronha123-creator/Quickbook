export async function summarizeBook(title: string, content: string) {
  try {
    const response = await fetch('/api/gemini/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Falha ao resumir o livro. Verifique as configurações.');
    }
    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error('Summarize Error:', error);
    throw error;
  }
}

export async function chatWithBook(summary: string, question: string, history: any[]) {
  try {
    const response = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ summary, question, history })
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Falha ao enviar mensagem.');
    }
    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error('Chat Error:', error);
    throw error;
  }
}

export async function generalChatStream(question: string, history: any[]) {
  try {
    const response = await fetch('/api/gemini/general-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, history })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Falha ao enviar mensagem ao assistente.');
    }
    const data = await response.json();
    
    // Create a generator-like object to maintain compatibility with the UI's stream loop
    return (async function* () {
      yield { text: data.text };
    })();
  } catch (error) {
    console.error('General Chat Error:', error);
    throw error;
  }
}
