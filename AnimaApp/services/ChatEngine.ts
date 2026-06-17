// src/services/ChatEngine.ts

const API_URL = 'https://chatbot-lumi.onrender.com';

export async function getBotResponse(userMessage: string, userId: string = 'default'): Promise<string> {
  try {
    const response = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        texto: userMessage,
        usuario_id: userId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.status}`);
    }

    const data = await response.json();
    return data.respuesta;

  } catch (error) {
    console.error('[ChatEngine] Error conectando con Lumi:', error);
    return 'Lo siento, mi conexión está un poco inestable en este momento. ¿Me das un segundo para reconectar? 💙';
  }
}