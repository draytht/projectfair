import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">

      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <span className="text-xl font-bold tracking-tight text-white">
          Project<span className="text-blue-400">Fair</span>
        </span>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-gray-400 hover:text-white transition">
            Log in
          </Link>
          <Link
            href="/signup"
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg transition font-medium"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 pt-32 pb-24">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto">
          <span className="inline-block bg-blue-600/20 text-blue-400 text-xs font-semibold px-3 py-1 rounded-full border border-blue-500/30 mb-6 tracking-widest uppercase">
            Built for students. Trusted by professors.
          </span>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none mb-6">
            Group projects,{" "}
            <span className="text-blue-400">finally fair.</span>
          </h1>

          <p className="text-lg text-gray-400 max-w-xl mx-auto mb-10 leading-relaxed">
            Track real contributions, eliminate freeloaders, and give professors the data they need to grade fairly.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup"
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3 rounded-xl transition text-sm"
            >
              Start for free →
            </Link>
            <Link
              href="/login"
              className="border border-white/20 hover:border-white/40 text-gray-300 font-medium px-8 py-3 rounded-xl transition text-sm"
            >
              Log in
            </Link>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="px-6 py-20 max-w-5xl mx-auto">
        <p className="text-center text-xs uppercase tracking-widest text-gray-500 mb-12">
          The group project problem
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              emoji: "😤",
              title: "One person does everything",
              desc: "The same student carries the whole team while others coast.",
            },
            {
              emoji: "🎲",
              title: "Grades feel random",
              desc: "Professors can't see who actually did the work. Everyone gets the same grade.",
            },
            {
              emoji: "🤐",
              title: "Peer reviews are biased",
              desc: "Friends rate friends highly. Real contributors go unrecognized.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-white/5 border border-white/10 rounded-2xl p-6"
            >
              <span className="text-3xl mb-4 block">{item.emoji}</span>
              <h3 className="font-bold text-white mb-2">{item.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 bg-white/[0.02] border-y border-white/10">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs uppercase tracking-widest text-gray-500 mb-4">
            How ProjectFair fixes it
          </p>
          <h2 className="text-3xl md:text-4xl font-black text-center mb-16">
            Everything you need for <span className="text-blue-400">fair grading</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                icon: "📊",
                title: "Contribution Scoring",
                desc: "Every task created, completed, and assigned is tracked. Contribution scores are calculated automatically — no manual logging.",
              },
              {
                icon: "⭐",
                title: "Smart Peer Reviews",
                desc: "Students rate teammates on quality, communication, timeliness, and initiative. Anomalies are flagged automatically.",
              },
              {
                icon: "🚩",
                title: "Freeloader Detection",
                desc: "ProjectFair flags members with low activity, last-minute contributions, or mismatched peer ratings.",
              },
              {
                icon: "🤖",
                title: "AI Report Generator",
                desc: "Professors get an instant AI-written report with contribution analysis and suggested grading adjustments.",
              },
              {
                icon: "📋",
                title: "Kanban Task Board",
                desc: "Teams manage work in a clean board with To Do, In Progress, and Done columns. Task history is preserved.",
              },
              {
                icon: "🎓",
                title: "Professor Dashboard",
                desc: "Real-time visibility into every team's progress, contributions, and peer review scores — all in one place.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="flex gap-4 bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-blue-500/40 transition"
              >
                <span className="text-2xl mt-0.5">{f.icon}</span>
                <div>
                  <h3 className="font-bold text-white mb-1">{f.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Students / Professors */}
      <section className="px-6 py-20 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Students */}
          <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-8">
            <span className="text-3xl mb-4 block">🎒</span>
            <h3 className="text-xl font-black mb-4">For Students</h3>
            <ul className="space-y-3">
              {[
                "Protect yourself from carrying the team",
                "Prove your contributions with real data",
                "Rate teammates fairly and anonymously",
                "Track your tasks and deadlines",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-gray-300">
                  <span className="text-blue-400 mt-0.5">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Professors */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <span className="text-3xl mb-4 block">🎓</span>
            <h3 className="text-xl font-black mb-4">For Professors</h3>
            <ul className="space-y-3">
              {[
                "See real engagement, not just final output",
                "Get AI-generated grading reports instantly",
                "Detect freeloaders with contribution flags",
                "Monitor all teams from one dashboard",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-gray-300">
                  <span className="text-green-400 mt-0.5">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 text-center relative">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[500px] h-[300px] bg-blue-600/15 rounded-full blur-[100px]" />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            Stop letting freeloaders win.
          </h2>
          <p className="text-gray-400 mb-8">
            Join ProjectFair and make group work fair for everyone.
          </p>
          <Link
            href="/signup"
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-10 py-4 rounded-xl transition text-base inline-block"
          >
            Create your free account →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-8 py-6 flex items-center justify-between text-xs text-gray-500">
        <span>
          Project<span className="text-blue-400">Fair</span> © {new Date().getFullYear()}
        </span>
        <span>Built for students. Trusted by professors.</span>
      </footer>
    </main>
  );
}