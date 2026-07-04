"use client";

import { Suspense, useEffect, useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Sparkles } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useReducedMotion } from "framer-motion";

/**
 * Floating neural network: a cloud of glowing nodes joined by additive
 * lines, with bright signal pulses traveling along random edges. The
 * whole constellation drifts, breathes, and eases toward the mouse.
 */

// Deterministic PRNG — same network every load, no hydration surprises.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NODE_COUNT = 46;
const HUB_EVERY = 6;
const EDGE_DIST = 1.2;
const MAX_EDGES = 110;
const PULSE_COUNT = 6;

type Network = {
  base: THREE.Vector3[];
  osc: { dir: THREE.Vector3; speed: number; phase: number; amp: number }[];
  edges: [number, number][];
  pulses: { edge: number; speed: number; offset: number }[];
};

function buildNetwork(): Network {
  const rnd = mulberry32(1337);
  const base: THREE.Vector3[] = [];
  const osc: Network["osc"] = [];

  for (let i = 0; i < NODE_COUNT; i++) {
    // Random direction, radius biased outward for a hollow constellation.
    const u = rnd() * 2 - 1;
    const theta = rnd() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    const r = 1.1 + rnd() * 1.05;
    base.push(
      new THREE.Vector3(s * Math.cos(theta) * r, u * r * 0.85, s * Math.sin(theta) * r)
    );
    const d = new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize();
    osc.push({
      dir: d,
      speed: 0.5 + rnd() * 0.7,
      phase: rnd() * Math.PI * 2,
      amp: 0.05 + rnd() * 0.06,
    });
  }

  const edges: [number, number][] = [];
  for (let i = 0; i < NODE_COUNT && edges.length < MAX_EDGES; i++) {
    for (let j = i + 1; j < NODE_COUNT && edges.length < MAX_EDGES; j++) {
      if (base[i].distanceTo(base[j]) < EDGE_DIST) edges.push([i, j]);
    }
  }

  const pulses: Network["pulses"] = [];
  for (let p = 0; p < PULSE_COUNT; p++) {
    pulses.push({
      edge: Math.floor(rnd() * edges.length),
      speed: 0.22 + rnd() * 0.28,
      offset: rnd(),
    });
  }

  return { base, osc, edges, pulses };
}

const NODE_COLOR = new THREE.Color("#4ade80");
const HUB_COLOR = new THREE.Color("#86efac");

/**
 * Scales its children so a sphere of `radius` world units always fits
 * inside the visible canvas — on any aspect ratio. Without this, a
 * narrow canvas slices geometry off at its left/right edges.
 */
function FitToView({
  radius,
  margin = 0.9,
  children,
}: {
  radius: number;
  margin?: number;
  children: ReactNode;
}) {
  const { viewport } = useThree();
  const half = Math.min(viewport.width, viewport.height) / 2;
  const scale = Math.min(1, (half * margin) / radius);
  return <group scale={scale}>{children}</group>;
}

function NeuralNetwork({ active }: { active: boolean }) {
  const group = useRef<THREE.Group>(null);
  const inst = useRef<THREE.InstancedMesh>(null);
  const lines = useRef<THREE.BufferGeometry>(null);
  const pulseRefs = useRef<(THREE.Mesh | null)[]>([]);

  const net = useMemo(() => buildNetwork(), []);
  // Rendered once as the initial buffer; per-frame writes go through the
  // attribute ref, never through this array reference.
  const initialLinePositions = useMemo(
    () => new Float32Array(net.edges.length * 6),
    [net]
  );
  // Mutable scratch reused every frame — ref-held so the frame loop may
  // write to it (lazy-initialized on first frame).
  const scratch = useRef<{
    current: THREE.Vector3[];
    mat: THREE.Matrix4;
    vec: THREE.Vector3;
  } | null>(null);

  // Per-instance node colors (hubs are brighter green).
  useEffect(() => {
    const mesh = inst.current;
    if (!mesh) return;
    for (let i = 0; i < NODE_COUNT; i++) {
      mesh.setColorAt(i, i % HUB_EVERY === 0 ? HUB_COLOR : NODE_COLOR);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, []);

  useFrame((state, delta) => {
    const t = active ? state.clock.getElapsedTime() : 0;

    if (group.current) {
      const targetY = active ? state.pointer.x * 0.45 + t * 0.07 : 0;
      const targetX = active ? -state.pointer.y * 0.3 : 0;
      group.current.rotation.y = THREE.MathUtils.damp(
        group.current.rotation.y,
        targetY,
        2.2,
        delta
      );
      group.current.rotation.x = THREE.MathUtils.damp(
        group.current.rotation.x,
        targetX,
        2.2,
        delta
      );
    }

    if (!scratch.current) {
      scratch.current = {
        current: net.base.map((v) => v.clone()),
        mat: new THREE.Matrix4(),
        vec: new THREE.Vector3(),
      };
    }
    const { current, mat, vec } = scratch.current;

    // Nodes breathe around their base position.
    for (let i = 0; i < NODE_COUNT; i++) {
      const o = net.osc[i];
      const wobble = Math.sin(t * o.speed + o.phase) * o.amp;
      vec.copy(o.dir).multiplyScalar(wobble).add(net.base[i]);
      current[i].copy(vec);
      const scale = i % HUB_EVERY === 0 ? 1.7 : 1;
      mat.makeScale(scale, scale, scale).setPosition(vec);
      inst.current?.setMatrixAt(i, mat);
    }
    if (inst.current) inst.current.instanceMatrix.needsUpdate = true;

    // Lines follow their nodes — written through the attribute ref.
    const attr = lines.current?.getAttribute("position") as
      | THREE.BufferAttribute
      | undefined;
    if (attr) {
      const arr = attr.array as Float32Array;
      for (let e = 0; e < net.edges.length; e++) {
        const [a, b] = net.edges[e];
        arr[e * 6] = current[a].x;
        arr[e * 6 + 1] = current[a].y;
        arr[e * 6 + 2] = current[a].z;
        arr[e * 6 + 3] = current[b].x;
        arr[e * 6 + 4] = current[b].y;
        arr[e * 6 + 5] = current[b].z;
      }
      attr.needsUpdate = true;
    }

    // Signal pulses travel along edges.
    for (let p = 0; p < net.pulses.length; p++) {
      const pulse = net.pulses[p];
      const mesh = pulseRefs.current[p];
      if (!mesh) continue;
      const [a, b] = net.edges[pulse.edge];
      const raw = active ? (t * pulse.speed + pulse.offset) % 1 : pulse.offset;
      // Ease in/out so pulses glide instead of ticking.
      const k = raw * raw * (3 - 2 * raw);
      mesh.position.lerpVectors(current[a], current[b], k);
      const fade = Math.sin(raw * Math.PI);
      mesh.scale.setScalar(0.6 + fade * 0.7);
    }
  });

  return (
    <group ref={group}>
      {/* Nucleus */}
      <mesh>
        <sphereGeometry args={[0.26, 32, 32]} />
        <meshBasicMaterial color="#22c55e" transparent opacity={0.85} />
      </mesh>
      <mesh scale={1.55}>
        <sphereGeometry args={[0.26, 24, 24]} />
        <meshBasicMaterial color="#22c55e" transparent opacity={0.12} />
      </mesh>

      {/* Nodes */}
      <instancedMesh ref={inst} args={[undefined, undefined, NODE_COUNT]}>
        <sphereGeometry args={[0.036, 12, 12]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

      {/* Connections */}
      <lineSegments>
        <bufferGeometry ref={lines}>
          <bufferAttribute
            attach="attributes-position"
            args={[initialLinePositions, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color="#16a34a"
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>

      {/* Signal pulses */}
      {Array.from({ length: PULSE_COUNT }, (_, i) => (
        <mesh
          key={i}
          ref={(m) => {
            pulseRefs.current[i] = m;
          }}
        >
          <sphereGeometry args={[0.05, 12, 12]} />
          <meshBasicMaterial color="#a3e635" toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function Scene({ active }: { active: boolean }) {
  return (
    <>
      <FitToView radius={2.4}>
        <Float
          speed={active ? 1.2 : 0}
          rotationIntensity={active ? 0.2 : 0}
          floatIntensity={active ? 0.7 : 0}
        >
          <NeuralNetwork active={active} />
        </Float>

        <Sparkles
          count={50}
          scale={5}
          size={1.8}
          speed={active ? 0.3 : 0}
          opacity={0.4}
          color="#4ade80"
        />
      </FitToView>

      <EffectComposer>
        <Bloom
          intensity={1.2}
          luminanceThreshold={0.15}
          luminanceSmoothing={0.3}
          mipmapBlur
          radius={0.75}
        />
      </EffectComposer>
    </>
  );
}

export default function HeroOrb({ className = "" }: { className?: string }) {
  const reduce = useReducedMotion();
  const active = !reduce;

  return (
    <div className={className} aria-hidden>
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>
          <Scene active={active} />
        </Suspense>
      </Canvas>
    </div>
  );
}
