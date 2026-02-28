"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox, AdaptiveDpr } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

// ── Folder dimensions ─────────────────────────────────────────────────────────
const FW = 3.0;   // width
const FH = 2.15;  // height:
const FB = 0.25;  // back panel depth
const FC = 0.25;  // cover depth

// ── Theme config: folder adapts to every theme ────────────────────────────────
type Cfg = { body: string; cover: string; paper: string; lines: string; glow: string; ambient: number; key: string; keyI: number };

const THEMES: Record<string, Cfg> = {
  "dark":         { body: "#3e3e3c", cover: "#151717", paper: "#dde8f5", lines: "#93c5fd", glow: "#3b82f6",  ambient: 0.22, key: "#bfdbfe", keyI: 2.4 },
  "light":        { body: "#bfdbfe", cover: "#2563eb", paper: "#f8fafc", lines: "#1d4ed8", glow: "#2563eb",  ambient: 0.80, key: "#93c5fd", keyI: 1.8 },
  "gruvbox":      { body: "#3c3836", cover: "#d79921", paper: "#ebdbb2", lines: "#fabd2f", glow: "#fabd2f",  ambient: 0.38, key: "#fabd2f", keyI: 2.0 },
  "nord":         { body: "#3b4252", cover: "#5e81ac", paper: "#eceff4", lines: "#88c0d0", glow: "#88c0d0",  ambient: 0.32, key: "#81a1c1", keyI: 2.0 },
  "tokyo-night":  { body: "#1a1b26", cover: "#7aa2f7", paper: "#c0caf5", lines: "#bb9af7", glow: "#7aa2f7",  ambient: 0.22, key: "#bb9af7", keyI: 2.4 },
  "dracula":      { body: "#282a36", cover: "#bd93f9", paper: "#f8f8f2", lines: "#ff79c6", glow: "#bd93f9",  ambient: 0.27, key: "#ff79c6", keyI: 2.2 },
  "catppuccin":   { body: "#181825", cover: "#cba6f7", paper: "#cdd6f4", lines: "#f38ba8", glow: "#cba6f7",  ambient: 0.25, key: "#f38ba8", keyI: 2.2 },
};
const DFLT: Cfg = THEMES.dark;

// Content lines visible when folder opens
const LINES = [
  { y: 0.64, w: 2.0 }, { y: 0.40, w: 1.5 }, { y: 0.16, w: 2.2 },
  { y: -0.08, w: 1.75 }, { y: -0.32, w: 2.1 }, { y: -0.56, w: 1.35 },
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
  const wrapRef  = useRef<THREE.Group>(null);   // whole folder (parallax)
  const pivotRef = useRef<THREE.Group>(null);   // cover pivot (bottom edge hinge)
  const mouse    = useRef({ x: 0, y: 0 });
  const openTgt  = useRef(0);
  const [hovered, setHovered] = useState(false);

  // Material refs — lerped in useFrame, no re-renders
  const coverMat = useRef<THREE.MeshStandardMaterial>(null);
  const tabMat   = useRef<THREE.MeshStandardMaterial>(null);
  const bodyMat  = useRef<THREE.MeshStandardMaterial>(null);
  const lineMats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);

  const glowCol  = useMemo(() => new THREE.Color(cfg.glow), [cfg.glow]);
  const lineCol  = useMemo(() => new THREE.Color(cfg.lines), [cfg.lines]);

  useEffect(() => { openTgt.current = hovered ? Math.PI * 0.62 : 0; }, [hovered]);

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

  useFrame((_, dt) => {
    const k  = Math.min(1, dt * 7);
    const ek = Math.min(1, dt * 10);

    // Whole-folder mouse parallax
    if (wrapRef.current) {
      wrapRef.current.rotation.x = THREE.MathUtils.lerp(wrapRef.current.rotation.x, mouse.current.y *  0.09, k);
      wrapRef.current.rotation.y = THREE.MathUtils.lerp(wrapRef.current.rotation.y, mouse.current.x * -0.13, k);
    }

    // Cover opening — hinge at bottom edge
    if (pivotRef.current) {
      pivotRef.current.rotation.x = THREE.MathUtils.lerp(pivotRef.current.rotation.x, openTgt.current, k);
    }

    // Glow on cover
    const g = hovered ? 0.35 : 0;
    if (coverMat.current) {
      coverMat.current.emissive.copy(glowCol);
      coverMat.current.emissiveIntensity = THREE.MathUtils.lerp(coverMat.current.emissiveIntensity, g * 0.7, ek);
    }
    if (tabMat.current) {
      tabMat.current.emissive.copy(glowCol);
      tabMat.current.emissiveIntensity = coverMat.current?.emissiveIntensity ?? 0;
    }
    if (bodyMat.current) {
      bodyMat.current.emissive.copy(glowCol);
      bodyMat.current.emissiveIntensity = THREE.MathUtils.lerp(bodyMat.current.emissiveIntensity, g * 0.12, ek);
    }

    // Paper lines grow brighter as cover opens
    const openFrac = Math.abs(pivotRef.current?.rotation.x ?? 0) / (Math.PI * 0.62);
    const lineGlow = 0.05 + openFrac * 0.35;
    lineMats.current.forEach((m) => {
      if (m) {
        m.emissive.copy(lineCol);
        m.emissiveIntensity = THREE.MathUtils.lerp(m.emissiveIntensity, lineGlow, ek);
      }
    });
  });

  return (
    // Resting tilt — makes it look naturally placed, not robotically flat
    <group ref={wrapRef} rotation={[0.08, -0.18, 0.02]}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      {/* ── Back panel ───────────────────────────────────────────────────── */}
      <RoundedBox args={[FW, FH, FB]} radius={0.09} smoothness={4} position={[0, 0, -FB / 2]}>
        <meshStandardMaterial ref={bodyMat} color={cfg.body} roughness={0.3} metalness={0.06}
          emissive={glowCol} emissiveIntensity={0} />
      </RoundedBox>

      {/* ── Papers (3 sheets, stacked, visible from open cover angle) ──── */}
      {[0, 1, 2].map((i) => (
        <RoundedBox key={i} args={[FW - 0.24, FH - 0.2, 0.01]} radius={0.04} smoothness={3}
          position={[i * 0.018, i * 0.008, -FB + 0.005 + i * 0.015]}>
          <meshStandardMaterial color={cfg.paper} roughness={0.65} metalness={0}
            emissive={glowCol} emissiveIntensity={0.06} />
        </RoundedBox>
      ))}

      {/* ── Content lines — glow as folder opens ─────────────────────── */}
      {LINES.map((ln, i) => (
        <mesh key={i} position={[0, ln.y, -FB + 0.042]}>
          <boxGeometry args={[ln.w, 0.038, 0.006]} />
          <meshStandardMaterial
            ref={(el) => { lineMats.current[i] = el; }}
            color={cfg.lines} emissive={lineCol} emissiveIntensity={0.05}
            roughness={0.4} metalness={0}
          />
        </mesh>
      ))}

      {/* ── Cover — pivots from its BOTTOM edge toward viewer ─────────── */}
      {/*   pivot group sits at the bottom edge of where the cover rests  */}
      <group position={[0, -FH / 2, FC / 2]} ref={pivotRef}>
        {/* Cover mesh — offset up so its bottom edge is at pivot origin */}
        <RoundedBox args={[FW, FH, FC]} radius={0.09} smoothness={4}
          position={[0, FH / 2, 0]}>
          <meshStandardMaterial ref={coverMat} color={cfg.cover}
            roughness={0.20} metalness={0.10}
            emissive={glowCol} emissiveIntensity={0} />
        </RoundedBox>

        {/* Tab — top-left of cover, moves with it */}
        <RoundedBox args={[0.68, 0.22, FC]} radius={0.04} smoothness={3}
          position={[-FW / 2 + 0.44, FH + 0.11, 0]}>
          <meshStandardMaterial ref={tabMat} color={cfg.cover}
            roughness={0.20} metalness={0.10}
            emissive={glowCol} emissiveIntensity={0} />
        </RoundedBox>
      </group>
    </group>
  );
}

// ── Scene ─────────────────────────────────────────────────────────────────────
function Scene({ cfg }: { cfg: Cfg }) {
  return (
    <>
      <ambientLight intensity={cfg.ambient} />
      <pointLight position={[4,  5, 5]}  color={cfg.key}    intensity={cfg.keyI} />
      <pointLight position={[-3, -2, 4]} color="#ffffff"     intensity={0.70} />
      <pointLight position={[0, 2.2, 3]} color={cfg.glow} intensity={0.7} distance={2.2} decay={2.5} />
      <Folder cfg={cfg} />
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.7}
          luminanceSmoothing={0.2}
          intensity={0.55}
          height={1300}
          radius={0.18}
        />
        <Vignette eskil={false} offset={0.18} darkness={0.45} />
      </EffectComposer>
    </>
  );
}

// ── CSS fallback ──────────────────────────────────────────────────────────────
function FolderFallback() {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{
        width: 200, height: 165, borderRadius: 16,
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
    // Camera: slightly above and in front — perfect angle to see inside when opened
    <Canvas camera={{ position: [0.4, 1.9, 5.8], fov: 42, near: 0.1, far: 100 }}
      dpr={[1, 1.5]} performance={{ min: 0.5 }}
      style={{ background: "transparent", width: "100%", height: "100%" }}>
      <AdaptiveDpr pixelated />
      <Scene cfg={cfg} />
    </Canvas>
  );
}
