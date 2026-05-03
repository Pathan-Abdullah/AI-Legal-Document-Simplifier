import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* HERO */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <p className="text-sm uppercase tracking-widest text-cyan-400 mb-4">
          LegalEase AI
        </p>

        <h1 className="text-5xl md:text-6xl font-bold leading-tight max-w-4xl">
          Understand Legal Documents in Simple Language
        </h1>

        <p className="mt-6 text-lg text-slate-400 max-w-2xl">
          Upload contracts, agreements or notices. Get clear summaries, risks,
          obligations, translations and voice explanations instantly.
        </p>

        <div className="mt-10 flex gap-4 flex-wrap">
          <Link
            href="/upload"
            className="bg-cyan-500 hover:bg-cyan-400 text-black px-6 py-3 rounded-xl font-semibold transition"
          >
            Get Started
          </Link>

          <a
            href="#features"
            className="border border-slate-700 px-6 py-3 rounded-xl hover:bg-slate-900 transition"
          >
            Explore Features
          </a>
        </div>
      </section>

      {/* FEATURES */}
      <section
        id="features"
        className="max-w-6xl mx-auto px-6 pb-20 grid md:grid-cols-3 gap-6"
      >
        {[
          {
            title: "Plain Summary",
            desc: "Legal language converted into simple explanations.",
          },
          {
            title: "Risk Detection",
            desc: "Find penalties, hidden clauses and obligations.",
          },
          {
            title: "Voice + Translation",
            desc: "Listen and translate into your preferred language.",
          },
        ].map((f, i) => (
          <div
            key={i}
            className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:scale-[1.02] transition"
          >
            <h3 className="text-xl font-semibold">{f.title}</h3>
            <p className="mt-3 text-slate-400">{f.desc}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
