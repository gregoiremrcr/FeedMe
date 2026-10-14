import { ChatMessage } from "@/lib/assistant";
import SpotCard from "./SpotCard";


export default function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className="flex max-w-[85%] flex-col gap-2 sm:max-w-[75%]">
        <div
          className={`whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "rounded-br-md bg-primary text-on-primary"
              : "rounded-bl-md bg-surface-container-lowest shadow-sm"
          }`}
        >
          {message.content}
        </div>

        {message.spots && message.spots.length > 0 && (
          <div className="flex flex-col gap-2">
            {message.spots.map((spot) => (
              <SpotCard key={spot.id} spot={spot} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}