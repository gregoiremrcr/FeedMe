import RegisterForm from "../../components/auth/RegisterForm";

export default function InscriptionPage() {
  return (
    <section className="w-full px-6 py-12 lg:px-12">
      <div className="mx-auto w-full max-w-[420px] rounded-[24px] bg-surface-container-lowest p-8 shadow-[0_4px_30px_rgba(58,48,42,0.06)]">
        <h1 className="mb-2 font-headline text-4xl font-bold">Crée ton compte</h1>
        <p className="mb-8 text-sm text-on-surface-variant">Gratuit, et ça prend une minute.</p>
        <RegisterForm />
      </div>
    </section>
  );
}