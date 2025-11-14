/**
 * 3D Universe visualization using Three.js
 */

import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import type { Particle } from '@/lib/particle';

interface UniverseProps {
  particles: Particle[];
}

export function Universe({ particles }: UniverseProps) {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);

  // Set up camera
  useMemo(() => {
    camera.position.set(0, 0, 15);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  // Update particle positions and visual properties
  useFrame(() => {
    if (!groupRef.current) return;

    // Clear existing meshes
    while (groupRef.current.children.length > 0) {
      const child = groupRef.current.children[0];
      if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
        if (child.geometry) {
          child.geometry.dispose();
        }
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        }
      }
      groupRef.current.remove(child);
    }

    // Create/update particle meshes
    particles.forEach((particle) => {
      const geometry = new THREE.SphereGeometry(0.2, 16, 16);
      
      // Variance-based color: purple (high uncertainty) -> white (low uncertainty)
      const varianceNorm = Math.min(particle.variance / 10.0, 1.0);
      const purple = new THREE.Color(0x9b5de5);
      const white = new THREE.Color(0xffffff);
      const color = purple.clone().lerp(white, 1 - varianceNorm);

      // Glow intensity based on variance
      const glowIntensity = Math.exp(-particle.variance * 0.5);
      const opacity = 0.3 + glowIntensity * 0.7;

      const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(particle.position.x, particle.position.y, particle.position.z);
      
      // Scale based on uncertainty (more uncertain = larger glow)
      const scale = 1.0 + varianceNorm * 0.5;
      mesh.scale.set(scale, scale, scale);

      groupRef.current!.add(mesh);

      // Create trail
      if (particle.trail.length > 1) {
        const trailGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particle.trail.length * 3);
        const colors = new Float32Array(particle.trail.length * 3);

        particle.trail.forEach((point, i) => {
          positions[i * 3] = point.x;
          positions[i * 3 + 1] = point.y;
          positions[i * 3 + 2] = point.z;

          const trailVarianceNorm = Math.min(point.variance / 10.0, 1.0);
          const trailColor = purple.clone().lerp(white, 1 - trailVarianceNorm);
          colors[i * 3] = trailColor.r;
          colors[i * 3 + 1] = trailColor.g;
          colors[i * 3 + 2] = trailColor.b;
        });

        trailGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        trailGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const trailMaterial = new THREE.LineBasicMaterial({
          vertexColors: true,
          transparent: true,
          opacity: 0.3,
          linewidth: 2
        });

        const trail = new THREE.Line(trailGeometry, trailMaterial);
        groupRef.current!.add(trail);
      }
    });
  });

  return (
    <group ref={groupRef}>
      {/* Ambient light for subtle purple glow */}
      <ambientLight intensity={0.4} color={0x9b5de5} />
      <pointLight position={[0, 0, 10]} intensity={0.6} color={0x9b5de5} />
      <pointLight position={[-5, 5, 5]} intensity={0.3} color={0x600ac7} />
      <pointLight position={[5, -5, 5]} intensity={0.3} color={0x4922f5} />
      
      {/* Grid floor for reference */}
      <gridHelper args={[10, 20, 0x9b5de5, 0x9b5de5]} position={[0, -5, 0]} />
    </group>
  );
}

