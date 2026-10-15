import { restaurantApi, type AssistantResponse, type ChatTurn } from "@/lib/restaurants";
export type ChatMessage = { id: string; role: "user" | "assistant"; content: string; restaurants?: AssistantResponse["results"] };
export const MAX_MESSAGE_LENGTH = 500;
export async function sendMessage(message: string, history: ChatMessage[], signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  const turns: ChatTurn[] = history.map(({ role, content }) => ({ role, content }));
  return restaurantApi.ask({ message, history: turns });
}
