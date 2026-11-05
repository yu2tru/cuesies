// Cuesies renders viewer: open the game with ?renders (for example https://<site>/?renders).
// Loaded only in that mode (a dynamic import from index.html): the game never starts, nothing is saved, nothing is sent to the game's backend.
// Shows one game object at a time on a plain ground, with four looks to compare:
//   A = the game's own lighting and geometry, B = a new lighting set-up, C = smoother geometry, D = both.
// It only views objects: their geometry, colors and materials are never changed (smoother copies are made for C and D).

const ADDONS = 'https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/';
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const pretty = (k) => k.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase()).replace(/ ([A-Z])(?=[a-z])/g, (m, c) => ' ' + c.toLowerCase());

// three.js add-ons import 'three' by name; load their source and point that at the game's own copy, so there is only one three.js
async function addon(path, THREE_URL) {
  const src = (await (await fetch(ADDONS + path)).text()).replace(/from\s+['"]three['"]/g, `from '${THREE_URL}'`).replace(/from\s+['"]\.\.\/([^'"]+)['"]/g, (m, p) => `from '${ADDONS}${p}'`);
  const url = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
  try { return await import(url); } finally { URL.revokeObjectURL(url); }
}

// every object the game builds: the on-table pieces (OBST) at the sizes the levels use them, every movable model, the background props (DECOR), and a pool ball
function gatherObjects(api) {
  const { OBST, DECOR, THEMES, levels } = api, list = [], seen = new Set(), base = THEMES.basement;
  for (const L of levels) for (const o of L.obstacles) {
    const key = o.kind === 'movable' ? 'movable:' + o.model : o.kind; if (seen.has(key)) continue; seen.add(key);
    const builder = OBST[o.kind]; if (!builder) continue;
    const args = o.shape === 'circle' ? { r: o.radius, src: o } : { w: o.size[0], d: o.size[1], seed: 0, src: o };
    list.push({ name: o.kind === 'movable' ? 'Movable ' + pretty(o.model).toLowerCase() : pretty(o.kind), kind: 'table', theme: THEMES[L.theme] || base, build: () => builder(args, THEMES[L.theme] || base) });
  }
  for (const k of Object.keys(OBST)) if (!seen.has(k) && typeof OBST[k] === 'function' && k !== 'movable') { // pieces no level uses yet: a sensible default size
    seen.add(k); list.push({ name: pretty(k), kind: 'table', theme: base, build: () => OBST[k]({ r: 0.1, w: 0.3, d: 0.2, seed: 0, src: { kind: k } }, base) });
  }
  const props = new Map(); // background props, with the options their scene gives them
  for (const th of Object.values(THEMES)) for (const p of Object.values(th.props || {})) { if (!Array.isArray(p) || p[0] === 'big' || !DECOR[p[0]] || props.has(p[0])) continue; props.set(p[0], { opts: p[5] || {}, th }); }
  for (const k of Object.keys(DECOR)) if (typeof DECOR[k] === 'function' && k !== 'big' && !props.has(k)) props.set(k, { opts: {}, th: base });
  for (const [k, { opts, th }] of props) list.push({ name: pretty(k), kind: 'prop', theme: th, build: () => DECOR[k]({ ...opts }, th) });
  list.push({ name: 'Pool ball', kind: 'ball', theme: base, build: () => { const g = new api.THREE.Group(), m = new api.THREE.Mesh(new api.THREE.SphereGeometry(api.R, 32, 20), new api.THREE.MeshPhysicalMaterial({ map: api.ballTexture(8), roughness: 0.2, clearcoat: 0.9, clearcoatRoughness: 0.1 })); m.position.y = api.R; m.castShadow = true; g.add(m); return g; } });
  return list;
}

export async function start(api) {
  const { THREE, renderer, scene, camera, hemi, sun, fill, roomEnv, G } = api;
  // ---- the page: hide the game's UI entirely, keep only its canvas ----
  const style = document.createElement('style');
  style.textContent = `body > *:not(#scene):not(#rv) { display: none !important; }
    #rv { position: fixed; inset: 0; z-index: 50; font: 800 15px Nunito, system-ui, sans-serif; color: #24222a; user-select: none; -webkit-user-select: none; }
    #rv .grab { position: absolute; inset: 0; touch-action: none; cursor: grab; }
    #rv .top { position: absolute; top: calc(env(safe-area-inset-top) + 62px); left: 0; right: 0; text-align: center; font-size: 19px; pointer-events: none; text-shadow: 0 1px 0 #fff; }
    #rv .top small { display: block; font-size: 12px; font-weight: 700; opacity: .55; margin-top: 2px; }
    #rv .corner { position: absolute; top: calc(env(safe-area-inset-top) + 12px); right: 12px; display: flex; gap: 8px; }
    #rv .badge { position: absolute; top: calc(env(safe-area-inset-top) + 14px); left: 12px; padding: 6px 10px; border-radius: 10px; background: #24222a; color: #fff; font-size: 13px; pointer-events: none; }
    #rv button { font: inherit; border: 0; border-radius: 14px; background: #fff; color: #24222a; box-shadow: 0 2px 10px rgba(0,0,0,.12); cursor: pointer; }
    #rv .corner button { padding: 8px 12px; font-size: 14px; }
    #rv .nav { position: absolute; left: 12px; right: 12px; bottom: calc(env(safe-area-inset-bottom) + 14px); display: flex; gap: 12px; }
    #rv .nav button { flex: 1; min-height: 64px; font-size: 20px; }
    #rv button:active { transform: scale(.97); }`;
  document.head.appendChild(style);
  const loading = document.getElementById('loading'); if (loading) loading.remove();
  const root = document.createElement('div'); root.id = 'rv';
  root.innerHTML = `<div class="grab"></div><div class="top"><span class="name">Loading…</span><small class="kind"></small></div><div class="badge">Look A</div>
    <div class="corner"><button class="look">Look: A</button><button class="snap">Snap</button></div>
    <div class="nav"><button class="prev">‹ Previous</button><button class="next">Next ›</button></div>`;
  document.body.appendChild(root);
  const $ = (s) => root.querySelector(s);

  const [{ OrbitControls }, { RoomEnvironment }, BGU] = await Promise.all([addon('controls/OrbitControls.js', api.THREE_URL), addon('environments/RoomEnvironment.js', api.THREE_URL), addon('utils/BufferGeometryUtils.js', api.THREE_URL)]);

  // ---- scene: plain soft background, a ground plane, the game's lights (look A) and the new set-up (look B) ----
  renderer.setSize(innerWidth, innerHeight, false); renderer.shadowMap.enabled = true; renderer.shadowMap.autoUpdate = true;
  scene.fog = null; scene.background = new THREE.Color('#efebe5');
  scene.traverse((o) => { if (o !== scene && !o.isLight && o.parent === scene && !(o === sun.target)) o.visible = false; }); // anything the game left in its scene (cue stick, sunburst) stays hidden
  const groundA = new THREE.Mesh(new THREE.PlaneGeometry(60, 60).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#e7e1d8', roughness: 0.95 })); groundA.receiveShadow = true; scene.add(groundA);
  const groundB = new THREE.Mesh(new THREE.PlaneGeometry(60, 60).rotateX(-Math.PI / 2), new THREE.ShadowMaterial({ color: 0x1a1a3a, opacity: 0.16, transparent: true })); groundB.receiveShadow = true; scene.add(groundB);
  const A = { env: roomEnv, envI: scene.environmentIntensity, type: renderer.shadowMap.type, tone: renderer.toneMapping, exp: renderer.toneMappingExposure, cs: renderer.outputColorSpace, sunPos: sun.position.clone(), sunCam: { ...sun.shadow.camera } };
  const pm = new THREE.PMREMGenerator(renderer), envB = pm.fromScene(new RoomEnvironment(), 0.04).texture; pm.dispose();
  const hemiB = new THREE.HemisphereLight(0xfffaf2, 0xd8d0c8, 0.8);
  const key = new THREE.DirectionalLight(0xfff6ea, 2.8); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0005; key.shadow.normalBias = 0.025; key.shadow.radius = 2;
  const rim = new THREE.DirectionalLight(0xffffff, 0.75); rim.position.set(6, 5, -7);
  scene.add(hemiB, key, key.target, rim);

  const controls = new OrbitControls(camera, $('.grab')); // free rotation all the way round and underneath, pinch or scroll to zoom
  Object.assign(controls, { enableDamping: true, dampingFactor: 0.08, minPolarAngle: 0, maxPolarAngle: Math.PI, enablePan: false });
  camera.fov = 35; camera.near = 0.01; camera.far = 200; camera.position.set(1.4, 1.1, 2.2);
  const onResize = () => { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); };
  addEventListener('resize', onResize); onResize();

  const list = gatherObjects(api); let idx = 0, look = 0, current = null, size = 1, fitR = 1;
  const geomLook = () => look >= 2, lightLook = () => look === 1 || look === 3;

  // ---- look C/D geometry: double segment counts (only where the shape can be rebuilt exactly), creased normals on everything ----
  const DOUBLE = { LatheGeometry: (p) => [p.points, p.segments * 2, p.phiStart, p.phiLength], SphereGeometry: (p) => [p.radius, p.widthSegments * 2, p.heightSegments * 2, p.phiStart, p.phiLength, p.thetaStart, p.thetaLength],
    CylinderGeometry: (p) => [p.radiusTop, p.radiusBottom, p.height, p.radialSegments * 2, p.heightSegments * 2, p.openEnded, p.thetaStart, p.thetaLength],
    ConeGeometry: (p) => [p.radius, p.height, p.radialSegments * 2, p.heightSegments * 2, p.openEnded, p.thetaStart, p.thetaLength],
    TubeGeometry: (p) => [p.path, p.tubularSegments * 2, p.radius, p.radialSegments * 2, p.closed], TorusGeometry: (p) => [p.radius, p.tube, p.radialSegments * 2, p.tubularSegments * 2, p.arc],
    CapsuleGeometry: (p) => [p.radius, p.length, p.capSegments * 2, p.radialSegments * 2] };
  const ORIG = { LatheGeometry: (p) => [p.points, p.segments, p.phiStart, p.phiLength], SphereGeometry: (p) => [p.radius, p.widthSegments, p.heightSegments, p.phiStart, p.phiLength, p.thetaStart, p.thetaLength],
    CylinderGeometry: (p) => [p.radiusTop, p.radiusBottom, p.height, p.radialSegments, p.heightSegments, p.openEnded, p.thetaStart, p.thetaLength],
    ConeGeometry: (p) => [p.radius, p.height, p.radialSegments, p.heightSegments, p.openEnded, p.thetaStart, p.thetaLength],
    TubeGeometry: (p) => [p.path, p.tubularSegments, p.radius, p.radialSegments, p.closed], TorusGeometry: (p) => [p.radius, p.tube, p.radialSegments, p.tubularSegments, p.arc],
    CapsuleGeometry: (p) => [p.radius, p.length, p.capSegments, p.radialSegments] };
  // the game moves and rotates many shapes after making them: find that transform (an exact affine fit) and apply it to the denser copy; anything bent by hand stays as it is
  function fitAffine(src, dst) {
    const a = src.attributes.position, b = dst.attributes.position; if (a.count !== b.count || a.count < 4) return null;
    const XtX = new Array(16).fill(0), XtY = [new Array(4).fill(0), new Array(4).fill(0), new Array(4).fill(0)];
    for (let i = 0; i < a.count; i++) { const x = [a.getX(i), a.getY(i), a.getZ(i), 1], y = [b.getX(i), b.getY(i), b.getZ(i)];
      for (let r = 0; r < 4; r++) { for (let c = 0; c < 4; c++) XtX[r * 4 + c] += x[r] * x[c]; for (let k = 0; k < 3; k++) XtY[k][r] += x[r] * y[k]; } }
    const M = new THREE.Matrix4().set(...XtX); if (Math.abs(M.determinant()) < 1e-14) return null; M.invert(); const e = M.elements, row = (k) => [0, 1, 2, 3].map(r => e[r] * XtY[k][0] + e[4 + r] * XtY[k][1] + e[8 + r] * XtY[k][2] + e[12 + r] * XtY[k][3]);
    const [rx, ry, rz] = [row(0), row(1), row(2)], T = new THREE.Matrix4().set(...rx, ...ry, ...rz, 0, 0, 0, 1), v = new THREE.Vector3(); let err = 0, span = 0;
    for (let i = 0; i < a.count; i++) { v.fromBufferAttribute(a, i).applyMatrix4(T); err = Math.max(err, v.distanceTo(new THREE.Vector3().fromBufferAttribute(b, i))); span = Math.max(span, Math.abs(b.getX(i)), Math.abs(b.getY(i)), Math.abs(b.getZ(i))); }
    if (err > 1e-5 * Math.max(1, span)) return null;
    const ua = src.attributes.uv, ub = dst.attributes.uv; if (ua && ub) for (let i = 0; i < ua.count; i++) if (Math.abs(ua.getX(i) - ub.getX(i)) > 1e-5 || Math.abs(ua.getY(i) - ub.getY(i)) > 1e-5) return null; // custom texture mapping: keep it
    return T;
  }
  const smoothCache = new Map();
  function smoothGeo(g) {
    if (smoothCache.has(g)) return smoothCache.get(g);
    let out = g;
    try {
      const make = DOUBLE[g.type], p = g.parameters;
      if (make && p && !Object.keys(g.morphAttributes).length) { const C = THREE[g.type], T = fitAffine(new C(...ORIG[g.type](p)), g); if (T) { out = new C(...make(p)); out.applyMatrix4(T); } }
      out = BGU.toCreasedNormals(out === g ? g.clone() : out, Math.PI / 4.5);
    } catch (e) { out = g; }
    smoothCache.set(g, out); return out;
  }

  // ---- building and showing one object ----
  function build(i) {
    const item = list[i], wrap = new THREE.Group(); let obj;
    G.theme = item.theme; // some builders read the scene's style (it is never saved)
    try { obj = item.build(); } catch (e) { console.warn('[renders] could not build', item.name, e); obj = null; }
    if (!obj || !obj.isObject3D) { const t = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), new THREE.MeshStandardMaterial({ color: '#d33' })); obj = t; }
    obj.traverse((m) => { if (m.isMesh) { m.castShadow = m.castShadow !== false; m.receiveShadow = true; if (geomLook()) m.geometry = smoothGeo(m.geometry); } });
    obj.updateMatrixWorld(true); const box = new THREE.Box3().setFromObject(obj, true), c = box.getCenter(new THREE.Vector3());
    obj.position.x -= c.x; obj.position.z -= c.z; obj.position.y -= box.min.y; // centered, standing on the ground
    wrap.add(obj); wrap.userData.size = box.getSize(new THREE.Vector3()); wrap.userData.tick = obj.userData && obj.userData.tick; return wrap;
  }
  function frameFor(w) { const s = w.userData.size, r = Math.max(0.05, s.length() / 2); return { r, target: new THREE.Vector3(0, s.y / 2, 0), dist: r / Math.sin(THREE.MathUtils.degToRad(camera.fov) / 2) * (camera.aspect < 1 ? 1.25 / Math.max(0.55, camera.aspect) : 1.15) }; }
  function setLights(w) {
    const B = lightLook(), r = w ? frameFor(w).r : 1;
    hemi.visible = sun.visible = fill.visible = !B; hemiB.visible = key.visible = rim.visible = B; groundA.visible = !B; groundB.visible = B;
    scene.environment = B ? envB : A.env; scene.environmentIntensity = B ? 0.4 : A.envI;
    renderer.shadowMap.type = B ? THREE.PCFShadowMap : A.type; renderer.toneMapping = B ? THREE.NeutralToneMapping : A.tone; renderer.toneMappingExposure = B ? 1 : A.exp; renderer.outputColorSpace = B ? THREE.SRGBColorSpace : A.cs;
    const sc = Math.max(1.5, r * 1.6); // keep each light's shadow box snug around the object
    key.position.set(-4, 12, 8); key.target.position.set(0, 0, 0); Object.assign(key.shadow.camera, { left: -sc, right: sc, top: sc, bottom: -sc, near: 0.5, far: 40 }); key.shadow.camera.updateProjectionMatrix();
    sun.position.copy(A.sunPos); sun.target.position.set(0, 0, 0); Object.assign(sun.shadow.camera, { left: Math.min(A.sunCam.left, -sc), right: Math.max(A.sunCam.right, sc), top: Math.max(A.sunCam.top, sc), bottom: Math.min(A.sunCam.bottom, -sc) }); sun.shadow.camera.updateProjectionMatrix();
  }
  const anims = [];
  const animate = (dur, fn, done) => anims.push({ t: 0, dur, fn, done });
  function show(i, instant) {
    idx = (i + list.length) % list.length; const old = current, next = build(idx); current = next; scene.add(next);
    $('.name').textContent = `${list[idx].name}  ${idx + 1} / ${list.length}`; $('.kind').textContent = { table: 'on-table piece', prop: 'background prop', ball: 'ball' }[list[idx].kind];
    setLights(next);
    const f = frameFor(next); fitR = f.r; size = f.dist;
    if (old) { const s0 = old.userData.size.y || 0.3; animate(0.25, (k) => { old.position.y = -k * s0 * 0.35; old.scale.setScalar(1 - 0.08 * k); }, () => { scene.remove(old); }); }
    const sN = next.userData.size.y || 0.3; next.position.y = -sN * 0.35; next.scale.setScalar(0.92);
    animate(0.25, (k) => { next.position.y = -(1 - k) * sN * 0.35; next.scale.setScalar(0.92 + 0.08 * k); });
    // glide the camera to frame it, keeping the angle you're looking from
    const dir = camera.position.clone().sub(controls.target).normalize(), fromT = controls.target.clone(), fromP = camera.position.clone(), toP = f.target.clone().add(dir.multiplyScalar(f.dist));
    if (instant) { controls.target.copy(f.target); camera.position.copy(toP); controls.update(); }
    else animate(0.4, (k) => { controls.target.lerpVectors(fromT, f.target, k); camera.position.lerpVectors(fromP, toP, k); });
    controls.minDistance = f.r * 0.6; controls.maxDistance = f.dist * 6;
  }
  function setLook(n) {
    const wasGeom = geomLook(); look = (n + 4) % 4; $('.look').textContent = 'Look: ' + 'ABCD'[look]; $('.badge').textContent = 'Look ' + 'ABCD'[look] + ' · ' + ['game', 'new lighting', 'smoother geometry', 'new lighting + smoother'][look];
    if (wasGeom !== geomLook()) { const pos = current.position.clone(), sc = current.scale.clone(); scene.remove(current); current = build(idx); current.position.copy(pos); current.scale.copy(sc); scene.add(current); } // rebuild in place, camera untouched
    setLights(current);
  }

  // ---- Snap: the current object in all four looks, 2x2, labeled, from this camera angle ----
  async function snap() {
    const W = renderer.domElement.width, H = renderer.domElement.height, out = document.createElement('canvas'); out.width = W * 2; out.height = H * 2; const ctx = out.getContext('2d');
    const keep = look; for (const a of anims) { a.fn(1); if (a.done) a.done(); } anims.length = 0;
    for (let n = 0; n < 4; n++) {
      setLook(n); renderer.render(scene, camera); ctx.drawImage(renderer.domElement, (n % 2) * W, Math.floor(n / 2) * H); // copied right after rendering
      const fs = Math.round(H * 0.05); ctx.font = `900 ${fs}px Nunito, system-ui, sans-serif`; ctx.fillStyle = 'rgba(36,34,42,.85)'; ctx.fillRect((n % 2) * W + fs * 0.4, Math.floor(n / 2) * H + fs * 0.4, fs * 1.6, fs * 1.4);
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('ABCD'[n], (n % 2) * W + fs * 1.2, Math.floor(n / 2) * H + fs * 1.1);
    }
    setLook(keep);
    const blob = await new Promise((res) => out.toBlob(res, 'image/png')), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `cuesies-${list[idx].name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-looks.png`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  // ---- input (the game's own keys never see these: this listener runs first and stops them) ----
  $('.prev').onclick = () => show(idx - 1); $('.next').onclick = () => show(idx + 1); $('.look').onclick = () => setLook(look + 1); $('.snap').onclick = () => snap();
  for (const t of ['keydown', 'keyup']) addEventListener(t, (e) => {
    e.stopPropagation(); if (t !== 'keydown') return;
    if (e.key === 'ArrowLeft') show(idx - 1); else if (e.key === 'ArrowRight') show(idx + 1); else if ('1234'.includes(e.key) && e.key.length === 1) setLook(+e.key - 1); else if (e.key === 'p' || e.key === 'P') snap();
  }, true);

  // ---- loop ----
  show(0, true); setLook(0);
  let last = performance.now();
  (function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    for (let i = anims.length - 1; i >= 0; i--) { const a = anims[i]; a.t += dt; const k = ease(Math.min(1, a.t / a.dur)); a.fn(k); if (a.t >= a.dur) { anims.splice(i, 1); if (a.done) a.done(); } }
    if (current && current.userData.tick) try { current.userData.tick(dt, now / 1000); } catch (e) {}
    controls.update(); renderer.render(scene, camera); requestAnimationFrame(loop);
  })(last);
  window.__renders = { list, show, setLook, snap, get idx() { return idx; } }; // for automated checks
  void size; void fitR;
}
