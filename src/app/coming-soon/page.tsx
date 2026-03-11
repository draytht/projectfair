"use client";

import { useState, useEffect, type FormEvent } from "react";
import { toast } from "sonner";
import { Component as EtherealShadow } from "@/components/ui/etheral-shadow";

export default function ComingSoonPage() {
  const [email, setEmail]         = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [mounted, setMounted]     = useState(false);
  const [isMobile, setIsMobile]   = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("nc-theme") || "dark";
    document.documentElement.setAttribute("data-theme", saved);
    setIsMobile(window.matchMedia("(pointer: coarse)").matches);
    const t = setTimeout(() => setMounted(true), 40);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Enter a valid email address.");
      return;
    }
    setSubmitted(true);
    toast.success("You're on the list. We'll reach out when we launch.");
  };

  return (
    <>
      <style>{`
        @keyframes cs-fade-up {
          from { opacity:0; transform:translateY(18px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes cs-fade-in {
          from { opacity:0; }
          to   { opacity:1; }
        }
        @keyframes cs-scan {
          from { transform:translateY(-100%); }
          to   { transform:translateY(100vh); }
        }
        @keyframes cs-dot {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:.3; transform:scale(.6); }
        }
        @keyframes cs-float-a {
          0%,100% { transform:translateY(0) rotate(-2deg); }
          50%      { transform:translateY(-12px) rotate(-1deg); }
        }
        @keyframes cs-float-b {
          0%,100% { transform:translateY(0) rotate(2deg); }
          50%      { transform:translateY(-10px) rotate(3deg); }
        }
        @keyframes cs-float-c {
          0%,100% { transform:translateY(0) rotate(-1deg); }
          60%      { transform:translateY(-8px) rotate(-2deg); }
        }
        @keyframes cs-bar {
          from { width:0; }
        }

        /* Heading — identical to .nc-hero-heading from globals.css */
        .cs-heading {
          font-family: var(--font-display, var(--font-sora));
          font-size: clamp(2.25rem, 5.5vw, 4.5rem);
          font-weight: 400;
          font-style: normal;
          line-height: 1.08;
          letter-spacing: -0.025em;
          color: var(--th-text);
          margin: 0 0 20px;
          text-align: center;
        }
        .cs-heading em {
          font-style: italic;
          color: var(--th-accent);
        }

        .cs-hint-card {
          position:absolute;
          backdrop-filter:blur(12px) saturate(1.4);
          -webkit-backdrop-filter:blur(12px) saturate(1.4);
          background:color-mix(in srgb,var(--th-card) 70%,transparent);
          border:1px solid color-mix(in srgb,var(--th-border) 70%,transparent);
          border-radius:14px;
          padding:12px 16px;
          pointer-events:none;
          user-select:none;
        }

        .cs-email-input {
          flex:1; min-width:0;
          padding:.7rem 1rem;
          border-radius:10px;
          border:1px solid var(--th-border);
          background:color-mix(in srgb,var(--th-card) 60%,transparent);
          color:var(--th-text);
          font-family: var(--font-sora, DM Sans, sans-serif);
          font-size:.875rem;
          outline:none;
          backdrop-filter:blur(8px);
          transition:border-color .2s, background .2s;
        }
        .cs-email-input::placeholder { color:var(--th-text-2); opacity:0.6; }
        .cs-email-input:focus {
          border-color:color-mix(in srgb,var(--th-accent) 60%,var(--th-border));
          background:color-mix(in srgb,var(--th-card) 80%,transparent);
        }

        .cs-submit-btn {
          padding:.7rem 1.3rem;
          border-radius:10px;
          border:none;
          background:var(--th-accent);
          color:var(--th-accent-fg);
          font-family: var(--font-sora, DM Sans, sans-serif);
          font-size:.875rem;
          font-weight:600;
          cursor:pointer;
          white-space:nowrap;
          flex-shrink:0;
          transition:opacity .18s, transform .12s;
          box-shadow:0 4px 0 rgba(0,0,0,0.25), 0 2px 10px rgba(0,0,0,0.12);
        }
        .cs-submit-btn:hover  { opacity:.88; transform:translateY(-2px); box-shadow:0 7px 0 rgba(0,0,0,0.25), 0 8px 22px rgba(0,0,0,0.18); }
        .cs-submit-btn:active { transform:translateY(2px); box-shadow:0 1px 0 rgba(0,0,0,0.2); }

        .cs-badge {
          display:inline-flex; align-items:center; gap:8px;
          padding:5px 14px; border-radius:999px;
          border:1px solid var(--th-border);
          background:color-mix(in srgb,var(--th-card) 50%,transparent);
          backdrop-filter:blur(8px);
          font-size:.7rem; font-weight:600;
          letter-spacing:.1em; text-transform:uppercase;
          color:var(--th-text-2);
        }

        .cs-pill {
          display:inline-flex; align-items:center; gap:8px;
          padding:6px 14px; border-radius:999px;
          border:1px solid var(--th-border);
          background:color-mix(in srgb,var(--th-card) 50%,transparent);
          backdrop-filter:blur(6px);
          font-size:.72rem; font-weight:500; letter-spacing:.02em;
          color:var(--th-text-2);
          white-space:nowrap;
        }

        .cs-grain {
          position:fixed; inset:0; z-index:1; pointer-events:none; opacity:.022;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size:180px 180px;
        }
        .cs-scan {
          position:fixed; left:0; right:0; height:1px; z-index:2; pointer-events:none;
          background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--th-accent) 8%,transparent),transparent);
          animation:cs-scan 12s linear infinite;
        }
        .cs-rule {
          width:100%; height:1px;
          background:linear-gradient(90deg,transparent,var(--th-border) 25%,
            color-mix(in srgb,var(--th-accent) 30%,var(--th-border)) 50%,
            var(--th-border) 75%,transparent);
        }
      `}</style>

      <div className="cs-grain" aria-hidden />
      <div className="cs-scan"  aria-hidden />

      {/* Ethereal background — same as landing page, skipped on mobile for performance */}
      <div aria-hidden style={{ position:"fixed", inset:0, zIndex:-1, background:"var(--th-bg)", pointerEvents:"none" }}>
        {!isMobile && (
          <EtherealShadow
            color="var(--th-accent)"
            animation={{ scale: 50, speed: 95 }}
            noise={{ opacity: 0.4, scale: 1.0 }}
            sizing="fill"
            style={{ opacity: 0.20 }}
          />
        )}
      </div>

      {/* Floating hint cards */}
      {mounted && (
        <>
          <div className="cs-hint-card" style={{
            left:"clamp(1rem, 4vw, 5rem)", top:"clamp(20%, 28%, 32%)",
            display:"flex", flexDirection:"column", gap:8, minWidth:170,
            animation:"cs-float-a 6s ease-in-out infinite", zIndex:2,
          }}>
            <div style={{ fontSize:".68rem", color:"var(--th-text-2)", fontWeight:600, letterSpacing:".08em", textTransform:"uppercase" }}>Contribution</div>
            <div style={{ display:"flex", alignItems:"flex-end", gap:6 }}>
              <span style={{ fontSize:"1.8rem", fontWeight:800, fontFamily:"var(--font-sora)", color:"var(--th-text)", lineHeight:1 }}>92</span>
              <span style={{ fontSize:".7rem", color:"var(--th-text-2)", paddingBottom:3 }}>/ 100</span>
            </div>
            <div style={{ height:4, borderRadius:999, background:"var(--th-border)", overflow:"hidden" }}>
              <div style={{ height:"100%", width:"92%", borderRadius:999, background:"var(--th-accent)", animation:"cs-bar 1.4s cubic-bezier(.16,1,.3,1) 1.6s both" }}/>
            </div>
            <div style={{ fontSize:".65rem", color:"var(--th-text-2)" }}>Highest on the team ✦</div>
          </div>

          <div className="cs-hint-card" style={{
            right:"clamp(1rem, 4vw, 5rem)", top:"clamp(22%, 30%, 36%)",
            display:"flex", flexDirection:"column", gap:6, minWidth:150,
            animation:"cs-float-b 7s ease-in-out 0.5s infinite", zIndex:2,
          }}>
            <div style={{ fontSize:".68rem", color:"var(--th-text-2)", fontWeight:600, letterSpacing:".08em", textTransform:"uppercase" }}>Fair Grade</div>
            <div style={{ fontSize:"2rem", fontWeight:800, fontFamily:"var(--font-sora)", color:"var(--th-accent)", lineHeight:1 }}>A</div>
            <div style={{ fontSize:".65rem", color:"var(--th-text-2)", lineHeight:1.4 }}>Adjusted for<br/>real effort</div>
          </div>

          <div className="cs-hint-card" style={{
            left:"clamp(1rem, 5vw, 7rem)", bottom:"clamp(12%, 18%, 22%)",
            display:"flex", alignItems:"center", gap:10, minWidth:190,
            animation:"cs-float-c 8s ease-in-out 1s infinite", zIndex:2,
          }}>
            <div style={{
              width:30, height:30, borderRadius:8, flexShrink:0,
              background:"color-mix(in srgb,var(--th-accent) 14%,var(--th-card))",
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1rem",
            }}>⚠️</div>
            <div>
              <div style={{ fontSize:".72rem", fontWeight:600, color:"var(--th-text)" }}>Freeloader detected</div>
              <div style={{ fontSize:".63rem", color:"var(--th-text-2)" }}>Alex · 3% contribution</div>
            </div>
          </div>
        </>
      )}

      {/* Page */}
      <div style={{
        minHeight:"100dvh",
        display:"flex",
        flexDirection:"column",
        alignItems:"center",
        justifyContent:"center",
        position:"relative",
        zIndex:1,
        padding:"2rem 1.5rem 5.5rem",
        fontFamily:"var(--font-sora, DM Sans, sans-serif)",
        overflow:"hidden",
      }}>

        {/* Brand mark */}
        {mounted && (
          <div className="nc-brand" style={{
            marginBottom:"3rem",
            animation:"cs-fade-in .5s ease .05s both",
            display:"inline-flex", alignItems:"center", gap:"0.45rem",
          }}>
            <span className="nc-brand-dot" />
            <span className="nc-brand-text" style={{ fontSize:"1rem" }}>NoCarry</span>
          </div>
        )}

        {/* Eyebrow — same pattern as landing page */}
        {mounted && (
          <div style={{
            display:"flex", alignItems:"center", gap:10, marginBottom:24,
            animation:"cs-fade-in .5s ease .12s both",
          }}>
            <div style={{ width:20, height:1.5, background:"var(--th-accent)", flexShrink:0 }} />
            <span style={{
              color:"var(--th-accent)",
              fontSize:"0.6875rem",
              fontWeight:600,
              letterSpacing:"0.08em",
              textTransform:"uppercase",
            }}>
              Coming soon
            </span>
          </div>
        )}

        {/* Main heading — matches nc-hero-heading exactly */}
        {mounted && (
          <h1 className="cs-heading" style={{ animation:"cs-fade-up .7s cubic-bezier(.16,1,.3,1) .22s both", maxWidth:600 }}>
            Fair grading,<br />
            <em>finally</em> coming.
          </h1>
        )}

        {/* Body — matches landing page sub text */}
        {mounted && (
          <p style={{
            color:"var(--th-text-2)",
            fontSize:"0.9375rem",
            lineHeight:1.75,
            maxWidth:400,
            textAlign:"center",
            margin:"0 0 32px",
            animation:"cs-fade-up .7s cubic-bezier(.16,1,.3,1) .34s both",
          }}>
            NoCarry is getting its final polish.{" "}
            Track real contributions, surface freeloaders, and grade group projects fairly.
          </p>
        )}

        {/* Rule */}
        {mounted && (
          <div className="cs-rule" style={{
            maxWidth:400, marginBottom:"1.75rem",
            animation:"cs-fade-in .6s ease .44s both",
          }}/>
        )}

        {/* Feature pills */}
        {mounted && (
          <div style={{
            display:"flex", flexWrap:"wrap", gap:8, justifyContent:"center",
            marginBottom:"2rem",
            animation:"cs-fade-up .7s cubic-bezier(.16,1,.3,1) .52s both",
          }}>
            {[
              { label:"Contribution tracking", color:"var(--th-accent)" },
              { label:"AI-powered reports",    color:"#7acc8a" },
              { label:"Fair grade adjustment", color:"color-mix(in srgb,var(--th-accent) 60%,#7aa2f7)" },
            ].map(({ label, color }) => (
              <div key={label} className="cs-pill">
                <span style={{ width:6, height:6, borderRadius:"50%", flexShrink:0, display:"inline-block", background:color, boxShadow:`0 0 5px ${color}88` }}/>
                {label}
              </div>
            ))}
          </div>
        )}

        {/* Badge */}
        {mounted && (
          <div className="cs-badge" style={{
            marginBottom:"1.75rem",
            animation:"cs-fade-in .6s ease .6s both",
          }}>
            <span style={{
              width:6, height:6, borderRadius:"50%",
              background:"#7acc8a", display:"inline-block",
              animation:"cs-dot 1.8s ease-in-out infinite",
              boxShadow:"0 0 6px rgba(122,204,138,.65)",
            }}/>
            Demo in progress
          </div>
        )}

        {/* Email form */}
        {mounted && (
          <div style={{
            width:"100%", maxWidth:420,
            animation:"cs-fade-up .7s cubic-bezier(.16,1,.3,1) .68s both",
          }}>
            {submitted ? (
              <div style={{
                padding:".8rem 1.2rem", borderRadius:12,
                border:"1px solid color-mix(in srgb,#7acc8a 30%,var(--th-border))",
                background:"color-mix(in srgb,#7acc8a 6%,var(--th-card))",
                color:"#7acc8a", fontSize:".875rem", fontWeight:500,
                textAlign:"center", backdropFilter:"blur(8px)",
              }}>
                You&apos;re on the list. Talk soon. ✦
              </div>
            ) : (
              <>
                <form onSubmit={handleSubmit} style={{ display:"flex", gap:8, width:"100%" }}>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="cs-email-input"
                  />
                  <button type="submit" className="cs-submit-btn">Notify me</button>
                </form>
                <p style={{
                  marginTop:".6rem", fontSize:".68rem",
                  color:"var(--th-text-2)", opacity:.5,
                  letterSpacing:".03em", textAlign:"center",
                }}>
                  No spam — just a ping when we ship.
                </p>
              </>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{
          position:"absolute", bottom:"1.75rem", left:0, right:0,
          textAlign:"center",
          fontSize:".65rem", color:"var(--th-border)",
          letterSpacing:".08em", fontWeight:700,
          textTransform:"uppercase", zIndex:4,
        }}>
          © 2025 NoCarry — Fair grading, finally.
        </div>
      </div>
    </>
  );
}
