import { getSpots, Spot } from "@/lib/spots";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  spots?: Spot[];
};

export type AssistantReply = {
  reply: string;
  spots: Spot[];
};

export const MAX_MESSAGE_LENGTH = 500;

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/* ------------------------------------------------------------------
 * EXEMPLE FICTIF EN ATTENTE DE L’INTÉGRATION DE L’API il faudra juste qu'on connecte l'api
 * ---------------------------------------------------------------- */
async function mockReply(message: string): Promise<AssistantReply> {
  await new Promise((resolve) => setTimeout(resolve, 700));

  const match = message.match(/(\d+(?:[.,]\d+)?)\s*(?:€|euros?|eur)/i);
  const budget = match ? Number(match[1].replace(",", ".")) : 10;
  const fast = /rapide|vite|pressé|presse|15 min/i.test(message);

  let spots = await getSpots(budget);
  if (fast) spots = [...spots].sort((a, b) => a.walkMinutes - b.walkMinutes);
  spots = spots.slice(0, 3);

  if (spots.length === 0) {
    return {
      reply: `Je n'ai rien trouvé à moins de ${budget} €. Tu peux monter un peu ton budget ?`,
      spots: [],
    };
  }

  return {
    reply: `Avec ${budget} € ${fast ? "et peu de temps " : ""}voilà ce que je te propose :`,
    spots,
  };
}

export async function sendMessage(
  message: string,
  history: ChatMessage[],
  signal?: AbortSignal
): Promise<AssistantReply> {
  if (!API_URL) return mockReply(message);

  const res = await fetch(`${API_URL}/api/v1/assistant/chat`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      history: history.slice(-10).map(({ role, content }) => ({ role, content })),
    }),
    signal,
  });

  if (!res.ok) throw new Error("L'assistant est indisponible pour le moment.");
  return res.json();
}