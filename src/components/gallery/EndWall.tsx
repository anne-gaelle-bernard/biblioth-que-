"use client";

import { Suspense, useMemo, useState } from "react";
import * as THREE from "three";
import { useLoader, type ThreeEvent } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { books, collections, COVER_ASPECT, thicknessRatio, type Book } from "@/data/catalog";
import { bannerMatrix, CORRIDOR, curveLength } from "@/lib/corridor";
import { nav } from "@/lib/nav";
import { useStore } from "@/store/useStore";

const ANTON = "/fonts/anton-latin-400-normal.woff";
const INTER = "/fonts/inter-latin-400-normal.woff";
const INTER_600 = "/fonts/inter-latin-600-normal.woff";
const noRaycast = () => null;

const wallMaterial = new THREE.MeshLambertMaterial({ color: "#f4f4f2" });
const plinthMaterial = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.9 });
const pagesMaterial = new THREE.MeshStandardMaterial({ color: "#efe6d2", roughness: 0.95 });
const cableMaterial = new THREE.MeshBasicMaterial({ color: "#3a3a3a" });
const shadeMaterial = new THREE.MeshStandardMaterial({ color: "#111111", roughness: 0.5, side: THREE.DoubleSide });
const bulbMaterial = new THREE.MeshBasicMaterial({ color: "#fff1c9", toneMapped: false });

/** Matrix of the end wall: on the floor at the very end of the hall, facing the visitor. */
function endMatrix() {
  const m = bannerMatrix(curveLength - 0.02);
  const pos = new THREE.Vector3().setFromMatrixPosition(m).setY(0);
  return m.setPosition(pos);
}

/** Small deterministic jitter so the piles look stacked by hand. */
const jitter = (i: number, k: number) => Math.sin(i * 12.9898 + k * 78.233) * 0.5;

/** A pile of books lying flat, spines towards the visitor, on a white plinth. */
function BookPile({ pile, x }: { pile: Book[]; x: number }) {
  const spines = useLoader(THREE.TextureLoader, pile.map((b) => b.spine));
  const L = 0.5; // book height, lying along x
  const coverW = L * COVER_ASPECT;

  const items = useMemo(() => {
    const out: { b: Book; t: number; y: number; dx: number; ry: number }[] = [];
    let y = CORRIDOR.plinthHeight;
    for (const [i, b] of pile.entries()) {
      const t = coverW * thicknessRatio(b);
      out.push({ b, t, y: y + t / 2, dx: jitter(i, 1) * 0.06, ry: jitter(i, 2) * 0.16 });
      y += t;
    }
    return out;
  }, [pile, coverW]);

  const materials = useMemo(
    () =>
      pile.map((b, i) => {
        const map = spines[i].clone(); // the loader's texture is shared; set colour space on our copy
        map.colorSpace = THREE.SRGBColorSpace;
        const cloth = new THREE.MeshStandardMaterial({ color: b.color, roughness: 0.8 });
        const spine = new THREE.MeshBasicMaterial({ map, toneMapped: false });
        // standing box: [+x cover, -x back, +y top pages, -y bottom pages, +z spine, -z fore-edge]
        return [cloth, cloth, pagesMaterial, pagesMaterial, spine, pagesMaterial];
      }),
    [pile, spines],
  );

  return (
    <group position={[x, 0, 0.45]}>
      <mesh position={[0, CORRIDOR.plinthHeight / 2, 0]} material={plinthMaterial} raycast={noRaycast}>
        <boxGeometry args={[0.8, CORRIDOR.plinthHeight, 0.55]} />
      </mesh>
      {items.map(({ b, t, y, dx, ry }, i) => (
        // the box is built standing (spine portrait, like its texture) then laid down to the left
        <mesh key={b.id} position={[dx, y, 0]} rotation={[0, ry, Math.PI / 2]} material={materials[i]} raycast={noRaycast}>
          <boxGeometry args={[t, L, coverW]} />
        </mesh>
      ))}
    </group>
  );
}

/** Flat pill-shaped button on the wall. */
function WallButton({ label, dark, x, y, width, onClick }: { label: string; dark?: boolean; x: number; y: number; width: number; onClick: () => void }) {
  const [hover, setHover] = useState(false);
  const active = () => useStore.getState().phase === "gallery";
  const bg = dark ? (hover ? "#333333" : "#111111") : hover ? "#ffe08a" : "#ffffff";
  const fg = dark ? "#ffffff" : "#111111";
  const H = 0.22;

  return (
    <group
      position={[x, y, 0.03]}
      scale={hover ? 1.05 : 1}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        if (!active()) return;
        e.stopPropagation();
        setHover(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHover(false);
        document.body.style.cursor = "";
      }}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        if (!active()) return;
        e.stopPropagation();
        document.body.style.cursor = "";
        onClick();
      }}
    >
      <mesh>
        <boxGeometry args={[width - H, H, 0.03]} />
        <meshBasicMaterial color={bg} toneMapped={false} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (width - H) / 2, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[H / 2, H / 2, 0.03, 24]} />
          <meshBasicMaterial color={bg} toneMapped={false} />
        </mesh>
      ))}
      <Text font={INTER_600} fontSize={0.075} color={fg} anchorX="center" anchorY="middle" position={[0, 0, 0.02]} raycast={noRaycast}>
        {label}
      </Text>
    </group>
  );
}

/** A pendant lamp hanging over a pile of books, lighting the finale warmly. */
function Lamp({ x }: { x: number }) {
  const drop = 1.45;
  return (
    <group position={[x, CORRIDOR.height, 0.6]}>
      <mesh position={[0, -drop / 2, 0]} material={cableMaterial} raycast={noRaycast}>
        <cylinderGeometry args={[0.006, 0.006, drop, 6]} />
      </mesh>
      <mesh position={[0, -drop - 0.12, 0]} material={shadeMaterial} raycast={noRaycast}>
        <coneGeometry args={[0.32, 0.26, 32, 1, true]} />
      </mesh>
      <mesh position={[0, -drop - 0.2, 0]} material={bulbMaterial} raycast={noRaycast}>
        <sphereGeometry args={[0.07, 16, 16]} />
      </mesh>
      <pointLight position={[0, -drop - 0.3, 0]} color="#ffc979" intensity={4} distance={5} decay={1.4} />
    </group>
  );
}

/** The end of the hall: a closing wall with a sign, two piles of books and a way out. */
export function EndWall({ onShop }: { onShop: () => void }) {
  const matrix = useMemo(() => endMatrix(), []);
  const half = Math.ceil(books.length / 2);
  const W = CORRIDOR.halfWidth * 2;

  return (
    <group matrix={matrix} matrixAutoUpdate={false}>
      {/* the wall closing the hall */}
      <mesh position={[0, CORRIDOR.height / 2, 0]} material={wallMaterial} raycast={noRaycast}>
        <boxGeometry args={[W, CORRIDOR.height, 0.05]} />
      </mesh>

      <Text font={INTER} fontSize={0.06} letterSpacing={0.25} color="#8a8a8a" anchorX="center" anchorY="middle" position={[0, 3.25, 0.03]}>
        {`${books.length} BOOKS · ${collections.length} ROOMS`}
      </Text>
      <Text font={ANTON} fontSize={0.95} color="#111111" anchorX="center" anchorY="middle" position={[0, 2.62, 0.03]}>
        THE END
      </Text>
      <Text font={INTER} fontSize={0.075} color="#555555" anchorX="center" anchorY="middle" maxWidth={2.4} textAlign="center" position={[0, 2.05, 0.03]}>
        You walked past every book in the library. Thanks for visiting!
      </Text>

      <WallButton label="Visit the shop →" dark x={-0.5} y={1.62} width={0.9} onClick={onShop} />
      <WallButton label="↑ Back to the entrance" x={0.55} y={1.62} width={1.05} onClick={() => (nav.target = 0)} />

      <Suspense fallback={null}>
        <BookPile pile={books.slice(0, half)} x={-1.65} />
        <BookPile pile={books.slice(half)} x={1.65} />
      </Suspense>

      <Lamp x={-1.65} />
      <Lamp x={1.65} />
    </group>
  );
}
