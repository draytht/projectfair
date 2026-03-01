"use client";

import { useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox, AdaptiveDpr, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

// ── Folder dimensions ─────────────────────────────────────────────────────────
const FW = 3.0;    // width
const FH = 2.15;   // height
const FB = 0.09;   // back panel thickness — thin cardstock
const FC = 0.09;   // cover thickness     — thin cardstock

// ── Theme config ──────────────────────────────────────────────────────────────
type Cfg = { body: string; cover: string; paper: string; lines: string; ambient: number; key: string; keyI: number };

const THEMES: Record<string, Cfg> = {
  "dark":         { body: "#afafa8", cover: "#ffffff", paper: "#dde8f5", lines: "#93c5fd", ambient: 0.30, key: "#c8deff", keyI: 2.2 },
  "light":        { body: "#484848", cover: "#1c1e20", paper: "#f8fafc", lines: "#1d4ed8", ambient: 0.90, key: "#93c5fd", keyI: 1.6 },
  "gruvbox":      { body: "#3c3836", cover: "#d79921", paper: "#ebdbb2", lines: "#fabd2f", ambient: 0.45, key: "#fabd2f", keyI: 1.8 },
  "nord":         { body: "#3b4252", cover: "#5e81ac", paper: "#eceff4", lines: "#88c0d0", ambient: 0.40, key: "#81a1c1", keyI: 1.8 },
  "tokyo-night":  { body: "#1a1b26", cover: "#7aa2f7", paper: "#c0caf5", lines: "#bb9af7", ambient: 0.28, key: "#bb9af7", keyI: 2.2 },
  "dracula":      { body: "#282a36", cover: "#bd93f9", paper: "#f8f8f2", lines: "#ff79c6", ambient: 0.32, key: "#ff79c6", keyI: 2.0 },
  "catppuccin":   { body: "#181825", cover: "#cba6f7", paper: "#cdd6f4", lines: "#f38ba8", ambient: 0.30, key: "#f38ba8", keyI: 2.0 },
};
const DFLT: Cfg = THEMES.dark;

// Lines printed on the visible paper
const LINES = [
  { y: 0.62, w: 2.0 }, { y: 0.38, w: 1.5 }, { y: 0.14, w: 2.2 },
  { y: -0.10, w: 1.75 }, { y: -0.34, w: 2.1 }, { y: -0.58, w: 1.35 },
];

// ── Theme hook ────────────────────────────────────────────────────────────────
function useTheme() {
  const [t, setT] = useState("dark");
  useEffect(() => {
    const get = () => document.documentElement.getAttribute("data-theme") ?? "dark";
    setT(get());
    const obs = new MutationObserver(() => setT(get()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);
  return t;
}

// ── The folder ────────────────────────────────────────────────────────────────
function Folder({ cfg }: { cfg: Cfg }) {
  const wrapRef  = useRef<THREE.Group>(null);
  const pivotRef = useRef<THREE.Group>(null);
  const mouse    = useRef({ x: 0, y: 0 });
  const openTgt  = useRef(0);
  const [hovered, setHovered] = useState(false);

  useEffect(() => { openTgt.current = hovered ? Math.PI * 0.58 : 0; }, [hovered]);

  useEffect(() => {
    const mv = (e: MouseEvent) => {
      mouse.current = {
        x:  (e.clientX / window.innerWidth  - 0.5) * 2,
        y: -(e.clientY / window.innerHeight - 0.5) * 2,
      };
    };
    window.addEventListener("mousemove", mv);
    return () => window.removeEventListener("mousemove", mv);
  }, []);

  useFrame((state, dt) => {
    const k = Math.min(1, dt * 6);
    if (wrapRef.current) {
      wrapRef.current.rotation.x = THREE.MathUtils.lerp(wrapRef.current.rotation.x, mouse.current.y *  0.09, k);
      wrapRef.current.rotation.y = THREE.MathUtils.lerp(wrapRef.current.rotation.y, mouse.current.x * -0.13, k);
      wrapRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.7) * 0.05;
    }
    if (pivotRef.current) {
      pivotRef.current.rotation.x = THREE.MathUtils.lerp(pivotRef.current.rotation.x, openTgt.current, k);
    }
  });

  // z positions for the thin geometry
  const paperZ  = (i: number) => -FB + 0.004 + i * 0.010;
  const linesZ  = -FB + 0.038;
  const pivotZ  = FC / 2 + 0.004;

  return (
    <group ref={wrapRef} rotation={[0.10, -0.22, 0.02]}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      {/* ── Back panel ───────────────────────────────────────────────────── */}
      <RoundedBox args={[FW, FH, FB]} radius={0.04} smoothness={4} position={[0, 0, -FB / 2]}>
        <meshPhysicalMaterial
          color={cfg.body}
          roughness={0.78}
          metalness={0}
          clearcoat={0.10}
          clearcoatRoughness={0.65}
        />
      </RoundedBox>

      {/* ── Spine strip — thin fold seam at the bottom where back meets cover */}
      <mesh position={[0, -FH / 2 + 0.03, -FB / 4]}>
        <boxGeometry args={[FW - 0.01, 0.06, FB / 2 + FC / 2 + 0.012]} />
        <meshPhysicalMaterial color={cfg.body} roughness={0.85} metalness={0} />
      </mesh>

      {/* ── Papers (5 sheets, fanned slightly) ───────────────────────────── */}
      {[0, 1, 2, 3, 4].map((i) => (
        <RoundedBox key={i} args={[FW - 0.28, FH - 0.22, 0.007]} radius={0.025} smoothness={3}
          position={[i * 0.014, i * 0.006 - 0.01, paperZ(i)]}>
          <meshPhysicalMaterial color={cfg.paper} roughness={0.92} metalness={0} />
        </RoundedBox>
      ))}

      {/* ── Printed lines on top sheet ────────────────────────────────── */}
      {LINES.map((ln, i) => (
        <mesh key={i} position={[0, ln.y, linesZ]}>
          <boxGeometry args={[ln.w, 0.032, 0.003]} />
          <meshStandardMaterial color={cfg.lines} roughness={0.88} metalness={0} />
        </mesh>
      ))}

      {/* ── Cover — hinged at bottom edge ────────────────────────────────── */}
      <group position={[0, -FH / 2, pivotZ]} ref={pivotRef}>
        {/* Main cover panel */}
        <RoundedBox args={[FW, FH, FC]} radius={0.04} smoothness={4}
          position={[0, FH / 2, 0]}>
          <meshPhysicalMaterial
            color={cfg.cover}
            roughness={0.72}
            metalness={0}
            clearcoat={0.20}
            clearcoatRoughness={0.50}
          />
        </RoundedBox>

        {/* Tab — top-left corner, continuous with cover */}
        <RoundedBox args={[0.72, 0.20, FC]} radius={0.035} smoothness={3}
          position={[-FW / 2 + 0.46, FH + 0.10, 0]}>
          <meshPhysicalMaterial
            color={cfg.cover}
            roughness={0.72}
            metalness={0}
            clearcoat={0.20}
            clearcoatRoughness={0.50}
          />
        </RoundedBox>
      </group>
    </group>
  );
}

// ── Scene ─────────────────────────────────────────────────────────────────────
function Scene({ cfg }: { cfg: Cfg }) {
  return (
    <>
      {/* Three-point studio lighting */}
      <hemisphereLight args={["#dce8ff", "#1a1f2e", cfg.ambient]} />
      <directionalLight position={[4, 7, 5]}  color={cfg.key}   intensity={cfg.keyI} />
      <directionalLight position={[-5, 1, 3]} color="#b0c8ff"   intensity={0.55} />
      <pointLight       position={[0, -3, 4]} color="#ffffff"    intensity={0.30} />

      <Folder cfg={cfg} />

      {/* Soft drop shadow — grounds the folder */}
      <ContactShadows
        position={[0, -1.45, 0]}
        opacity={0.38}
        scale={7}
        blur={2.8}
        far={3.5}
        color="#000000"
      />
    </>
  );
}

// ── CSS fallback ──────────────────────────────────────────────────────────────
function FolderFallback() {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{
        width: 200, height: 165, borderRadius: 8,
        background: "var(--th-accent)",
        transform: "perspective(600px) rotateX(12deg) rotateY(-18deg)",
        boxShadow: "0 24px 64px rgba(0,0,0,0.45)",
        animation: "nc-orb-float 4s ease-in-out infinite alternate",
      }} />
    </div>
  );
}

// ── Public export ─────────────────────────────────────────────────────────────
export function FolderStack() {
  const theme = useTheme();
  const cfg   = THEMES[theme] ?? DFLT;
  const [mode, setMode] = useState<"loading" | "webgl" | "css">("loading");

  useEffect(() => {
    const gl = document.createElement("canvas").getContext("webgl2")
             ?? document.createElement("canvas").getContext("webgl");
    const low = typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency <= 2;
    setMode(!gl || low ? "css" : "webgl");
  }, []);

  if (mode === "loading") return null;
  if (mode === "css") return <FolderFallback />;

  return (
    <Canvas camera={{ position: [0.4, 1.9, 5.8], fov: 40, near: 0.1, far: 100 }}
      dpr={[1, 1.5]} performance={{ min: 0.5 }}
      style={{ background: "transparent", width: "100%", height: "100%" }}>
      <AdaptiveDpr pixelated />
      <Scene cfg={cfg} />
    </Canvas>
  );
}
