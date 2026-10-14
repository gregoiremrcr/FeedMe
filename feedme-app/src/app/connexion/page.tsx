import LoginForm from '../../components/auth/LoginForm';

export default function ConnexionPage() {
  return (
    <section className="w-full px-6 py-12 lg:px-12">
      <div className="mx-auto w-full max-w-[420px] rounded-[24px] bg-surface-container-lowest p-8 shadow-[0_4px_30px_rgba(58,48,42,0.06)]">
        <h1 className="mb-2 font-headline text-4xl font-bold">Bon retour</h1>
        <p className="mb-8 text-sm text-on-surface-variant">
          Connecte-toi pour retrouver tes préférences.
        </p>
        <LoginForm />
      </div>
    </section>
  );
}
