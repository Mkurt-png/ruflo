'use client';

// Battle arena scene — two opposing glowing trader avatars (icosahedrons)
// facing each other across a central energy beam with travelling pulses.
// A pair of ground rings frames the duel like a coliseum. Distinct from
// the orbital globe and the portfolio histogram: this is a head-to-head.

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

const BULL = '#00E676';
const BEAR = '#FF6366';
const NEUTRAL = '#3DDC97';

function Avatar({ side, color }: { side: -1 | 1; color: string }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y += 0.012 * side;
      const t = state.clock.getElapsedTime();
      ref.current.position.y = Math.sin(t * 1.4 + (side === 1 ? Math.PI : 0)) * 0.15;
    }
  });
  return (
    <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.5}>
      <group ref={ref} position={[side * 2.6, 0, 0]}>
        {/* Wireframe shell */}
        <mesh>
          <icosahedronGeometry args={[0.9, 1]} />
          <meshBasicMaterial color={color} wireframe transparent opacity={0.65} />
        </mesh>
        {/* Inner glow core */}
        <mesh>
          <sphereGeometry args={[0.45, 24, 24]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.4} transparent opacity={0.55} />
        </mesh>
        {/* Outer ring badge */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.05, 1.12, 48]} />
          <meshBasicMaterial color={color} transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </Float>
  );
}

function EnergyBeam() {
  // The central beam is rendered as a cylinder + travelling pulses.
  const beamRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (beamRef.current) {
      const t = state.clock.getElapsedTime();
      const s = 1 + Math.sin(t * 4) * 0.08;
      beamRef.current.scale.x = s;
      beamRef.current.scale.z = s;
    }
  });
  return (
    <mesh ref={beamRef} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.05, 0.05, 4.4, 16]} />
      <meshStandardMaterial color={NEUTRAL} emissive={NEUTRAL} emissiveIntensity={1.6} />
    </mesh>
  );
}

function Pulse({ phase }: { phase: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const t = (state.clock.getElapsedTime() + phase) % 2;
    // travels back and forth between -2 and 2
    const x = t < 1 ? -2 + t * 4 : 2 - (t - 1) * 4;
    const color = t < 1 ? BULL : BEAR;
    if (ref.current) {
      ref.current.position.x = x;
      (ref.current.material as THREE.MeshStandardMaterial).color.set(color);
      (ref.current.material as THREE.MeshStandardMaterial).emissive.set(color);
    }
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.12, 16, 16]} />
      <meshStandardMaterial color={BULL} emissive={BULL} emissiveIntensity={1.8} />
    </mesh>
  );
}

function ArenaRing({ radius, y }: { radius: number; y: number }) {
  const points = useMemo(() => {
    const N = 96;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(t) * radius, y, Math.sin(t) * radius));
    }
    return pts;
  }, [radius, y]);
  const geom = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);
  return (
    <primitive
      object={
        new THREE.Line(
          geom,
          new THREE.LineBasicMaterial({ color: NEUTRAL, transparent: true, opacity: 0.35 }),
        )
      }
    />
  );
}

function Scene() {
  const root = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (root.current) {
      const t = state.clock.getElapsedTime();
      root.current.rotation.y = Math.sin(t * 0.18) * 0.18;
      root.current.rotation.x = Math.cos(t * 0.12) * 0.06;
    }
  });

  return (
    <group ref={root}>
      <ArenaRing radius={3.6} y={-1.2} />
      <ArenaRing radius={3.2} y={1.2} />
      <Avatar side={-1} color={BULL} />
      <Avatar side={1} color={BEAR} />
      <EnergyBeam />
      <Pulse phase={0} />
      <Pulse phase={0.6} />
      <Pulse phase={1.2} />
    </group>
  );
}

export function BattleArena3D({ height = 460 }: { height?: number }) {
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
        className="w-full rounded-2xl bg-gradient-to-br from-emerald-500/8 via-transparent to-rose-500/5"
        style={{ height }}
      />
    );
  }

  return (
    <div className="w-full" style={{ height }} aria-hidden>
      <Canvas camera={{ position: [0, 1.5, 7], fov: 45 }} gl={{ alpha: true, antialias: true }} dpr={[1, 2]}>
        <ambientLight intensity={0.4} />
        <pointLight position={[-3, 2, 4]} intensity={1.2} color="#00E676" />
        <pointLight position={[3, 2, 4]} intensity={1.2} color="#FF6366" />
        <pointLight position={[0, 0, 0]} intensity={0.9} color="#3DDC97" distance={4} />
        <Scene />
      </Canvas>
    </div>
  );
}

export default BattleArena3D;
