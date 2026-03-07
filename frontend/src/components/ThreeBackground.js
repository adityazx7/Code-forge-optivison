'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function Particles() {
    const mesh = useRef();
    const count = 800;

    const positions = useMemo(() => {
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 20;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
        }
        return pos;
    }, []);

    const colors = useMemo(() => {
        const col = new Float32Array(count * 3);
        const palette = [
            [0, 0.83, 1],      // cyan
            [0.23, 0.51, 0.96], // blue
            [0.55, 0.36, 0.96], // purple
        ];
        for (let i = 0; i < count; i++) {
            const c = palette[Math.floor(Math.random() * palette.length)];
            col[i * 3] = c[0];
            col[i * 3 + 1] = c[1];
            col[i * 3 + 2] = c[2];
        }
        return col;
    }, []);

    useFrame((state) => {
        if (mesh.current) {
            mesh.current.rotation.y = state.clock.elapsedTime * 0.02;
            mesh.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.01) * 0.1;
        }
    });

    return (
        <points ref={mesh}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={count}
                    array={positions}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-color"
                    count={count}
                    array={colors}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.04}
                vertexColors
                transparent
                opacity={0.6}
                sizeAttenuation
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </points>
    );
}

function GridWave() {
    const mesh = useRef();
    const gridSize = 40;
    const segments = gridSize - 1;

    useFrame((state) => {
        if (!mesh.current) return;
        const positions = mesh.current.geometry.attributes.position;
        const time = state.clock.elapsedTime;

        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const z = positions.getZ(i);
            positions.setY(i, Math.sin(x * 0.5 + time * 0.4) * 0.15 + Math.cos(z * 0.3 + time * 0.3) * 0.15);
        }
        positions.needsUpdate = true;
    });

    return (
        <mesh ref={mesh} rotation={[-Math.PI / 4, 0, 0]} position={[0, -3, 0]}>
            <planeGeometry args={[20, 20, segments, segments]} />
            <meshBasicMaterial color="#00d4ff" wireframe transparent opacity={0.06} />
        </mesh>
    );
}

export default function ThreeBackground() {
    return (
        <div className="landing-bg">
            <Canvas camera={{ position: [0, 0, 8], fov: 60 }} dpr={[1, 1.5]}>
                <ambientLight intensity={0.3} />
                <Particles />
                <GridWave />
            </Canvas>
        </div>
    );
}
