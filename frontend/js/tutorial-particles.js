(function() {
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
let W, H, particles = [], mouse = { x: -9999, y: -9999 }, active = true, running = false, frame;
const COUNT = 200;

function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
resize();
window.addEventListener('resize', resize);

canvas.style.cssText = 'position:fixed;inset:0;z-index:0;pointer-events:none;display:none';
document.getElementById('particles').appendChild(canvas);

class Particle {
  constructor() {
    this.reset();
  }
  reset() {
    this.x = Math.random() * W;
    this.y = Math.random() * H;
    this.vx = (Math.random() - 0.5) * 0.3;
    this.vy = (Math.random() - 0.5) * 0.3;
    this.r = Math.random() * 2 + 0.5;
    this.alpha = Math.random() * 0.6 + 0.2;
    this.baseAlpha = this.alpha;
    this.pulse = Math.random() * Math.PI * 2;
    this.pulseSpeed = Math.random() * 0.02 + 0.005;
    this.hue = 220 + Math.random() * 80;
  }
  update() {
    this.pulse += this.pulseSpeed;
    if (active && mouse.x >= 0) {
      const dx = mouse.x - this.x, dy = mouse.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 150) {
        const force = (1 - dist / 150) * 0.8;
        this.vx += (dx / dist) * force * 0.05;
        this.vy += (dy / dist) * force * 0.05;
      }
    }
    this.vx *= 0.99;
    this.vy *= 0.99;
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < 0 || this.x > W) this.vx *= -1;
    if (this.y < 0 || this.y > H) this.vy *= -1;
  }
  draw() {
    const a = this.baseAlpha * (0.7 + 0.3 * Math.sin(this.pulse));
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${this.hue}, 80%, 60%, ${a})`;
    ctx.fill();
  }
}

for (let i = 0; i < COUNT; i++) particles.push(new Particle());

let links = [], linkTimer = 0;
function updateLinks() {
  links = [];
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) links.push({ i, j, alpha: (1 - dist / 120) * 0.25 });
    }
  }
}

const card = document.getElementById('tutorial-card');

document.addEventListener('pointermove', e => {
  if (!running) return;
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

document.addEventListener('mouseleave', () => { if (running) { mouse.x = -9999; mouse.y = -9999; } });

if (card) {
  card.addEventListener('mouseenter', () => { if (running) { active = false; mouse.x = -9999; mouse.y = -9999; } });
  card.addEventListener('mouseleave', () => { if (running) { active = true; } });
}

function loop() {
  frame = requestAnimationFrame(loop);
  ctx.clearRect(0, 0, W, H);
  for (const p of particles) p.update();
  for (const p of particles) p.draw();
  linkTimer++;
  if (linkTimer % 20 === 0) updateLinks();
  for (const l of links) {
    ctx.beginPath();
    ctx.moveTo(particles[l.i].x, particles[l.i].y);
    ctx.lineTo(particles[l.j].x, particles[l.j].y);
    ctx.strokeStyle = `hsla(230, 60%, 70%, ${l.alpha})`;
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
}

window.__tutorialParticles = {
  show: function() {
    running = true;
    canvas.style.display = 'block';
    resize();
    if (!frame) loop();
  },
  hide: function() {
    running = false;
    canvas.style.display = 'none';
    mouse.x = -9999; mouse.y = -9999; active = true;
    if (frame) { cancelAnimationFrame(frame); frame = null; }
  }
};
})();
