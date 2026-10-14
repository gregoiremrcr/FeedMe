import ChatWindow from "@/components/assistant/ChatWindow";

export default function AssistantPage() {
  return (
    <section className="w-full px-6 py-8 lg:px-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-headline text-4xl font-bold">Assistant repas</h1>
        <p className="mb-6 mt-1 text-sm text-on-surface-variant">
          Dis-lui ton budget et ton envie, il te propose où manger.
        </p>
        <ChatWindow />
      </div>
    </section>
  );
}