import { sfx } from './audio.js';

const SNARKY_QUOTES = [
  "Nice try! 😂",
  "Declining is legally forbidden! 🚫",
  "Can't touch this! 🏃‍♂️💨",
  "Tuparit attendance is MANDATORY!",
  "Request denied by Strategic Partnerships! 📉",
  "Who taught you how to click? 💀",
  "Error 404: Dismissal impossible!",
  "Bro really tried to decline 😭",
  "Nope! Try the shiny green button! ✨",
  "Are you afraid of Jackie? 🍸",
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

  // The button stays near its home spot: each dodge hops it ~3cm (about
  // 115px) away from the pointer, never further than MAX_DRIFT from home.
  const JUMP = 115;
  const MAX_DRIFT = 150;
  let offX = 0;
  let offY = 0;

  function dodge(cursorX, cursorY) {
    // If a modal is open, completely pause dodging so user can interact with forms
    if (document.querySelector('.modal-backdrop.active')) {
      hideTaunt();
      return;
    }

    const now = Date.now();
    if (now - lastMoveTime < 250) return; // throttle
    lastMoveTime = now;

    const rect = btnElement.getBoundingClientRect();
    const homeLeft = rect.left - offX;
    const homeTop = rect.top - offY;

    let dx = rect.left + rect.width / 2 - cursorX;
    let dy = rect.top + rect.height / 2 - cursorY;
    let angle = Math.hypot(dx, dy) < 1 ? Math.random() * Math.PI * 2 : Math.atan2(dy, dx);
    angle += (Math.random() - 0.5) * 1.2;

    const margin = 12;
    const winW = document.documentElement.clientWidth;
    let newX = offX + Math.cos(angle) * JUMP;
    let newY = offY + Math.sin(angle) * JUMP;

    // Stay close to home, then keep horizontally on screen
    const drift = Math.hypot(newX, newY);
    if (drift > MAX_DRIFT) {
      newX *= MAX_DRIFT / drift;
      newY *= MAX_DRIFT / drift;
    }
    newX = Math.min(Math.max(newX, margin - homeLeft), winW - margin - rect.width - homeLeft);

    offX = newX;
    offY = newY;
    btnElement.style.position = 'relative';
    btnElement.style.zIndex = '120';
    btnElement.style.transition = 'transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)';
    btnElement.style.transform = `translate(${offX}px, ${offY}px) rotate(${(Math.random() - 0.5) * 14}deg)`;

    showTaunt(homeLeft + offX, homeTop + offY);
  }

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
    lastMoveTime = 0;
    dodge(e.clientX || rect.left, e.clientY || rect.top);
    alert("NICE TRY! Dismissing is disabled by Tuparit Supreme Council 🛑");
    return false;
  });
}
