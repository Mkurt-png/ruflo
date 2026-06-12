'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Line } from '@react-three/drei';
import * as THREE from 'three';

const BULL = '#00E676';
const BEAR = '#FF6366';

type CandleProps = {
  position: [number, number, number];
  rotation: [number, number, number];
  bullish: boolean;
  bodyHeight: number;
  wickHeight: number;
};

function Candle({ position, rotation, bullish, bodyHeight, wickHeight }: CandleProps) {
  const color = bullish ? BULL : BEAR;
  return (
    <Float speed={1.2} rotationIntensity={0.4} floatIntensity={0.8}>
      <group position={position} rotation={rotation}>
        {/* Wick */}
        <mesh>
          <cylinderGeometry args={[0.025, 0.025, wickHeight, 8]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
        </mesh>
        {/* Body */}
        <mesh>
          <boxGeometry args={[0.32, bodyHeight, 0.32]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.35}
            roughness={0.3}
            metalness={0.2}
          />
        </mesh>
      </group>
    </Float>
  );
}

function Coin({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (ref.current) {
      ref.current.rotation.x += dt * 0.4;
      ref.current.rotation.y += dt * 0.6;
    }
  });
  return (
    <Float speed={0.8} rotationIntensity={0.2} floatIntensity={0.5}>
      <mesh ref={ref} position={position}>
        <cylinderGeometry args={[0.45, 0.45, 0.06, 32]} />
        <meshStandardMaterial
          color={BULL}
          emissive={BULL}
          emissiveIntensity={0.4}
          metalness={0.7}
          roughness={0.25}
        />
      </mesh>
    </Float>
  );
}

function PriceLine() {
  const points = useMemo(() => {
    const pts: [number, number, number][] = [];
    const N = 60;
    let y = -1.2;
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      const x = -3 + t * 6;
      // jagged uptrend
      const noise = Math.sin(i * 1.3) * 0.18 + Math.cos(i * 0.7) * 0.12;
      y = -1.2 + t * 2.4 + noise;
      const z = Math.sin(i * 0.5) * 0.3;
      pts.push([x, y, z]);
    }
    return pts;
  }, []);

  return (
    <Float speed={0.6} rotationIntensity={0.1} floatIntensity={0.3}>
      <group>
        {/* Glow underlay */}
        <Line points={points} color={BULL} lineWidth={8} transparent opacity={0.25} />
        {/* Main line */}
        <Line points={points} color={BULL} lineWidth={3} />
      </group>
    </Float>
  );
}

function SceneRig() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.getElapsedTime();
      groupRef.current.rotation.y = Math.sin(t * 0.15) * 0.25;
      groupRef.current.rotation.x = Math.cos(t * 0.1) * 0.08;
    }
  });

  const candles = useMemo(() => {
    const arr: CandleProps[] = [];
    const count = 14;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 2.2 + (i % 3) * 0.5;
      const x = Math.cos(angle) * radius;
      const y = (Math.sin(i * 1.7) * 1.4) + ((i % 2) - 0.5) * 0.6;
      const z = Math.sin(angle) * radius - 1;
      const bullish = i % 3 !== 1;
      arr.push({
        position: [x, y, z],
        rotation: [Math.random() * 0.4, Math.random() * Math.PI, Math.random() * 0.4],
        bullish,
        bodyHeight: 0.5 + (i % 4) * 0.18,
        wickHeight: 1.0 + (i % 3) * 0.25,
      });
    }
    return arr;
  }, []);

  const coins = useMemo<[number, number, number][]>(
    () => [
      [-2.8, 1.6, -2.5],
      [2.6, -1.4, -2.8],
      [0.5, 2.0, -3.2],
    ],
    [],
  );

  return (
    <group ref={groupRef}>
      <PriceLine />
      {candles.map((c, i) => (
        <Candle key={i} {...c} />
      ))}
      {coins.map((p, i) => (
        <Coin key={i} position={p} />
      ))}
    </group>
  );
}

export function Hero3D() {
  const [mounted, setMounted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mq.matches);
      const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mq.addEventListener?.('change', handler);
      return () => mq.removeEventListener?.('change', handler);
    }
  }, []);

  if (!mounted || reducedMotion) {
    return (
      <div
        aria-hidden
        className="w-full h-full min-h-[420px] rounded-xl bg-gradient-to-br from-emerald-500/10 to-transparent"
      />
    );
  }

  return (
    <div className="w-full h-full min-h-[420px]">
      <Canvas
        camera={{ position: [0, 0, 6.5], fov: 50 }}
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[5, 5, 5]} intensity={1.2} color="#00E676" />
        <pointLight position={[-5, -3, 2]} intensity={0.6} color="#ffffff" />
        <SceneRig />
      </Canvas>
    </div>
  );
}

export default Hero3D;
