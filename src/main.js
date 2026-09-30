import confetti from 'canvas-confetti';
import { sfx } from './audio.js';
import { setupRunawayButton } from './runaway.js';
import { initFloatingFaces } from './floating-faces.js';
import { fetchGuests, addGuest } from './guests.js';

const GUEST_REFRESH_MS = 30000;

// Spotify playlist ID (the part after /playlist/ in the share link).
// Make the playlist collaborative in Spotify (... > Invite collaborators) so guests can add songs.
const SPOTIFY_PLAYLIST_ID = '5XufZJedvbpTLGIIQfxauX';
// Collaborator invite link: opening it lets guests join and add songs.
const SPOTIFY_COLLAB_URL = 'https://open.spotify.com/playlist/5XufZJedvbpTLGIIQfxauX?si=YPzgyKucRwWJC4H5UE76oQ&utm_source=copy-link&pi=iIkhhcz9SPuo8&pt=67060aead177aa439bc92607e2f57422';


const HELSINKI_CLUBS = [
  'Kaiku (Kaikukatu) 🎶',
  'Post Bar (Teollisuuskatu) 🎧',
  'Ääniwalli (Vallila) 🔊',
  'Apollo Live Club (Mannerheimintie) 🎤',
  'Teatteri Klubi (Pohjoisesplanadi) ✨',
  'Heidi\'s Bier Bar (Yrjönkatu) 🍻',
  'Kuudes Linja (Kallio) 🎸',
  'Kaivohuone (Kaivopuisto) 🌴'
];

// The "roulette" is rigged — it's always Jackie, then some goofy afterparty.
const RIGGED_RESULT = "🍸 Jackie's... then some goofy ahh afterparty 🎉";

class TuparitApp {
  constructor() {
    this.guests = [];
    this.guestQuery = '';
    this.selectedDiets = new Set();
    this.faceSystem = null;
  }

  init() {
    // 1. Setup Floating Faces
    const facesContainer = document.getElementById('faces-container');
    if (facesContainer) {
      this.faceSystem = initFloatingFaces(facesContainer);
    }

    // 2. Setup Runaway Dismiss Button
    const btnDismiss = document.getElementById('btn-dismiss');
    const heroActions = document.getElementById('hero-actions');
    if (btnDismiss) {
      setupRunawayButton(btnDismiss, heroActions);
    }

    // 3. Setup Sound Controls
    const btnSound = document.getElementById('btn-sound-toggle');
    if (btnSound) {
      btnSound.addEventListener('click', () => {
        const isMuted = sfx.toggleMute();
        const icon = document.getElementById('sound-icon');
        const text = document.getElementById('sound-text');
        if (isMuted) {
          icon.textContent = '🔇';
          text.textContent = 'SFX: MUTED';
        } else {
          icon.textContent = '🔊';
          text.textContent = 'SFX: ON';
          sfx.playBoing();
        }
      });
    }

    // 4. Setup Modals
    this.setupRSVPModal();
    this.setupFaceModal();

    // 5. Setup Nightclub Roulette
    this.setupRoulette();

    // 6. Setup CTA Urgency Timer (20s Loop)
    this.setupUrgencyTimer();

    // 7. Setup Guests Search & Render
    this.renderGuests();
    this.refreshGuests();
    setInterval(() => this.refreshGuests(), GUEST_REFRESH_MS);
    const searchInput = document.getElementById('guest-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.guestQuery = e.target.value;
        this.renderGuests(this.guestQuery);
      });
    }

    // Sound initialization on first user interaction anywhere
    const initAudioListener = () => {
      sfx.init();
      window.removeEventListener('click', initAudioListener);
      window.removeEventListener('keydown', initAudioListener);
    };
    window.addEventListener('click', initAudioListener);
    window.addEventListener('keydown', initAudioListener);
  }

  async refreshGuests() {
    try {
      this.guests = await fetchGuests();
      this.renderGuests(this.guestQuery);
    } catch (e) {
      console.warn('Could not load guest list', e);
    }
  }

  setupRSVPModal() {
    const modal = document.getElementById('rsvp-modal');
    const btnAccept = document.getElementById('btn-accept');
    const btnSecondary = document.getElementById('btn-rsvp-open-secondary');
    const btnClose = document.getElementById('btn-close-rsvp');
    const rsvpForm = document.getElementById('rsvp-form');
    const hypeRange = document.getElementById('guest-hype-range');
    const hypeDisplay = document.getElementById('hype-val-display');

    const openModal = () => {
      sfx.playFanfare();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      modal.classList.add('active');
      document.getElementById('guest-name-input').focus();
    };

    const closeModal = () => {
      modal.classList.remove('active');
    };

    if (btnAccept) btnAccept.addEventListener('click', openModal);
    if (btnSecondary) btnSecondary.addEventListener('click', openModal);
    if (btnClose) btnClose.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Hype range slider & real-time Goofy Ahh quips
    const hypeQuip = document.getElementById('hype-quip');

    function updateHypeUI(val) {
      if (!hypeDisplay) return;
      hypeDisplay.textContent = `${val}%`;

      if (!hypeQuip) return;
      if (val === 100) {
        hypeQuip.innerHTML = '🚨 <strong>100% MAXIMUM GIGACHAD AURA!</strong> Jackie awaits! 🍸🔥';
        hypeQuip.className = 'hype-quip-box max-hype';
        sfx.playBoing();
      } else if (val >= 90) {
        hypeQuip.textContent = `Bro is at ${val}%... why withhold that last bit? Push it to 100%! 👀`;
        hypeQuip.className = 'hype-quip-box high-hype';
      } else if (val >= 70) {
        hypeQuip.textContent = `${val}%? Decent effort, but Jackie requires 100% energy! 🍺`;
        hypeQuip.className = 'hype-quip-box mid-hype';
      } else if (val >= 40) {
        hypeQuip.textContent = `${val}%? Are you planning to leave at 20:00 or what? Step it up! 🥱`;
        hypeQuip.className = 'hype-quip-box low-hype';
      } else if (val >= 15) {
        hypeQuip.textContent = `Only ${val}%?! Emotional damage... why are you even coming? 💀`;
        hypeQuip.className = 'hype-quip-box low-hype';
      } else {
        hypeQuip.textContent = `${val}%?! Sub-zero sigma energy detected. Wake up bro! 🪦📉`;
        hypeQuip.className = 'hype-quip-box low-hype';
      }
    }

    if (hypeRange) {
      hypeRange.addEventListener('input', (e) => {
        updateHypeUI(parseInt(e.target.value, 10));
      });
    }

    // Form Submission (Only Name required)
    if (rsvpForm) {
      rsvpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('guest-name-input');
        const name = nameInput.value.trim();
        if (!name) return;

        const emailInput = document.getElementById('guest-email-input');
        const email = emailInput ? emailInput.value.trim() : '';

        const submitBtn = rsvpForm.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;
        try {
          await addGuest({ name, email, hype: hypeRange ? parseInt(hypeRange.value, 10) : null });
        } catch (err) {
          console.error('RSVP failed', err);
          alert('RSVP failed to save – check your connection and try again! 😭');
          return;
        } finally {
          if (submitBtn) submitBtn.disabled = false;
        }
        await this.refreshGuests();

        // Massive celebration
        sfx.playFanfare();
        confetti({
          particleCount: 160,
          spread: 100,
          origin: { y: 0.5 }
        });

        closeModal();
        rsvpForm.reset();
        if (hypeRange) hypeRange.value = 99;
        updateHypeUI(99);

        // Open Confirmation & Calendar / Wallet Pass Modal
        this.openConfirmationModal(name, email);
      });
    }
  }

  openConfirmationModal(guestName, guestEmail = '') {
    const confModal = document.getElementById('confirmation-modal');
    const btnCloseConf = document.getElementById('btn-close-confirmation');
    const nameLabel = document.getElementById('confirmed-guest-name');
    const passName = document.getElementById('pass-guest-name');
    const emailTarget = document.getElementById('automation-email-target');
    const googleCalBtn = document.getElementById('btn-add-google-cal');
    const appleCalBtn = document.getElementById('btn-download-apple-cal');
    const walletBtn = document.getElementById('btn-add-wallet-pass');
    const emailBtn = document.getElementById('btn-send-email-confirm');

    if (nameLabel) nameLabel.textContent = guestName;
    if (passName) passName.textContent = guestName;
    if (emailTarget) {
      emailTarget.textContent = guestEmail ? guestEmail : `${guestName} (Calendar reminders active)`;
    }

    // Google Calendar Link (18:00 - 24:00)
    if (googleCalBtn) {
      const title = encodeURIComponent("TUPARIT 2026 // The Goofy Ahh Housewarming");
      const dates = "20261017T180000/20261018T000000"; // 18:00 - 24:00
      const details = encodeURIComponent(
        `Yo ${guestName}!\n\n` +
        `Welcome to the most unhinged housewarming party of 2026!\n\n` +
        `SCHEDULE:\n` +
        `• 18:00 - Doors open & pre-games (BYOB)\n` +
        `• 22:00 - Jackie Pilgrimage 🍸\n` +
        `• 23:00 - Keynote: "The Age of AI" – Elias Tolppanen\n` +
        `• 01:00 - Nightclub TBA 🪩\n\n` +
        `DRESS CODE: All black (not strict)\n` +
        `IMPORTANT: Strictly BYOB! No host drink service, bring your own drinks! The hosts provide the snacks.`
      );
      const location = encodeURIComponent("Ullanlinna, Helsinki");
      googleCalBtn.href = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
    }

    // Apple / iCal .ics Download with 5 NATIVE ALARMS (1 week, 1 day, 12h, 2h, 15min)
    if (appleCalBtn) {
      appleCalBtn.onclick = () => {
        sfx.playBoing();
        const icsData = 
`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Tuparit 2026//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:tuparit-2026-${Date.now()}@tuparit.local
DTSTAMP:20260920T120000Z
DTSTART:20261017T150000Z
DTEND:20261017T210000Z
SUMMARY:TUPARIT 2026 // The Goofy Ahh Housewarming
DESCRIPTION:Yo ${guestName}!\\n\\n18:00 Doors open & pre-games (BYOB)\\n22:00 Jackie Pilgrimage\\n23:00 Keynote: The Age of AI – Elias Tolppanen\\n01:00 Nightclub TBA\\n\\nDress code: All black (not strict)\\nStrictly BYOB: Bring your own drinks! Hosts cover snacks.
LOCATION:Ullanlinna, Helsinki
STATUS:CONFIRMED
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:TUPARIT 2026: 1 week left! Check your BYOB supplies.
TRIGGER:-P7D
END:VALARM
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:TUPARIT 2026: Tomorrow we move! Chill your drinks.
TRIGGER:-P1D
END:VALARM
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:TUPARIT 2026: 12 hours left! Tolppa Keynote at 23:00.
TRIGGER:-PT12H
END:VALARM
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:TUPARIT 2026: Doors open in 2 hours (18:00)!
TRIGGER:-PT2H
END:VALARM
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:TUPARIT 2026: 15 MINUTES! Get inside, party is starting!
TRIGGER:-PT15M
END:VALARM
END:VEVENT
END:VCALENDAR`;

        const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tuparit-2026.ics';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      };
    }

    // Add to Apple / Google Wallet
    if (walletBtn) {
      walletBtn.onclick = () => {
        sfx.playBoing();
        confetti({ particleCount: 70, spread: 80 });
        alert(
          `📲 VIP WALLET PASS SAVED!\n\n` +
          `Guest: ${guestName}\n` +
          `Pass: TUPARIT-2026-VIP-420\n` +
          `Time: 18:00 – 24:00 (Midnight)\n` +
          `Keynote: Elias Tolppanen – "The Age of AI"\n\n` +
          `You can also download the Apple / iCal calendar event (.ics) with all 5 native alarms enabled!`
        );
      };
    }

    // Send Email Confirmation (mailto)
    if (emailBtn) {
      emailBtn.onclick = () => {
        const subject = encodeURIComponent("Confirmation: Tuparit 2026 VIP Pass");
        const body = encodeURIComponent(
          `Yo ${guestName}!\n\n` +
          `Your admission to Tuparit 2026 has been received and confirmed!\n\n` +
          `DATE & TIME: Saturday Oct 17, 2026 @ 18:00 - 24:00\n` +
          `LOCATION: Ullanlinna, Helsinki\n` +
          `SCHEDULE:\n` +
          `• 18:00 - Doors open & pre-games (BYOB)\n` +
          `• 22:00 - Jackie Pilgrimage 🍸\n` +
          `• 23:00 - Keynote: "The Age of AI" – Elias Tolppanen\n` +
          `• 01:00 - Nightclub TBA 🪩\n\n` +
          `DRESS CODE: All black (not strict)\n` +
          `REMINDER: Strictly BYOB. Bring your own drinks. Hosts cover the snacks.\n\n` +
          `See you at the crib!\n` +
          `– Rasmus Sorri, Elias Tolppanen & Axel Silvast`
        );
        window.location.href = `mailto:${guestEmail}?subject=${subject}&body=${body}`;
      };
    }

    if (confModal) {
      confModal.classList.add('active');
      if (btnCloseConf) {
        btnCloseConf.onclick = () => {
          confModal.classList.remove('active');
          const guestSection = document.getElementById('guest-list-section');
          if (guestSection) guestSection.scrollIntoView({ behavior: 'smooth' });
        };
      }
      confModal.onclick = (e) => {
        if (e.target === confModal) {
          confModal.classList.remove('active');
          const guestSection = document.getElementById('guest-list-section');
          if (guestSection) guestSection.scrollIntoView({ behavior: 'smooth' });
        }
      };
    }
  }

  setupFaceModal() {
    const modal = document.getElementById('face-modal');
    const btnOpen = document.getElementById('btn-add-face-modal');
    const btnClose = document.getElementById('btn-close-face');
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('face-file-input');
    const btnRandomEmoji = document.getElementById('btn-add-random-emoji-face');

    const openModal = () => modal.classList.add('active');
    const closeModal = () => modal.classList.remove('active');

    if (btnOpen) btnOpen.addEventListener('click', openModal);
    if (btnClose) btnClose.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    if (dropZone && fileInput) {
      dropZone.addEventListener('click', () => fileInput.click());

      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--accent-lime)';
      });

      dropZone.addEventListener('dragleave', () => {
        dropZone.style.borderColor = 'rgba(255, 255, 255, 0.2)';
      });

      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        if (e.dataTransfer.files.length > 0) {
          this.handleFaceUpload(e.dataTransfer.files[0]);
          closeModal();
        }
      });

      fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          this.handleFaceUpload(e.target.files[0]);
          closeModal();
        }
      });
    }

    if (btnRandomEmoji && this.faceSystem) {
      btnRandomEmoji.addEventListener('click', () => {
        this.faceSystem.addRandomGoofyFace();
        closeModal();
      });
    }
  }

  handleFaceUpload(file) {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file!');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (this.faceSystem) {
        this.faceSystem.addCustomFace(e.target.result, 'Guest Face');
      }
    };
    reader.readAsDataURL(file);
  }

  setupRoulette() {
    const spinBtn = document.getElementById('btn-spin-roulette');
    const resultDisplay = document.getElementById('roulette-result');
    if (!spinBtn || !resultDisplay) return;

    let spinning = false;

    spinBtn.addEventListener('click', () => {
      if (spinning) return;
      spinning = true;
      sfx.playWhoosh();
      spinBtn.disabled = true;

      let counter = 0;
      const totalTicks = 24;
      const interval = setInterval(() => {
        counter++;

        if (counter >= totalTicks) {
          // Rigged: no matter what flashes by, it always lands on Jackie.
          clearInterval(interval);
          resultDisplay.textContent = RIGGED_RESULT;
          spinning = false;
          spinBtn.disabled = false;
          sfx.playVineBoom();
          confetti({ particleCount: 50, spread: 60 });
          return;
        }

        const randomClub = HELSINKI_CLUBS[Math.floor(Math.random() * HELSINKI_CLUBS.length)];
        resultDisplay.textContent = randomClub;
        sfx.playBoing();
      }, 75);
    });
  }

  setupUrgencyTimer() {
    const timerDigits = document.getElementById('timer-digits');
    const progressFill = document.getElementById('timer-progress-fill');
    const subtext = document.getElementById('urgency-subtext');
    const priceDisplay = document.getElementById('price-hike-display');
    if (!timerDigits) return;

    const DURATION = 20; // 20-second countdown
    let timeLeft = DURATION;
    let loopCount = 0;

    const fakePrices = [
      '€0 ➔ €149',
      '€149 ➔ €499',
      '€499 ➔ €1,250',
      '€1,250 ➔ €5,000',
      'SPECIAL DEAL: €0 ➔ €9,999'
    ];

    const resetQuips = [
      '⚠️ TIME EXPIRED! Price hiked... Ah, we took mercy and granted a 20s grace period! 😂',
      '🚨 PRICE TRIPLED! But we reset the admission fee back to €0! 📉',
      '💀 Final chance expired! Quick, an emergency 20s grace period is active! 🏃‍♂️',
      '⚡ 48 people are trying to claim this free VIP spot! Accept now!'
    ];

    setInterval(() => {
      timeLeft -= 0.1;
      if (timeLeft <= 0) {
        loopCount++;
        timeLeft = DURATION;
        sfx.playClownHorn();

        if (priceDisplay) {
          priceDisplay.textContent = fakePrices[loopCount % fakePrices.length];
        }
        if (subtext) {
          subtext.textContent = resetQuips[loopCount % resetQuips.length];
        }
      }

      const secs = Math.max(0, Math.floor(timeLeft));
      const millis = Math.max(0, Math.floor((timeLeft - secs) * 10));
      timerDigits.textContent = `00:${secs < 10 ? '0' : ''}${secs}.${millis}`;

      if (progressFill) {
        const pct = (timeLeft / DURATION) * 100;
        progressFill.style.width = `${pct}%`;
      }
    }, 100);
  }

  renderGuests(filterQuery = '') {
    const grid = document.getElementById('guest-grid');
    const navCount = document.getElementById('nav-attendee-count');
    if (!grid) return;

    const query = filterQuery.toLowerCase().trim();
    const filtered = this.guests.filter(g => {
      if (!query) return true;
      return g.name.toLowerCase().includes(query);
    });

    if (navCount) {
      navCount.textContent = `${this.guests.length} Attending`;
    }

    grid.innerHTML = '';

    if (this.guests.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align:center; padding:36px 20px; color:var(--text-muted); font-size: 0.95rem;">
          No attendees yet — click <strong>"ACCEPT INVITATION"</strong> above to be the first legend on the board! 🚀
        </div>
      `;
      return;
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align:center; padding:36px 20px; color:var(--text-muted);">
        </div>
      `;
      grid.firstElementChild.textContent = `No attendees found matching "${filterQuery}".`;
      return;
    }

    filtered.forEach(guest => {
      const card = document.createElement('div');
      card.className = 'guest-name-card';

      card.innerHTML = `
        <div class="guest-name-badge">
          <span class="guest-avatar-icon">🎉</span>
          <span class="guest-full-name"></span>
        </div>
      `;
      card.querySelector('.guest-full-name').textContent = guest.name;

      grid.appendChild(card);
    });
  }
}

// Start application
document.addEventListener('DOMContentLoaded', () => {
  const app = new TuparitApp();
  app.init();
});

function initPlaylist() {
  const card = document.getElementById('playlist-card');
  if (!card) return;
  if (!SPOTIFY_PLAYLIST_ID) { card.style.display = 'none'; return; }
  const url = SPOTIFY_COLLAB_URL;
  const iframe = document.createElement('iframe');
  iframe.src = `https://open.spotify.com/embed/playlist/${SPOTIFY_PLAYLIST_ID}?theme=0`;
  iframe.title = 'Tuparit Spotify playlist';
  iframe.loading = 'lazy';
  iframe.allow = 'encrypted-media; clipboard-write';
  iframe.style.cssText = 'width:100%;height:352px;border:0;border-radius:12px;';
  document.getElementById('playlist-embed').appendChild(iframe);
  const link = document.getElementById('playlist-link');
  link.href = url;
  link.style.display = 'inline-flex';
}
initPlaylist();
