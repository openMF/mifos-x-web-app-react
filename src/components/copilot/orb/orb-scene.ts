/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  Color,
  IcosahedronGeometry,
  Mesh,
  PerspectiveCamera,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
} from 'three'

import {
  IDLE_MOTION_MS,
  ORB_AT_REST,
  ORB_MOTION,
  REST_SPEED,
  easeMotion,
  type OrbMotion,
  type OrbState,
} from './orb-state'

/** Mifos blues: the shadowed side, the brand colour, and the highlights. */
const PALETTES = {
  light: { deep: '#0a4f85', brand: '#1074b9', glow: '#9bd6f7' },
  dark: { deep: '#0b5a91', brand: '#2a90d6', glow: '#c2e7fc' },
} as const

/**
 * 3D simplex noise, from webgl-noise by Ian McEwan and Stefan Gustavson.
 * Copyright (C) 2011 Ashima Arts. All rights reserved. Distributed under the
 * MIT License: https://github.com/stegu/webgl-noise
 */
const SIMPLEX_NOISE = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(
    vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(
    0.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 105.0 * dot(m * m,
    vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`

/**
 * The surface is a sphere pushed in and out by two layers of flowing noise.
 * The normal is rebuilt from two neighbouring points on the moved surface,
 * so light follows the ripples instead of the sphere underneath.
 */
const VERTEX_SHADER = /* glsl */ `
uniform float uFlow;
uniform float uAmplitude;
uniform float uFrequency;

varying vec3 vNormal;
varying vec3 vView;
varying float vRise;

${SIMPLEX_NOISE}

float field(vec3 p) {
  float n = snoise(p * uFrequency + vec3(0.0, 0.0, uFlow));
  n += 0.5 * snoise(p * uFrequency * 2.0 + vec3(uFlow * 1.3, 0.0, 0.0));
  return n / 1.5;
}

vec3 surface(vec3 p) {
  return p * (1.0 + field(p) * uAmplitude);
}

void main() {
  vec3 n = normalize(position);
  vec3 axis = abs(n.y) > 0.99 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
  vec3 t = normalize(cross(axis, n));
  vec3 b = cross(n, t);

  float e = 0.02;
  vec3 p0 = surface(n);
  vec3 p1 = surface(normalize(n + t * e));
  vec3 p2 = surface(normalize(n + b * e));

  vRise = field(n);
  vec4 mv = modelViewMatrix * vec4(p0, 1.0);
  vNormal = normalize(normalMatrix * normalize(cross(p1 - p0, p2 - p0)));
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`

/** Glossy and lit from the upper left, with a bright rim like glass. */
const FRAGMENT_SHADER = /* glsl */ `
uniform vec3 uDeep;
uniform vec3 uBrand;
uniform vec3 uGlow;

varying vec3 vNormal;
varying vec3 vView;
varying float vRise;

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(vView);
  vec3 L = normalize(vec3(-0.45, 0.75, 0.6));

  float rise = smoothstep(-0.7, 0.8, vRise);
  vec3 base = mix(uDeep, uBrand, rise);
  base = mix(base, uGlow, smoothstep(0.6, 1.0, rise) * 0.55);

  float diffuse = max(dot(N, L), 0.0);
  float rim = pow(1.0 - max(dot(N, V), 0.0), 2.2);
  float shine = pow(max(dot(reflect(-L, N), V), 0.0), 28.0);

  vec3 color = base * (0.58 + 0.5 * diffuse) + uGlow * rim * 0.85
    + vec3(1.0) * shine * 0.4;
  gl_FragColor = vec4(color, 1.0);

  #include <colorspace_fragment>
}
`

export interface OrbScene {
  setState(state: OrbState): void
  setDark(dark: boolean): void
  /** Let a resting orb move again for a moment, e.g. under the pointer. */
  wake(): void
  dispose(): void
}

export interface OrbSceneOptions {
  /** Edge of the square canvas, in CSS pixels. */
  size: number
  state: OrbState
  dark: boolean
  /** False under reduced motion: the orb is drawn, but holds still. */
  animate: boolean
  /** The GPU took the context away; the caller shows its still fallback. */
  onContextLost: () => void
}

/**
 * Draws the orb on the given canvas. Throws when WebGL is not available, so
 * the caller can keep its fallback.
 *
 * It draws only while there is something to show: an idle orb settles and
 * the loop stops, and nothing is drawn while the tab is hidden.
 */
export function createOrbScene(
  canvas: HTMLCanvasElement,
  { size, state, dark, animate, onContextLost }: OrbSceneOptions
): OrbScene {
  const renderer = new WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'low-power',
  })
  // Sharp on dense screens, without drawing more pixels than the eye sees.
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setSize(size, size, false)
  renderer.setClearColor(0x000000, 0)

  const scene = new Scene()
  const camera = new PerspectiveCamera(32, 1, 0.1, 10)
  camera.position.z = 4.8

  const palette = PALETTES[dark ? 'dark' : 'light']
  const uniforms = {
    uFlow: { value: 0 },
    uAmplitude: { value: ORB_MOTION[state].amplitude },
    uFrequency: { value: ORB_MOTION[state].frequency },
    uDeep: { value: new Color(palette.deep) },
    uBrand: { value: new Color(palette.brand) },
    uGlow: { value: new Color(palette.glow) },
  }
  // A small orb needs far fewer triangles to look round.
  const geometry = new IcosahedronGeometry(1, size > 48 ? 24 : 10)
  const material = new ShaderMaterial({
    uniforms,
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
  })
  const mesh = new Mesh(geometry, material)
  scene.add(mesh)

  let current: OrbState = state
  let motion: OrbMotion = { ...ORB_MOTION[state] }
  let idleSince = performance.now()
  let clock = 0
  let last = 0
  let frame = 0
  let running = false
  let disposed = false

  const resting = (now: number) =>
    current === 'idle' && now - idleSince > IDLE_MOTION_MS

  const draw = () => {
    uniforms.uAmplitude.value = motion.amplitude
    uniforms.uFrequency.value = motion.frequency
    mesh.scale.setScalar(1 + Math.sin(clock * Math.PI * 2 * 1.4) * motion.pulse)
    renderer.render(scene, camera)
  }

  const tick = (now: number) => {
    const delta = Math.min((now - last) / 1000, 0.1)
    last = now
    clock += delta

    motion = easeMotion(
      motion,
      resting(now) ? ORB_AT_REST : ORB_MOTION[current],
      delta
    )
    uniforms.uFlow.value += delta * motion.speed
    mesh.rotation.y += delta * motion.speed * 0.6
    draw()

    if (resting(now) && motion.speed < REST_SPEED) {
      running = false
      return
    }
    frame = requestAnimationFrame(tick)
  }

  const start = () => {
    if (running || disposed || document.hidden) return
    if (!animate) {
      // Reduced motion: each state has its own shape, shown without moving.
      motion = { ...ORB_MOTION[current] }
      uniforms.uFlow.value = 2
      draw()
      return
    }
    running = true
    last = performance.now()
    frame = requestAnimationFrame(tick)
  }

  const stop = () => {
    cancelAnimationFrame(frame)
    running = false
  }

  const onVisibility = () => (document.hidden ? stop() : start())
  const onLost = (event: Event) => {
    event.preventDefault()
    stop()
    onContextLost()
  }
  document.addEventListener('visibilitychange', onVisibility)
  canvas.addEventListener('webglcontextlost', onLost)

  draw()
  start()

  return {
    setState(next) {
      if (next === current) return
      current = next
      idleSince = performance.now()
      start()
    },
    setDark(nextDark) {
      const next = PALETTES[nextDark ? 'dark' : 'light']
      uniforms.uDeep.value.set(next.deep)
      uniforms.uBrand.value.set(next.brand)
      uniforms.uGlow.value.set(next.glow)
      if (!running) draw()
    },
    wake() {
      idleSince = performance.now()
      start()
    },
    dispose() {
      disposed = true
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
      canvas.removeEventListener('webglcontextlost', onLost)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      // Browsers allow only a handful of WebGL contexts per page.
      renderer.forceContextLoss()
    },
  }
}
