import LoginForm from "@/components/auth/LoginForm";

export default function ConnexionPage() {
  return (
    <section className="w-full px-6 py-12 lg:px-12">
      <div className="mx-auto w-full max-w-[420px] rounded-[24px] bg-surface-container-lowest p-8 card-shadow">
        <h1 className="mb-1 font-headline text-3xl font-semibold">Content de te revoir</h1>
        <p className="mb-6 text-sm text-on-surface-variant">
          Connecte-toi pour retrouver tes bons plans.
        </p>
        <LoginForm />
      </div>
    </section>
  );
}