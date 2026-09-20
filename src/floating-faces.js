import { sfx } from './audio.js';

class FloatingFaceSystem {
  constructor(container) {
    this.container = container;
    this.faces = [];
    this.active = true;
    this.customImages = [];
    this.goofyStickers = [
      '🤪', '🗿', '😎', '🎉', '🐸', '🤡', '🕺', '🔥', '✨'
    ];
  }

  init() {
    // Spawn initial pool of faces
    this.spawnFace('/faces/rasse.jpg', 'Rasmus (Host)', true);
    this.spawnFace(null, '🎙️ Elias', false);
    this.spawnFace('/faces/host2.jpg', 'Host Crew', true);
    this.spawnFace(null, '🤪', false);
    this.spawnFace(null, '🗿', false);
    this.spawnFace('/faces/rasse.jpg', 'Rasse', true);

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);

    window.addEventListener('resize', () => {
      this.handleResize();
    });
  }

  handleResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.faces.forEach(f => {
      if (f.x > w - f.size) f.x = w - f.size;
      if (f.y > h - f.size) f.y = h - f.size;
    });
  }

  spawnFace(imgSrc, label, isImage = true) {
    const size = isImage ? 80 + Math.random() * 20 : 65 + Math.random() * 15;
    const el = document.createElement('div');
    el.className = 'floating-face';
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;

    if (isImage && imgSrc) {
      const img = document.createElement('img');
      img.src = imgSrc;
      img.alt = label || 'Party Host';
      img.onerror = () => {
        el.innerHTML = '<span class="face-emoji">🎉</span>';
      };
      el.appendChild(img);
    } else {
      el.innerHTML = `<span class="face-emoji">${imgSrc || label}</span>`;
    }

    // Badge
    if (label && isImage) {
      const tag = document.createElement('span');
      tag.className = 'face-tag';
      tag.textContent = label;
      el.appendChild(tag);
    }

    this.container.appendChild(el);

    const winW = window.innerWidth;
    const winH = window.innerHeight;

    const faceObj = {
      el,
      size,
      x: Math.random() * (winW - size - 40) + 20,
      y: Math.random() * (winH - size - 40) + 20,
      vx: (Math.random() - 0.5) * 2.2 + (Math.random() > 0.5 ? 1.2 : -1.2),
      vy: (Math.random() - 0.5) * 2.2 + (Math.random() > 0.5 ? 1.2 : -1.2),
      phase: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.003 + Math.random() * 0.002,
      isSpinning: false
    };

    // Click on face to fling it & boing
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      sfx.playBoing();
      faceObj.vx *= -1.8;
      faceObj.vy *= -1.8;
      faceObj.isSpinning = true;
      el.classList.add('face-clicked');
      setTimeout(() => {
        el.classList.remove('face-clicked');
        faceObj.isSpinning = false;
      }, 600);
    });

    this.faces.push(faceObj);
  }

  addCustomFace(imgUrl, name = 'Party Legend') {
    this.customImages.push(imgUrl);
    this.spawnFace(imgUrl, name, true);
    sfx.playClownHorn();
  }

  addRandomGoofyFace() {
    const emojis = this.goofyStickers;
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    this.spawnFace(null, emoji, false);
    sfx.playBoing();
  }

  animate() {
    if (!this.active) return;

    const winW = window.innerWidth;
    const winH = window.innerHeight;
    const now = Date.now();

    for (let i = 0; i < this.faces.length; i++) {
      const f = this.faces[i];
      f.x += f.vx;
      f.y += f.vy;

      // Bounce horizontally
      if (f.x <= 10) {
        f.x = 10;
        f.vx = Math.abs(f.vx);
      } else if (f.x + f.size >= winW - 10) {
        f.x = winW - f.size - 10;
        f.vx = -Math.abs(f.vx);
      }

      // Bounce vertically
      if (f.y <= 10) {
        f.y = 10;
        f.vy = Math.abs(f.vy);
      } else if (f.y + f.size >= winH - 10) {
        f.y = winH - f.size - 10;
        f.vy = -Math.abs(f.vy);
      }

      // If not doing a click-spin, wobble gently so face is always right-side up!
      if (!f.isSpinning) {
        const tilt = Math.sin(now * f.wobbleSpeed + f.phase) * 14;
        f.el.style.transform = `translate3d(${f.x}px, ${f.y}px, 0) rotate(${tilt}deg)`;
      } else {
        f.el.style.transform = `translate3d(${f.x}px, ${f.y}px, 0)`;
      }
    }

    requestAnimationFrame(this.animate);
  }

  toggle() {
    this.active = !this.active;
    this.container.style.display = this.active ? 'block' : 'none';
    if (this.active) requestAnimationFrame(this.animate);
    return this.active;
  }
}

export function initFloatingFaces(container) {
  const system = new FloatingFaceSystem(container);
  system.init();
  return system;
}
