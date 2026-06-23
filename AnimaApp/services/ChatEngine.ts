// src/services/ChatEngine.ts

// URL del backend del chatbot (Lumi). Se lee de entorno para separar dev/prod.
const API_URL = process.env.EXPO_PUBLIC_CHAT_API_URL ?? 'https://chatbot-lumi.onrender.com';

/**
 * Valida que un string sea un UUID v4 válido.
 */
function isValidUUID(id: string | null | undefined): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

export async function getBotResponse(
  userMessage: string,
  userId?: string  // ← FIX: opcional, sin default 'default'
): Promise<string> {
  try {
    // ← FIX: Validar UUID antes de enviar. Si no es válido, no enviamos usuario_id
    // (el backend puede manejar usuarios anónimos o rechazar según prefieras)
    const finalUserId = isValidUUID(userId) ? userId : undefined;

    const response = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        texto: userMessage,
        ...(finalUserId && { usuario_id: finalUserId }),  // ← FIX: solo incluir si es UUID válido
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