"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Text } from "@react-three/drei";
import { books, collections } from "@/data/catalog";
import { bannerMatrix, CORRIDOR, WELCOME_S } from "@/lib/corridor";

const ANTON = "/fonts/anton-latin-400-normal.woff";
const INTER = "/fonts/inter-latin-400-normal.woff";
const noRaycast = () => null;
const panelMaterial = new THREE.MeshBasicMaterial({ color: "#111111", toneMapped: false });
const stripeMaterial = new THREE.MeshBasicMaterial({ color: "#fcd34d", toneMapped: false });
const cableMaterial = new THREE.MeshBasicMaterial({ color: "#bdbdbd" });

const WIDTH = 3.6;
const HEIGHT = 1.15;
const Y = CORRIDOR.bannerHeight + 0.1;

/** Large black sign over the entrance hall, the first thing a visitor sees. */
export function WelcomeSign() {
  const matrix = useMemo(() => {
    const m = bannerMatrix(WELCOME_S);
    return m.setPosition(new THREE.Vector3().setFromMatrixPosition(m).setY(Y));
  }, []);
  const cableLength = CORRIDOR.height - Y - HEIGHT / 2;

  return (
    <group matrix={matrix} matrixAutoUpdate={false}>
      {[-1, 1].map((x) => (
        <mesh key={x} position={[x * (WIDTH / 2 - 0.2), HEIGHT / 2 + cableLength / 2, 0]} material={cableMaterial} raycast={noRaycast}>
          <cylinderGeometry args={[0.005, 0.005, cableLength, 6]} />
        </mesh>
      ))}
      <mesh material={panelMaterial} raycast={noRaycast}>
        <boxGeometry args={[WIDTH, HEIGHT, 0.04]} />
      </mesh>
      {/* thin yellow line along the bottom, like the shop ribbon */}
      <mesh position={[0, -HEIGHT / 2 + 0.05, 0.022]} material={stripeMaterial} raycast={noRaycast}>
        <planeGeometry args={[WIDTH - 0.3, 0.025]} />
      </mesh>

      <Text font={INTER} fontSize={0.055} letterSpacing={0.25} color="#fcd34d" anchorX="center" anchorY="middle" position={[0, 0.4, 0.025]}>
        THE LAMPLIGHT LIBRARY
      </Text>
      <Text font={ANTON} fontSize={0.52} color="#ffffff" anchorX="center" anchorY="middle" position={[0, 0.02, 0.025]}>
        WELCOME
      </Text>
      <Text font={INTER} fontSize={0.055} color="#bdbdbd" anchorX="center" anchorY="middle" position={[0, -0.36, 0.025]}>
        {`${books.length} books in ${collections.length} rooms · scroll to walk in`}
      </Text>
    </group>
  );
}
