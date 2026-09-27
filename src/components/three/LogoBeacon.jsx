// A second, purposeful Three.js touch: a small low-poly water droplet that
// gently turns and bobs as the RAAH brand mark on the welcome screen. On theme
// here (flooding) and deliberately contained — it only mounts while the welcome
// overlay is open, honours prefers-reduced-motion, and cleans itself up fully.

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function LogoBeacon({ className = "" }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = mount.clientWidth || 96;
    let height = mount.clientHeight || 96;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0, 4.3);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    // Teardrop profile revolved into a low-poly droplet.
    const profile = [
      [0.001, -1.3], [0.5, -1.12], [0.86, -0.72], [1.0, -0.15],
      [0.95, 0.35], [0.72, 0.82], [0.42, 1.18], [0.16, 1.42], [0.001, 1.55],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    const geo = new THREE.LatheGeometry(profile, 14);
    geo.center();
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#4F84EE"),
      metalness: 0.28,
      roughness: 0.34,
      flatShading: true,
    });
    const drop = new THREE.Mesh(geo, mat);
    drop.scale.setScalar(0.92);
    drop.rotation.x = 0.18;
    scene.add(drop);

    // Lighting — soft key + a cool rim for the faceted highlights.
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 1.0);
    key.position.set(-2.5, 3, 4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x9ec2ff, 0.7);
    rim.position.set(3, 1, -3);
    scene.add(rim);
    const spark = new THREE.PointLight(0xffffff, 0.6, 20);
    spark.position.set(1.2, 1.6, 2.4);
    scene.add(spark);

    let raf = 0;
    const clock = new THREE.Clock();
    function render(t) {
      drop.rotation.y = t * 0.6;
      drop.rotation.z = Math.sin(t * 0.9) * 0.06;
      drop.position.y = Math.sin(t * 1.1) * 0.08;
      renderer.render(scene, camera);
    }
    function loop() {
      render(clock.getElapsedTime());
      raf = requestAnimationFrame(loop);
    }

    if (reduce) {
      render(0.4);
    } else {
      loop();
    }

    const ro = new ResizeObserver(() => {
      width = mount.clientWidth || width;
      height = mount.clientHeight || height;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      if (reduce) render(0.4);
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
