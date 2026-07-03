'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { MeshTransmissionMaterial, Environment, Lightformer, AdaptiveDpr } from '@react-three/drei';
import { useRef, useState, useEffect, Suspense } from 'react';
import * as THREE from 'three';

type Variant = 'widget' | 'background';

interface BlobProps {
  interactive: boolean;
  motion: number;
  quality: { detail: number; samples: number; resolution: number };
}

/**
 * Blob organique en verre dépoli. Rotation constante (flux/circularité) +
 * inertie souris (lerp). Le groupe gère l'inclinaison vers le curseur ;
 * le mesh interne tourne en continu.
 */
function Blob({ interactive, motion, quality }: BlobProps) {
  const group = useRef<THREE.Group>(null);
  const mesh = useRef<THREE.Mesh>(null);
  const target = useRef({ x: 0, y: 0 });

  useFrame((state, delta) => {
    const g = group.current;
    const m = mesh.current;
    if (!m || !g) return;

    // Rotation fluide constante (motion = 0 si l'utilisateur a activé
    // "prefers-reduced-motion" au niveau OS — accessibilité).
    m.rotation.y += delta * 0.18 * motion;
    m.rotation.z += delta * 0.06 * motion;

    // Inertie souris
    if (interactive) {
      target.current.x = -state.pointer.y * 0.5;
      target.current.y = state.pointer.x * 0.7;
    }
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, target.current.x, 0.045);
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, target.current.y, 0.045);

    // Respiration subtile
    const s = 1 + Math.sin(state.clock.elapsedTime * 0.8) * 0.035 * motion;
    m.scale.setScalar(s);
  });

  return (
    <group ref={group}>
      <mesh ref={mesh}>
        <icosahedronGeometry args={[1.15, quality.detail]} />
        <MeshTransmissionMaterial
          transmission={1}
          thickness={1.4}
          roughness={0.12}
          ior={1.45}
          chromaticAberration={0.7}
          anisotropicBlur={0.3}
          distortion={0.5}
          distortionScale={0.55}
          temporalDistortion={0.25}
          iridescence={1}
          iridescenceIOR={1.3}
          iridescenceThicknessRange={[100, 500]}
          clearcoat={1}
          clearcoatRoughness={0.1}
          color="#cdeffb"
          attenuationColor="#2dd4bf"
          attenuationDistance={1.8}
          samples={quality.samples}
          resolution={quality.resolution}
          backside
        />
      </mesh>
    </group>
  );
}

function Scene({ interactive, motion, quality }: BlobProps) {
  return (
    <>
      {/* Baisse auto la résolution si le GPU (projecteur du jury, machine
          inconnue) sature → garantit la fluidité 60 FPS. */}
      <AdaptiveDpr pixelated={false} />
      <ambientLight intensity={0.5} />
      {/* Néon cyan */}
      <pointLight position={[5, 3, 4]} intensity={40} color="#22d3ee" distance={25} />
      {/* Néon violet/magenta */}
      <pointLight position={[-5, -2, 3]} intensity={40} color="#a855f7" distance={25} />
      <pointLight position={[0, 4, -2]} intensity={15} color="#10b981" distance={20} />

      <Suspense fallback={null}>
        <Blob interactive={interactive} motion={motion} quality={quality} />
        {/* Environnement procédural (reflets premium, SANS HDR distant = hors-ligne OK) */}
        <Environment resolution={quality.resolution}>
          <Lightformer form="circle" intensity={3} color="#22d3ee" position={[4, 3, 3]} scale={5} />
          <Lightformer form="circle" intensity={3} color="#a855f7" position={[-4, -2, 2]} scale={5} />
          <Lightformer form="ring" intensity={1.4} color="#ffffff" position={[0, 0, -4]} scale={7} />
          <Lightformer form="rect" intensity={1} color="#0d9488" position={[0, -4, 1]} scale={6} />
        </Environment>
      </Suspense>
    </>
  );
}

export default function SymbioNode3D({
  variant = 'widget',
  className,
  style,
}: {
  variant?: Variant;
  className?: string;
  style?: React.CSSProperties;
}) {
  const isBg = variant === 'background';

  // Qualité adaptée : le fond est plus léger pour garantir le 60 FPS avec 2 canvases
  const quality = isBg
    ? { detail: 8, samples: 3, resolution: 64 }
    : { detail: 14, samples: 6, resolution: 128 };

  // Accessibilité : coupe l'animation si l'OS demande de réduire les animations.
  const [motion, setMotion] = useState(1);
  // Perf : suspend le rendu quand l'onglet est masqué (économise le GPU
  // pendant les autres diapos ; reprend automatiquement au retour).
  const [frameloop, setFrameloop] = useState<'always' | 'never'>('always');

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const applyMotion = () => setMotion(mq.matches ? 0 : 1);
    applyMotion();
    mq.addEventListener('change', applyMotion);

    const onVis = () => setFrameloop(document.hidden ? 'never' : 'always');
    document.addEventListener('visibilitychange', onVis);

    return () => {
      mq.removeEventListener('change', applyMotion);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return (
    <div
      className={className}
      style={{ width: '100%', height: '100%', pointerEvents: isBg ? 'none' : 'auto', ...style }}
    >
      <Canvas
        frameloop={frameloop}
        camera={{ position: [0, 0, 4.2], fov: 42 }}
        dpr={isBg ? [1, 1.25] : [1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent' }}
      >
        <Scene interactive={!isBg} motion={motion} quality={quality} />
      </Canvas>
    </div>
  );
}
