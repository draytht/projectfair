"use client";

import { useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Stars, AdaptiveDpr, Line } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

// Each node = a team member. Size ∝ contribution. The dim one = the freeloader.
const NODES = [
  { id: 0, pos: [0, 0.3, 0]       as [n,n,n], contrib: 0.88, color: "#e8e8e8", glow: "#ffffff" },
  { id: 1, pos: [2.1, 0.9, -0.5]  as [n,n,n], contrib: 0.76, color: "#7dd3fc", glow: "#38bdf8" },
  { id: 2, pos: [-1.9, 1.0, 0.4]  as [n,n,n], contrib: 0.69, color: "#86efac", glow: "#4ade80" },
  { id: 3, pos: [0.4, -1.9, 0.6]  as [n,n,n], contrib: 0.91, color: "#fca5a5", glow: "#f87171" },
  { id: 4, pos: [-0.7, -0.5, -1.7] as [n,n,n], contrib: 0.08, color: "#fb923c", glow: "#f97316", dim: true },
] satisfies NodeDef[];

type n = number;
type NodeDef = {
  id: number;
  pos: [n, n, n];
  contrib: number;
  color: string;
  glow: string;
  dim?: boolean;
};

const EDGES: [number, number][] = [[0,1],[0,2],[0,3],[1,3],[2,3],[0,4]];

function NodeMesh({
  node,
  hoveredId,
  onHover,
}: {
  node: NodeDef;
  hoveredId: number | null;
  onHover: (id: number | null) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const isHovered = hoveredId === node.id;
  const radius = 0.09 + node.contrib * 0.22;
  const emissiveIntensity = node.dim ? 0.25 : isHovered ? 3.2 : 1.5;

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const target = isHovered ? 1.22 : 1.0;
    meshRef.current.scale.lerp(new THREE.Vector3(target, target, target), delta * 9);
  });

  return (
    <Float
      speed={0.7 + node.id * 0.3}
      rotationIntensity={0.12}
      floatIntensity={node.dim ? 0.2 : 0.55}
    >
      <mesh
        ref={meshRef}
        position={node.pos}
        onPointerEnter={() => onHover(node.id)}
        onPointerLeave={() => onHover(null)}
      >
        <sphereGeometry args={[radius, 40, 40]} />
        <meshStandardMaterial
          color={node.color}
          emissive={node.glow}
          emissiveIntensity={emissiveIntensity}
          roughness={0.12}
          metalness={0.65}
          transparent
          opacity={node.dim ? 0.45 : 0.92}
        />
      </mesh>
    </Float>
  );
}

function EdgeLines() {
  return (
    <>
      {EDGES.map(([a, b]) => {
        const isDim = NODES[a].dim || NODES[b].dim;
        return (
          <Line
            key={`${a}-${b}`}
            points={[NODES[a].pos, NODES[b].pos]}
            color={isDim ? "#333333" : "#555555"}
            lineWidth={isDim ? 0.3 : 0.6}
            transparent
            opacity={isDim ? 0.07 : 0.18}
          />
        );
      })}
    </>
  );
}

function Network() {
  const groupRef = useRef<THREE.Group>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: -(e.clientY / window.innerHeight - 0.5) * 2,
      };
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.09;
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      mouse.current.y * 0.11,
      delta * 2.5
    );
    groupRef.current.rotation.z = THREE.MathUtils.lerp(
      groupRef.current.rotation.z,
      mouse.current.x * -0.04,
      delta * 2.5
    );
  });

  return (
    <group ref={groupRef}>
      {NODES.map((node) => (
        <NodeMesh key={node.id} node={node} hoveredId={hoveredId} onHover={setHoveredId} />
      ))}
      <EdgeLines />
    </group>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.18} />
      <pointLight position={[6, 6, 5]}   intensity={2.2} color="#ffffff" />
      <pointLight position={[-5, -4, -4]} intensity={1.0} color="#7dd3fc" />
      <pointLight position={[0, -6, 2]}   intensity={0.7} color="#f0abfc" />
      <Network />
      <Stars radius={28} depth={14} count={220} factor={1.6} saturation={0} fade speed={0.4} />
      <EffectComposer>
        <Bloom luminanceThreshold={0.45} luminanceSmoothing={0.92} height={300} intensity={1.4} />
        <Vignette eskil={false} offset={0.18} darkness={0.55} />
      </EffectComposer>
    </>
  );
}

// ── CSS fallback for low-performance / no-WebGL devices ──────────────────────

function FallbackOrbs() {
  return (
    <div className="nc-fallback-orbs" aria-hidden="true">
      {NODES.map((n) => {
        const sz = Math.round((0.09 + n.contrib * 0.22) * 200);
        return (
          <div
            key={n.id}
            className="nc-fallback-orb"
            style={{
              width: sz,
              height: sz,
              background: `radial-gradient(circle at 35% 35%, ${n.color}, transparent)`,
              opacity: n.dim ? 0.3 : 0.75,
            }}
          />
        );
      })}
    </div>
  );
}

// ── Public component ─────────────────────────────────────────────────────────

export function HeroScene() {
  const [state, setState] = useState<"loading" | "webgl" | "fallback">("loading");

  useEffect(() => {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    const lowCPU = typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency <= 2;
    const mobile = /Mobi|Android/i.test(navigator.userAgent);
    setState(!gl || lowCPU || mobile ? "fallback" : "webgl");
  }, []);

  if (state === "loading") return null;
  if (state === "fallback") return <FallbackOrbs />;

  return (
    <Canvas
      camera={{ position: [0, 0, 7.2], fov: 42 }}
      dpr={[1, 1.5]}
      performance={{ min: 0.5 }}
      style={{ background: "transparent", width: "100%", height: "100%" }}
    >
      <AdaptiveDpr pixelated />
      <Scene />
    </Canvas>
  );
}
