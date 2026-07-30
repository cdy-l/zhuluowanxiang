var container = document.getElementById('particles');
if (!container) throw 'no container';

var scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a1a);

var camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 1000);
camera.position.set(0, 3, 28);

var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
container.innerHTML = '';
container.appendChild(renderer.domElement);

var ctrl = new THREE.OrbitControls(camera, document.body);
document.body.style.touchAction = '';
document.body.style.userSelect = '';
ctrl.enableDamping = true;
ctrl.dampingFactor = 0.08;
ctrl.enablePan = false;
ctrl.rotateSpeed = 0.8;
ctrl.zoomSpeed = 0.6;
ctrl.minDistance = 10;
ctrl.maxDistance = 50;

addEventListener('resize', function() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

var PTC = 500000;
var pos = new Float32Array(PTC * 3);
var col = new Float32Array(PTC * 3);
var siz = new Float32Array(PTC);
var shf = new Float32Array(PTC * 4);

for (var i = 0; i < PTC; i++) {
  var i3 = i * 3;
  var x, y, z;
  if (i < 150000) {
    var theta = Math.random() * Math.PI * 2;
    var phi = Math.acos(2 * Math.random() - 1);
    var r = Math.random() * 0.5 + 9.5;
    x = Math.sin(phi) * Math.cos(theta) * r;
    y = Math.sin(phi) * Math.sin(theta) * r;
    z = Math.cos(phi) * r;
  } else {
    var rMin = 10, rMax = 42;
    var rand = Math.pow(Math.random(), 1.5);
    var radius = Math.sqrt(rMax * rMax * rand + (1 - rand) * rMin * rMin);
    var angle = Math.random() * Math.PI * 2;
    x = Math.cos(angle) * radius;
    z = Math.sin(angle) * radius;
    y = (Math.random() - 0.5) * 2;
  }
  pos[i3] = x; pos[i3 + 1] = y; pos[i3 + 2] = z;
  var d = Math.min(Math.sqrt(x*x + y*y + z*z) / 42, 1);
  col[i3] = 0.05 + 0.85 * d;
  col[i3 + 1] = 0.0 + 0.5 * d;
  col[i3 + 2] = 1.0 - 0.5 * d;
  siz[i] = Math.random() * 0.8 + 0.2;
  shf[i3] = Math.random() * 6.2832;
  shf[i3 + 1] = Math.random() * 6.2832;
  shf[i3 + 2] = (Math.random() * 0.9 + 0.1) * 0.25;
  shf[i3 + 3] = Math.random() * 0.8 + 0.2;
}

var geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
geo.setAttribute('size', new THREE.BufferAttribute(siz, 1));
geo.setAttribute('shift', new THREE.BufferAttribute(shf, 4));

var pMat = new THREE.ShaderMaterial({
  uniforms: { time: { value: 0 } },
  vertexShader: [
    'attribute float size;',
    'attribute vec4 shift;',
    'varying vec3 vColor;',
    'uniform float time;',
    'void main() {',
    '  vec3 p = position;',
    '  float t = time;',
    '  float moveT = mod(shift.x + shift.z * t, 6.2832);',
    '  float moveS = mod(shift.y + shift.z * t, 6.2832);',
    '  p += vec3(cos(moveS)*sin(moveT), cos(moveT), sin(moveS)*sin(moveT)) * shift.w * 0.6;',
    '  vec4 mv = modelViewMatrix * vec4(p, 1.0);',
    '  gl_PointSize = size * (80.0 / -mv.z);',
    '  gl_Position = projectionMatrix * mv;',
    '  float d = length(abs(p) / vec3(42.0, 10.0, 42.0));',
    '  vColor = mix(vec3(0.0,0.45,1.0), vec3(0.35,0.0,0.8), d);',
    '}'
  ].join('\n'),
  fragmentShader: [
    'varying vec3 vColor;',
    'void main() {',
    '  float d = length(gl_PointCoord - 0.5);',
    '  if (d > 0.5) discard;',
    '  float a = smoothstep(0.5, 0.05, d) * 0.8;',
    '  gl_FragColor = vec4(vColor, a);',
    '}'
  ].join('\n'),
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

var pts = new THREE.Points(geo, pMat);
pts.rotation.order = 'ZYX';
pts.rotation.z = 0.2;
scene.add(pts);

var PLANETS = [
  { label: 'VIP视频', page: 'vip-video', color: 0xff3366, r: 0.35 },
  { label: 'VIP音乐', page: 'vip-music', color: 0x00d4ff, r: 0.3 },
  { label: '影视资讯', page: 'movie-info', color: 0xff6666, r: 0.3 },
  { label: 'Steam折扣', page: 'steam-deals', color: 0x2a475e, r: 0.3 },
  { label: '小说爬取', page: 'novel', color: 0x7c3aed, r: 0.35 },
  { label: '商品比价', page: 'price-compare', color: 0xff66aa, r: 0.3 },
  { label: 'AI助手', page: 'ai-tools', color: 0xffaa00, r: 0.32 },
  { label: '热搜热榜', page: 'trending', color: 0xff4444, r: 0.3 },
  { label: '随机点名', page: 'name-picker', color: 0xff88ff, r: 0.3 },
  { label: '历史上的今天', page: 'today-in-history', color: 0x44aaff, r: 0.28 },
  { label: '小游戏', page: 'mini-games', color: 0xffcc00, r: 0.32 },
];

var planets = [];
var ray = new THREE.Raycaster();
var ptr = new THREE.Vector2(999, 999);
var NEBULA_PTC = 800;

for (var pi = 0; pi < PLANETS.length; pi++) {
  var p = PLANETS[pi];
  var g = new THREE.Group();
  var hitBox = new THREE.Mesh(
    new THREE.SphereGeometry(p.r * 2.5, 6, 6),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  g.add(hitBox);

  var np = new Float32Array(NEBULA_PTC * 3);
  var nc = new Float32Array(NEBULA_PTC * 3);
  var ns = new Float32Array(NEBULA_PTC);
  var baseCol = new THREE.Color(p.color);
  var maxR = p.r * 3.0;

  for (var j = 0; j < NEBULA_PTC; j++) {
    var j3 = j * 3;
    var theta2 = Math.random() * 6.2832;
    var phi2 = Math.acos(2 * Math.random() - 1);
    var r2 = Math.pow(Math.random(), 3) * maxR;
    np[j3] = Math.sin(phi2) * Math.cos(theta2) * r2;
    np[j3 + 1] = Math.sin(phi2) * Math.sin(theta2) * r2;
    np[j3 + 2] = Math.cos(phi2) * r2;
    var bright = 0.9 + Math.random() * 0.1;
    var c2 = baseCol.clone().multiplyScalar(bright);
    nc[j3] = Math.min(1, c2.r); nc[j3 + 1] = Math.min(1, c2.g); nc[j3 + 2] = Math.min(1, c2.b);
    ns[j] = Math.random() * 0.3 + 0.08;
  }

  var ng = new THREE.BufferGeometry();
  ng.setAttribute('position', new THREE.BufferAttribute(np, 3));
  ng.setAttribute('color', new THREE.BufferAttribute(nc, 3));
  ng.setAttribute('size', new THREE.BufferAttribute(ns, 1));

  var nm = new THREE.PointsMaterial({
    size: 0.08,
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 0.9,
    sizeAttenuation: true,
  });

  g.add(new THREE.Points(ng, nm));

  var canvas2 = document.createElement('canvas');
  canvas2.width = 512; canvas2.height = 128;
  var ctx = canvas2.getContext('2d');
  ctx.clearRect(0, 0, 512, 128);
  ctx.font = 'bold 42px "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#' + p.color.toString(16).padStart(6, '0');
  ctx.shadowBlur = 20;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(p.label, 256, 54);

  var labelMat = new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(canvas2),
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  var label = new THREE.Sprite(labelMat);
  label.position.y = -p.r * 1.6 - 0.8;
  label.scale.set(3, 0.6, 1);
  g.add(label);

  var theta = Math.random() * 6.2832;
  var phi = Math.acos(2 * Math.random() - 1);
  var dist = 10 + Math.random() * 8;
  g.position.set(
    Math.sin(phi) * Math.cos(theta) * dist,
    (Math.random() - 0.5) * 12,
    Math.sin(phi) * Math.sin(theta) * dist
  );
  g.userData = { pd: p, speed: 0.3 + Math.random() * 0.4, hover: false, mat: nm, basePos: g.position.clone(), phase: Math.random() * 6.2832 };
  scene.add(g);
  planets.push(g);
}

scene.add(new THREE.AmbientLight(0x222244, 0.3));
var dl = new THREE.DirectionalLight(0xffffff, 0.6);
dl.position.set(10, 20, 10);
scene.add(dl);

function isUIElement(el) {
  return el.closest('.tool-body, #tutorial-card, input, textarea, button, select, .glow-btn, .glow-input, .platform-btn, .crawler-card, .nav-item, .music-item');
}

document.body.addEventListener('click', function(e) {
  if (e.target.closest('.sidebar, .topbar, .tool-body, .crawler-card, .glow-btn, .glow-input, .platform-btn, .music-item, input, textarea, button, select, a, pre, code')) return;
  ptr.x = (e.clientX / innerWidth) * 2 - 1;
  ptr.y = -(e.clientY / innerHeight) * 2 + 1;
  ray.setFromCamera(ptr, camera);
  var hits = ray.intersectObjects(planets, true);
  if (hits.length) {
    var o = hits[0].object;
    while (o.parent && planets.indexOf(o) < 0) o = o.parent;
    if (planets.indexOf(o) >= 0 && o.userData.pd.page && typeof switchPage === 'function')
      switchPage(o.userData.pd.page);
  }
});

var clock = new THREE.Clock();

(function loop() {
  requestAnimationFrame(loop);
  ctrl.update();
  var t = clock.getElapsedTime() * 0.35;
  pMat.uniforms.time.value = t * 3.1416;
  pts.rotation.y = t * 0.03;

  ray.setFromCamera(ptr, camera);
  var hits = ray.intersectObjects(planets, true);
  for (var pi2 = 0; pi2 < planets.length; pi2++) { planets[pi2].userData.hover = false; }
  if (hits.length) {
    var o = hits[0].object;
    while (o.parent && planets.indexOf(o) < 0) o = o.parent;
    if (planets.indexOf(o) >= 0) o.userData.hover = true;
  }

  for (var pi2 = 0; pi2 < planets.length; pi2++) {
    var pl = planets[pi2];
    var ud = pl.userData;
    if (ud.basePos) {
      pl.position.x = ud.basePos.x + Math.sin(t * ud.speed + ud.phase) * 1.2;
      pl.position.y = ud.basePos.y + Math.cos(t * ud.speed * 0.7 + ud.phase) * 0.8;
      pl.position.z = ud.basePos.z + Math.sin(t * ud.speed * 0.5 + ud.phase) * 0.8;
    }
    var h = ud.hover;
    var pulse = 1 + 0.08 * Math.sin(t * 5);
    var scale = h ? (1.6 + 0.15 * Math.sin(t * 4)) * pulse : pulse;
    pl.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.06);
    for (var ci = 0; ci < pl.children.length; ci++) {
      var c = pl.children[ci];
      if (c.isPoints && c.material) {
        c.material.size = h ? 0.12 + 0.04 * (0.5 + 0.5 * Math.sin(t * 3)) : 0.08;
        c.material.opacity = h ? 1.0 : 0.9;
      }
      if (c.isSprite) {
        c.material.opacity = h ? 1.0 : 0.7;
        c.scale.lerp(new THREE.Vector3(h ? 3.6 : 3, h * 0.24 + 0.56, 1), 0.06);
      }
    }
  }

  renderer.render(scene, camera);
})();
