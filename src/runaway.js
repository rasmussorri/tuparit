import { sfx } from './audio.js';

const SNARKY_QUOTES = [
  "Nice try! 😂",
  "Declining is legally forbidden! 🚫",
  "Can't touch this! 🏃‍♂️💨",
  "Tuparit attendance is MANDATORY!",
  "Google Strategic Partnerships denied your request! 📉",
  "Who taught you how to click? 💀",
  "Error 404: Dismissal impossible!",
  "Bro really tried to decline 😭",
  "Nope! Try the shiny green button! ✨",
  "Are you afraid of Punavuoren Ahven? 🐟",
  "Your invitation acceptance is non-negotiable!"
];

export function setupRunawayButton(btnElement, containerElement) {
  if (!btnElement) return;

  let lastMoveTime = 0;
  let quoteIndex = 0;
  let evasionCount = 0;
  let tauntTimer = null;

  // Create floating bubble for taunts
  const bubble = document.createElement('div');
  bubble.className = 'runaway-taunt-bubble';
  bubble.style.display = 'none';
  document.body.appendChild(bubble);

  function hideTaunt() {
    bubble.style.display = 'none';
  }

  function showTaunt(x, y) {
    // Don't show taunts if any modal is currently open
    if (document.querySelector('.modal-backdrop.active')) {
      hideTaunt();
      return;
    }

    clearTimeout(tauntTimer);
    const quote = SNARKY_QUOTES[quoteIndex % SNARKY_QUOTES.length];
    quoteIndex++;
    evasionCount++;

    bubble.textContent = quote;
    bubble.style.display = 'block';
    
    // Position bubble above the button
    const bubbleWidth = 240;
    const clampedX = Math.max(16, Math.min(window.innerWidth - bubbleWidth - 16, x - 40));
    const clampedY = Math.max(20, y - 48);

    bubble.style.left = `${clampedX}px`;
    bubble.style.top = `${clampedY}px`;
    bubble.classList.remove('pop-anim');
    void bubble.offsetWidth; // trigger reflow
    bubble.classList.add('pop-anim');

    if (evasionCount % 3 === 0) {
      sfx.playClownHorn();
    } else {
      sfx.playWhoosh();
    }

    // Auto-hide taunt after 1.5 seconds so it doesn't linger forever
    tauntTimer = setTimeout(() => {
      hideTaunt();
    }, 1500);
  }

  function dodge(cursorX, cursorY) {
    // If a modal is open, completely pause dodging so user can interact with forms
    if (document.querySelector('.modal-backdrop.active')) {
      hideTaunt();
      return;
    }

    const now = Date.now();
    if (now - lastMoveTime < 50) return; // throttle
    lastMoveTime = now;

    const rect = btnElement.getBoundingClientRect();
    const btnCenterX = rect.left + rect.width / 2;
    const btnCenterY = rect.top + rect.height / 2;

    const dx = btnCenterX - cursorX;
    const dy = btnCenterY - cursorY;
    const dist = Math.hypot(dx, dy);

    // Proximity threshold: 140px
    if (dist < 140 || dist === 0) {
      const winW = window.innerWidth;
      const winH = window.innerHeight;
      const safeMargin = 24;

      // Calculate jump
      let moveAngle = Math.atan2(dy, dx);
      if (dist === 0) moveAngle = Math.random() * Math.PI * 2;

      // Add a bit of randomness to angle
      moveAngle += (Math.random() - 0.5) * 0.8;

      const jumpDistance = 180 + Math.random() * 120;
      let newX = rect.left + Math.cos(moveAngle) * jumpDistance;
      let newY = rect.top + Math.sin(moveAngle) * jumpDistance;

      // Keep within visible bounds
      if (newX < safeMargin || newX + rect.width > winW - safeMargin) {
        newX = Math.random() * (winW - rect.width - safeMargin * 2) + safeMargin;
      }
      if (newY < safeMargin || newY + rect.height > winH - safeMargin) {
        newY = Math.random() * (winH - rect.height - safeMargin * 2) + safeMargin;
      }

      btnElement.style.position = 'fixed';
      btnElement.style.zIndex = '120';
      btnElement.style.left = `${newX}px`;
      btnElement.style.top = `${newY}px`;
      btnElement.style.transition = 'all 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)';
      btnElement.style.transform = `rotate(${(Math.random() - 0.5) * 14}deg) scale(1.05)`;

      showTaunt(newX, newY);
    }
  }

  // Mouse move listener
  window.addEventListener('mousemove', (e) => {
    dodge(e.clientX, e.clientY);
  });

  // Touch support
  btnElement.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    dodge(touch.clientX, touch.clientY);
  }, { passive: false });

  // On hover attempt
  btnElement.addEventListener('mouseenter', (e) => {
    dodge(e.clientX, e.clientY);
  });

  // Tab focus
  btnElement.addEventListener('focus', () => {
    const rect = btnElement.getBoundingClientRect();
    dodge(rect.left + 5, rect.top + 5);
    btnElement.blur();
  });

  // Superhuman click attempt
  btnElement.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    sfx.playVineBoom();
    const rect = btnElement.getBoundingClientRect();
    dodge(rect.left, rect.top);
    alert("NICE TRY! Dismissing is disabled by Tuparit Supreme Council 🛑");
    return false;
  });
}
