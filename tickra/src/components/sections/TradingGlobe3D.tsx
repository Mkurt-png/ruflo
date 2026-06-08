'use client';

// Futuristic trading globe — a wireframe sphere with three orthogonal
// orbital rings, glowing trade symbols revolving on each ring, and a
// soft inner glow core. Drops in anywhere a "data universe" feel is
// wanted (landing CTA section, /me dashboard hero). Pure decoration,
// SSR-safe, respects prefers-reduced-motion.

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

const BULL = '#00E676';
const ACCENT = '#3DDC97';
const BEAR = '#FF6366';

type Orbiter = {
  label: string;
  ring: 0 | 1 | 2;
  phase: number;
  bullish: boolean;
};

const ORBITERS: Orbiter[] = [
  { label: 'BTC',    ring: 0, phase: 0,           bullish: true  },
  { label: 'ETH',    ring: 0, phase: Math.PI * 0.6, bullish: true  },
  { label: 'EUR',    ring: 0, phase: Math.PI * 1.2, bullish: false },
  { label: 'XAU',    ring: 1, phase: 0,           bullish: true  },
  { label: 'JPY',    ring: 1, phase: Math.PI * 0.8, bullish: false },
  { label: 'GBP',    ring: 1, phase: Math.PI * 1.4, bullish: true  },
  { label: 'SPX',    ring: 2, phase: 0,           bullish: true  },
  { label: 'NDX',    ring: 2, phase: Math.PI,     bullish: true  },
];

function RingOrbit({ radius, axis }: { radius: number; axis: 0 | 1 | 2 }) {
  const points = useMemo(() => {
    const N = 96;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * Math.PI * 2;
      const c = Math.cos(t) * radius;
      const s = Math.sin(t) * radius;
      if (axis === 0) pts.push(new THREE.Vector3(c, 0, s));        // equator
      else if (axis === 1) pts.push(new THREE.Vector3(c, s, 0));   // tilted vertical
      else pts.push(new THREE.Vector3(0, c, s));                   // polar
    }
    return pts;
  }, [radius, axis]);

  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);

  return (
    <primitive object={new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.35 }))} />
  );
}

function OrbitingNode({ orb, radius, speed }: { orb: Orbiter; radius: number; speed: number }) {
  const ref = useRef<THREE.Group>(null);
  const color = orb.bullish ? BULL : BEAR;

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * speed + orb.phase;
    const c = Math.cos(t) * radius;
    const s = Math.sin(t) * radius;
    if (ref.current) {
      if (orb.ring === 0) ref.current.position.set(c, 0, s);
      else if (orb.ring === 1) ref.current.position.set(c, s, 0);
      else ref.current.position.set(0, c, s);
      ref.current.lookAt(0, 0, 0);
    }
  });

  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} />
      </mesh>
      <mesh position={[0, 0.32, 0]}>
        <ringGeometry args={[0.18, 0.22, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.45} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function CoreSphere() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.18;
  });
  return (
    <group>
      {/* Wireframe shell */}
      <mesh ref={ref}>
        <icosahedronGeometry args={[1.1, 1]} />
        <meshBasicMaterial color={ACCENT} wireframe transparent opacity={0.45} />
      </mesh>
      {/* Inner soft core */}
      <mesh>
        <sphereGeometry args={[0.55, 32, 32]} />
        <meshStandardMaterial color={BULL} emissive={BULL} emissiveIntensity={0.9} transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

function Scene() {
  const root = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (root.current) {
      root.current.rotation.y = state.clock.getElapsedTime() * 0.08;
      root.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.12) * 0.12;
    }
  });

  return (
    <Float speed={0.6} rotationIntensity={0.1} floatIntensity={0.4}>
      <group ref={root}>
        <CoreSphere />
        <RingOrbit radius={2.0} axis={0} />
        <RingOrbit radius={2.5} axis={1} />
        <RingOrbit radius={3.0} axis={2} />
        {ORBITERS.map((orb, i) => {
          const radius = orb.ring === 0 ? 2.0 : orb.ring === 1 ? 2.5 : 3.0;
          const speed = orb.ring === 0 ? 0.55 : orb.ring === 1 ? -0.4 : 0.32;
          return <OrbitingNode key={i} orb={orb} radius={radius} speed={speed} />;
        })}
      </group>
    </Float>
  );
}

export function TradingGlobe3D({ height = 480 }: { height?: number }) {
  const [mounted, setMounted] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReduced(mq.matches);
      const h = (e: MediaQueryListEvent) => setReduced(e.matches);
      mq.addEventListener?.('change', h);
      return () => mq.removeEventListener?.('change', h);
    }
  }, []);

  if (!mounted || reduced) {
    return (
      <div
        aria-hidden
        className="w-full rounded-2xl bg-gradient-to-br from-emerald-500/10 via-transparent to-emerald-500/5"
        style={{ height }}
      />
    );
  }

  return (
    <div className="w-full" style={{ height }} aria-hidden>
      <Canvas camera={{ position: [0, 0.5, 7], fov: 45 }} gl={{ alpha: true, antialias: true }} dpr={[1, 2]}>
        <ambientLight intensity={0.35} />
        <pointLight position={[6, 4, 5]} intensity={1.4} color="#00E676" />
        <pointLight position={[-5, -3, 3]} intensity={0.7} color="#3DDC97" />
        <pointLight position={[0, 0, 0]} intensity={1.0} color="#00E676" distance={3} />
        <Scene />
      </Canvas>
    </div>
  );
}

export default TradingGlobe3D;
