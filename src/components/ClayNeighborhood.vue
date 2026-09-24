<template><div ref="host" class="clay-neighborhood" aria-hidden="true"></div></template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { cityLoop, trafficPose } from '@/utils/clayCityTraffic';

const props = defineProps({ paused: Boolean });
const host = ref(null);
let renderer, scene, camera, observer, motionQuery;
let frame = 0;
let lastTime = 0;
let elapsed = 0;
let disposed = false;
let lost = false;
let compact = false;
const pointer = { x: 0, y: 0 };
const clouds = [];
const vehicles = [];
const geometryCache = new Map();
const geometries = new Set();
const materials = new Set();
function material(color) {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 1, metalness: 0 });
  materials.add(mat);
  return mat;
}
function mesh(geometry, mat, parent, x = 0, y = 0, z = 0) {
  geometries.add(geometry);
  const result = new THREE.Mesh(geometry, mat);
  result.position.set(x, y, z);
  result.castShadow = true;
  result.receiveShadow = true;
  parent.add(result);
  return result;
}
function box(w, h, d, mat, parent, x, y, z, radius = .12) {
  const key = `${w}/${h}/${d}/${radius}`;
  if (!geometryCache.has(key)) geometryCache.set(key, new RoundedBoxGeometry(w, h, d, 2, Math.min(radius, w / 3, h / 3, d / 3)));
  return mesh(geometryCache.get(key), mat, parent, x, y, z);
}
function ball(w, h, d, mat, parent, x, y, z) {
  const sphere = mesh(new THREE.SphereGeometry(1, 20, 14), mat, parent, x, y, z);
  sphere.scale.set(w, h, d);
  return sphere;
}
function render() { if (renderer && !lost && !disposed) renderer.render(scene, camera); }
function tick(time) {
  frame = requestAnimationFrame(tick);
  if (time - lastTime < (compact ? 50 : 32)) return;
  elapsed += lastTime ? Math.min((time - lastTime) / 1000, .1) : 0;
  lastTime = time;
  clouds.forEach((cloud, index) => {
    cloud.position.y = cloud.userData.y + Math.sin(elapsed * .35 + index * 1.7) * .12;
    cloud.position.x = cloud.userData.x + Math.sin(elapsed * .15 + index) * .25;
  });
  vehicles.forEach(({ group, path, offset, speed, direction, wheels }) => {
    const pose = trafficPose(path, elapsed, offset, speed, direction);
    group.position.set(pose.x, .17, pose.z);
    group.rotation.y = pose.angle;
    wheels.forEach(wheel => { wheel.rotation.x = elapsed * speed / .16; });
  });
  // Equal horizontal distance and elevation gives a 45-degree bird's-eye view.
  const azimuth = Math.PI / 4 + (compact ? 0 : pointer.x * .025);
  camera.position.set(32 * Math.sin(azimuth), 32, 32 * Math.cos(azimuth));
  camera.lookAt(0, 0, 0);
  render();
}
function updateMotion() {
  cancelAnimationFrame(frame);
  lastTime = 0;
  if (!renderer || disposed || lost) return;
  if (!props.paused && !motionQuery.matches && !document.hidden) frame = requestAnimationFrame(tick);
  else render();
}
function onPointer(event) {
  pointer.x = event.clientX / window.innerWidth - .5;
  pointer.y = event.clientY / window.innerHeight - .5;
}
function onContextLost(event) {
  event.preventDefault();
  lost = true;
  cancelAnimationFrame(frame);
  renderer.domElement.style.opacity = '0';
}
function onContextRestored() {
  lost = false;
  renderer.domElement.style.opacity = '1';
  updateMotion();
}
onMounted(() => {
  try {
    compact = host.value.clientWidth < 700;
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, compact ? 1.25 : 1.75));
    renderer.shadowMap.enabled = !compact;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    host.value.appendChild(renderer.domElement);
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);
    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(-10, 10, 7, -7, .1, 100);
    camera.position.set(32 / Math.sqrt(2), 32, 32 / Math.sqrt(2));
    camera.lookAt(0, 0, 0);
    scene.add(new THREE.HemisphereLight('#fff9ed', '#bac8a2', 2.8));
    const sun = new THREE.DirectionalLight('#fff2db', 4);
    sun.position.set(-12, 28, 16);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -28, right: 28, top: 24, bottom: -24, far: 85 });
    sun.shadow.normalBias = .05;
    sun.shadow.bias = -.0003;
    sun.shadow.radius = 4;
    scene.add(sun);
    const cream = material('#eee6cf');
    const pale = material('#f9f0dc');
    const sage = material('#8ba984');
    const roof = material('#668772');
    const trunk = material('#b39a79');
    const glass = material('#a9c5bd');
    const peach = material('#d8ac8f');
    const white = material('#fffaf0');
    const green = material('#adc08e');
    const lawn = material('#d4ddba');
    const asphalt = material('#a0afa3');
    const sidewalk = material('#e6e7d7');
    const tires = material('#53625b');
    const blue = material('#88aebb');
    const yellow = material('#ddbe7c');
    const red = material('#c98e7d');
    const city = new THREE.Group();
    scene.add(city);

    function tree(parent, x, z, scale = 1) {
      const group = new THREE.Group();
      group.position.set(x, .15, z);
      group.scale.setScalar(scale);
      parent.add(group);
      mesh(new THREE.CylinderGeometry(.1, .14, 1.4, 12), trunk, group, 0, .7, 0);
      ball(.6, .87, .58, sage, group, 0, 1.7, 0);
      ball(.43, .55, .43, green, group, -.32, 1.45, .06);

    }
    function house(parent, x, z, height, color, angle = 0) {
      const group = new THREE.Group();
      group.position.set(x, .1, z);
      group.rotation.y = angle;
      parent.add(group);
      box(1.7, height, 1.45, color, group, 0, height / 2, 0, .18);
      box(1.94, .25, 1.7, roof, group, 0, height + .08, 0);
      box(.42, .77, .1, trunk, group, 0, .4, .75, .09);
      ball(.025, .025, .025, pale, group, .12, .4, .82);
      for (let floor = 0; floor < Math.floor(height / .7); floor++) {
        for (const dx of [-.5, .5]) {
          const y = .65 + floor * .67;
          if (y > height - .25) continue;
          box(.38, .42, .1, white, group, dx, y, .76, .06);
          box(.27, .31, .12, glass, group, dx, y, .78, .04);
          box(.1, .42, .4, white, group, .87, y, dx, .05);
          box(.12, .3, .28, glass, group, .89, y, dx, .04);
        }
      }
      box(.72, .13, .35, cream, group, 0, .12, .9, .05);
    }
    // A single city with two boulevards, sidewalks, a central park and varied blocks.
    box(35, .45, 25, lawn, city, 0, -.18, 0, .8);
    function boulevard(x, z, radius) {
      const outer = cityLoop(x + 1.15, z + 1.15, radius + 1.15);
      const roadShape = new THREE.Shape(outer.getPoints(20));
      roadShape.holes.push(cityLoop(x - 1.15, z - 1.15, radius - 1.15));
      const road = mesh(new THREE.ShapeGeometry(roadShape, 20), asphalt, city, 0, .07, 0);
      road.rotation.x = Math.PI / 2;
      // ShapeGeometry is front-facing toward -Y after rotation.
      asphalt.side = THREE.DoubleSide;
      road.castShadow = false;
      const center = cityLoop(x, z, radius);
      const dashCount = Math.floor(center.getLength() / 1.25);
      for (let i = 0; i < dashCount; i++) {
        const pose = trafficPose(center, 0, i / dashCount, 0);
        const dash = box(.055, .015, .5, white, city, pose.x, .09, pose.z, .01);
        dash.rotation.y = pose.angle;
        dash.castShadow = false;
      }
      return [cityLoop(x + .55, z + .55, radius + .55), cityLoop(x - .55, z - .55, radius - .55)];
    }
    const lanes = [...boulevard(15, 10, 2.3), ...boulevard(7, 4.2, 2)];

    // Sidewalk islands separate homes, shops and taller apartment buildings.
    const blocks = [
      [-10.5, -6.8, 4.5, 3.6], [-5.4, -7, 4.3, 2.9], [0, -7, 4.4, 2.9], [5.4, -7, 4.3, 2.9], [10.5, -6.8, 4.5, 3.6],
      [-11.2, 0, 4.4, 7.2], [11.2, 0, 4.4, 7.2],
      [-10.5, 6.8, 4.5, 3.6], [-5.4, 7, 4.3, 2.9], [0, 7, 4.4, 2.9], [5.4, 7, 4.3, 2.9], [10.5, 6.8, 4.5, 3.6],
    ];
    blocks.forEach(([x, z, w, d], index) => {
      box(w, .18, d, sidewalk, city, x, .14, z, .24);
      const colors = [pale, cream, peach, sage];
      house(city, x - .85, z - .2, [2.1, 3.5, 2.8, 4.1][index % 4], colors[index % 4]);
      house(city, x + 1, z + .25, [1.4, 2.2, 3.1][index % 3], colors[(index + 1) % 4]);
      tree(city, x - 1.6, z + d / 2 - .45, .62);
      if (d > 5) {
        house(city, x, z - 2.4, 2.3, pale);
        tree(city, x + 1, z + 2.6, .8);
      }
    });
    box(10.8, .18, 4.8, green, city, 0, .16, 0, .6);
    box(9.8, .025, .55, pale, city, 0, .27, 0, .12);
    mesh(new THREE.CylinderGeometry(1, 1.1, .2, 32), pale, city, 0, .34, 0);
    mesh(new THREE.CylinderGeometry(.85, .85, .04, 32), blue, city, 0, .46, 0);
    ball(.25, .38, .25, white, city, 0, .62, 0);
    for (const x of [-4.5, -2.8, 2.8, 4.5]) {
      tree(city, x, -1.3, .8);
      tree(city, x, 1.3, .65);
    }
    // Crosswalk stripes and small street lamps give the streets a readable scale.
    for (const x of [-10, 10]) {
      for (const z of [-10, 10]) {
        for (let i = 0; i < 6; i++) box(.16, .018, 1.8, white, city, x + i * .27, .095, z, .015);
        box(.065, 1.5, .065, trunk, city, x - .5, .9, z + (z > 0 ? 1.45 : -1.45), .02);
        ball(.18, .14, .18, pale, city, x - .5, 1.67, z + (z > 0 ? 1.45 : -1.45));
      }
    }
    // Merge static buildings by material; traffic stays separate for animation.
    city.updateMatrixWorld(true);
    const batches = new Map();
    city.traverse(object => {
      if (!object.isMesh) return;
      const key = `${object.material.uuid}/${object.castShadow}`;
      if (!batches.has(key)) batches.set(key, { material: object.material, shadow: object.castShadow, parts: [] });
      const geometry = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone();
      batches.get(key).parts.push(geometry.applyMatrix4(object.matrixWorld));
    });
    city.clear();
    batches.forEach(({ material: mat, shadow, parts }) => {
      const combined = mesh(mergeGeometries(parts), mat, city);
      combined.castShadow = shadow;
      parts.forEach(part => part.dispose());
    });

    function vehicle(type, color) {
      const group = new THREE.Group();
      const long = type === 'bus' ? 1.9 : type === 'truck' ? 1.55 : 1.15;
      const wheels = [];
      box(.65, .32, long, color, group, 0, .32, 0, .13);
      if (type === 'bus') {
        box(.62, .5, 1.74, color, group, 0, .67, 0, .14);
        box(.53, .28, .06, glass, group, 0, .74, .88, .025);
        for (const x of [-.32, .32]) for (const z of [-.53, -.12, .29]) box(.035, .27, .29, glass, group, x, .74, z, .02);
        box(.66, .09, 1.8, pale, group, 0, .96, 0, .04);
      } else if (type === 'truck') {
        box(.6, .46, .5, color, group, 0, .61, .48, .08);
        box(.5, .22, .04, glass, group, 0, .67, .74, .025);
        box(.72, .65, .95, pale, group, 0, .66, -.3, .09);
      } else {
        box(.53, .32, .65, glass, group, 0, .59, -.06, .1);
        box(.55, .08, .48, color, group, 0, .78, -.1, .04);
        if (type === 'taxi') box(.24, .1, .17, pale, group, 0, .87, -.1, .03);
      }
      for (const x of [-.34, .34]) for (const z of [-long * .31, long * .31]) {
        const wheel = new THREE.Group();
        wheel.position.set(x, .17, z);
        group.add(wheel);
        const tire = mesh(new THREE.CylinderGeometry(.16, .16, .1, 12), tires, wheel);
        tire.rotation.z = Math.PI / 2;
        wheels.push(wheel);
      }
      for (const x of [-.2, .2]) {
        box(.12, .09, .035, pale, group, x, .37, long / 2 + .01, .02);
        box(.12, .08, .035, red, group, x, .37, -long / 2 - .01, .02);
      }
      scene.add(group);
      return { group, wheels };
    }
    const vehicleColors = [peach, blue, yellow, roof, red];
    lanes.forEach((path, laneIndex) => {
      const count = laneIndex < 2 ? 7 : 4;
      for (let i = 0; i < count; i++) {
        const type = ['car', 'bus', 'taxi', 'truck', 'car'][i % 5];
        const car = vehicle(type, vehicleColors[(i + laneIndex) % vehicleColors.length]);
        const offset = (i + laneIndex * .27) / count;
        const direction = laneIndex % 2 === 0 ? 1 : -1;
        // Same lane speed prevents cars catching up with a slower bus.
        const speed = laneIndex < 2 ? 1.05 : .8;
        const pose = trafficPose(path, 0, offset, speed, direction);
        car.group.position.set(pose.x, .17, pose.z);
        car.group.rotation.y = pose.angle;
        vehicles.push({ ...car, path, offset, speed, direction });
      }
    });
    [[-17, 5, -8, .8], [15, 6, -10, 1], [-12, 4, 11, .65]].forEach(([x, y, z, scale]) => {
      const cloud = new THREE.Group();
      cloud.position.set(x, y, z);
      cloud.scale.setScalar(scale);
      cloud.userData = { x, y };
      scene.add(cloud);
      ball(.9, .38, .4, white, cloud, 0, 0, 0);
      ball(.5, .54, .42, white, cloud, -.3, .2, 0);
      ball(.42, .42, .4, white, cloud, .35, .13, 0);
      clouds.push(cloud);
    });
    motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    observer = new ResizeObserver(() => {
      const width = host.value.clientWidth;
      const height = host.value.clientHeight;
      compact = width < 700;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, compact ? 1.25 : 1.75));
      renderer.shadowMap.enabled = !compact;
      renderer.setSize(width, height);
      const halfWidth = compact ? 12 : Math.max(20, 16 * width / height);
      const halfHeight = halfWidth * height / width;
      Object.assign(camera, { left: -halfWidth, right: halfWidth, top: halfHeight, bottom: -halfHeight });
      camera.updateProjectionMatrix();
      render();
    });
    observer.observe(host.value);
    window.addEventListener('pointermove', onPointer, { passive: true });
    document.addEventListener('visibilitychange', updateMotion);
    motionQuery.addEventListener('change', updateMotion);
    updateMotion();
  } catch {
    // Decorative WebGL is optional: the CSS backdrop and all form actions remain usable.
    cancelAnimationFrame(frame);
    observer?.disconnect();
    renderer?.domElement.remove();
    renderer?.dispose();
    renderer = null;
  }
});
watch(() => props.paused, updateMotion);
onBeforeUnmount(() => {
  disposed = true;
  cancelAnimationFrame(frame);
  observer?.disconnect();
  window.removeEventListener('pointermove', onPointer);
  document.removeEventListener('visibilitychange', updateMotion);
  motionQuery?.removeEventListener('change', updateMotion);
  renderer?.domElement.removeEventListener('webglcontextlost', onContextLost);
  renderer?.domElement.removeEventListener('webglcontextrestored', onContextRestored);
  geometries.forEach(geometry => geometry.dispose());
  materials.forEach(mat => mat.dispose());
  geometryCache.clear();
  renderer?.dispose();
  renderer?.domElement.remove();
});
</script>

<style scoped>
.clay-neighborhood { position: absolute; inset: 0; pointer-events: none; z-index: 0; background: radial-gradient(ellipse at 10% 66%, #dfe8ce88, transparent 42%), radial-gradient(ellipse at 95% 50%, #e6ddc477, transparent 40%), linear-gradient(#f5f3e9, #edf0df); }
.clay-neighborhood :deep(canvas) { display: block; width: 100%; height: 100%; }
</style>
