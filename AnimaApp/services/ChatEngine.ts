// src/services/ChatEngine.ts

// URL del backend del chatbot (Lumi). Se lee de entorno para separar dev/prod.
const API_URL = process.env.EXPO_PUBLIC_CHAT_API_URL ?? 'https://chatbot-lumi.onrender.com';

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

/**
 * Despierta el backend (útil en hostings que duermen por inactividad).
 * Se llama UNA vez al entrar al chat — no en un intervalo periódico, para no
 * drenar batería/datos de todos los dispositivos.
 */
export async function pingChatServer(): Promise<void> {
  try {
    await fetch(`${API_URL}/health`, { method: 'GET' });
  } catch {
    // Silencioso: es solo un warm-up best-effort.
  }
}