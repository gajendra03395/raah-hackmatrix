// A restrained, purposeful 3D element for the Overview hero: a gently rippling
// low-poly water surface rendered behind the title. It is deliberately subtle —
// slow motion, soft colours, no interactivity — so it sets a tone without
// competing with the working panels. Cleans itself up fully on unmount and
// honours prefers-reduced-motion.

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function FloodHero({ className = "" }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = mount.clientWidth || 600;
    let height = mount.clientHeight || 220;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 3.1, 4.4);
    camera.lookAt(0, -0.2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    // Low-poly water plane.
    const SEG = 44;
    const geo = new THREE.PlaneGeometry(14, 9, SEG, SEG);
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#3B6FE0"),
      metalness: 0.12,
      roughness: 0.62,
      flatShading: true,
      transparent: true,
      opacity: 0.92,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2.35;
    mesh.position.y = -0.4;
    scene.add(mesh);

    // Soft lighting.
    scene.add(new THREE.AmbientLight(0xffffff, 0.65));
    const key = new THREE.DirectionalLight(0xffffff, 0.85);
    key.position.set(-3, 6, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x93b4f0, 0.5);
    rim.position.set(4, 2, -4);
    scene.add(rim);

    const base = geo.attributes.position.array.slice();
    const pos = geo.attributes.position;

    function displace(t) {
      for (let i = 0; i < pos.count; i++) {
        const x = base[i * 3];
        const y = base[i * 3 + 1];
        const z =
          Math.sin(x * 0.9 + t) * 0.22 +
          Math.sin(y * 1.15 + t * 0.8) * 0.18 +
          Math.sin((x + y) * 0.6 - t * 0.6) * 0.12;
        pos.array[i * 3 + 2] = z;
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();
    }

    let raf = 0;
    const clock = new THREE.Clock();
    function loop() {
      const t = clock.getElapsedTime() * 0.7;
      displace(t);
      mesh.rotation.z = Math.sin(t * 0.15) * 0.04;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    }

    if (reduce) {
      displace(0.6);
      renderer.render(scene, camera);
    } else {
      loop();
    }

    const ro = new ResizeObserver(() => {
      width = mount.clientWidth || width;
      height = mount.clientHeight || height;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      if (reduce) renderer.render(scene, camera);
    });
    ro.observe(mount);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      geo.dispose();
      mat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className={className} aria-hidden="true" />;
}
