'use client';

// Circular portfolio histogram — twelve vertical bars arranged in a
// crown around the camera axis, heights gently pulsing, each bar
// glowing brand-green at its top edge. Distinct from TradingGlobe3D:
// where the globe says "your universe", this says "your stats stack".
// Mounted on the /me dashboard.

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

const BULL = '#00E676';
const ACCENT = '#3DDC97';
const BEAR = '#FF6366';

type Bar = {
  angle: number;
  baseHeight: number;
  pulsePhase: number;
  bullish: boolean;
};

const BARS: Bar[] = Array.from({ length: 14 }, (_, i) => {
  const angle = (i / 14) * Math.PI * 2;
  // Histogram-like: gentle up-trend with two outliers
  const t = i / 13;
  const baseHeight = 0.6 + t * 1.4 + (i % 3 === 0 ? 0.3 : 0) + (i === 8 ? 0.5 : 0);
  return {
    angle,
    baseHeight,
    pulsePhase: i * 0.7,
    bullish: i % 5 !== 1, // 1 in 5 is red
  };
});

function Bar3D({ bar, radius }: { bar: Bar; radius: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const capRef = useRef<THREE.Mesh>(null);
  const color = bar.bullish ? BULL : BEAR;

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const h = bar.baseHeight + Math.sin(t * 1.2 + bar.pulsePhase) * 0.18;
    if (ref.current) {
      ref.current.scale.y = h;
      ref.current.position.y = h / 2;
    }
    if (capRef.current) {
      capRef.current.position.y = h + 0.08;
    }
  });

  const x = Math.cos(bar.angle) * radius;
  const z = Math.sin(bar.angle) * radius;

  return (
    <group position={[x, 0, z]}>
      {/* Body */}
      <mesh ref={ref} position={[0, bar.baseHeight / 2, 0]}>
        <boxGeometry args={[0.32, 1, 0.32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.45}
          roughness={0.4}
          metalness={0.25}
          transparent
          opacity={0.85}
        />
      </mesh>
      {/* Glowing cap */}
      <mesh ref={capRef}>
        <boxGeometry args={[0.4, 0.07, 0.4]} />
        <meshBasicMaterial color={color} transparent opacity={0.85} />
      </mesh>
    </group>
  );
}

function GroundRing({ radius }: { radius: number }) {
  const points = useMemo(() => {
    const N = 96;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(t) * radius, 0, Math.sin(t) * radius));
    }
    return pts;
  }, [radius]);
  const geom = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);
  return (
    <primitive object={new THREE.Line(geom, new THREE.LineBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.3 }))} />
  );
}

function CenterPillar() {
  // A glowing vertical light column at the centre — like the "you" axis.
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      const s = 1 + Math.sin(state.clock.getElapsedTime() * 1.5) * 0.08;
      ref.current.scale.set(s, 1, s);
    }
  });
  return (
    <group>
      <mesh ref={ref} position={[0, 1.4, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 2.8, 16]} />
        <meshStandardMaterial color={BULL} emissive={BULL} emissiveIntensity={1.3} />
      </mesh>
      {/* Soft orb on top */}
      <mesh position={[0, 2.95, 0]}>
        <sphereGeometry args={[0.18, 24, 24]} />
        <meshStandardMaterial color={BULL} emissive={BULL} emissiveIntensity={1.6} />
      </mesh>
    </group>
  );
}

function Scene() {
  const root = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (root.current) {
      root.current.rotation.y = state.clock.getElapsedTime() * 0.18;
    }
  });

  return (
    <Float speed={0.4} rotationIntensity={0.05} floatIntensity={0.25}>
      <group ref={root} position={[0, -1, 0]}>
        <GroundRing radius={3.0} />
        <CenterPillar />
        {BARS.map((b, i) => (
          <Bar3D key={i} bar={b} radius={3.0} />
        ))}
      </group>
    </Float>
  );
}

export function PortfolioStats3D({ height = 360 }: { height?: number }) {
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
        className="w-full rounded-2xl bg-gradient-to-br from-emerald-500/8 via-transparent to-emerald-500/4"
        style={{ height }}
      />
    );
  }

  return (
    <div className="w-full" style={{ height }} aria-hidden>
      <Canvas
        camera={{ position: [0, 2.6, 6.5], fov: 50 }}
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[5, 4, 5]} intensity={1.2} color="#00E676" />
        <pointLight position={[-4, -1, 3]} intensity={0.5} color="#ffffff" />
        <pointLight position={[0, 3, 0]} intensity={0.8} color="#00E676" distance={4} />
        <Scene />
      </Canvas>
    </div>
  );
}

export default PortfolioStats3D;
