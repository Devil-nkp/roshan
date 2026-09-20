/* =========================================================
   PARVESH ROSHAN — YOUTUBE ERROR 153 FIXED BUILD
   - iframe gets referrerPolicy BEFORE src is assigned
   - page uses strict-origin-when-cross-origin
   - origin + widget_referrer are passed explicitly
   - one player only
   ========================================================= */

const $ = (s, p = document) => p.querySelector(s);
const $$ = (s, p = document) => [...p.querySelectorAll(s)];
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* =========================================================
   TRACKS
   ========================================================= */

const TRACKS = {
  aura: {
    title: "Aura 10/10",
    artist: "Hiphop Tamizha & Thamizh Aadhavan",
    videoId: "XSTTBVFiObg",
    url: "https://www.youtube.com/watch?v=XSTTBVFiObg",
    volume: 42
  },
  hukum: {
    title: "Hukum – Thalaivar Alappara",
    artist: "Anirudh Ravichander",
    videoId: "gB2zKZxESTg",
    url: "https://www.youtube.com/watch?v=gB2zKZxESTg",
    volume: 44
  },
  rolex: {
    title: "Rolex Theme",
    artist: "Anirudh Ravichander",
    videoId: "rBLCjz8as0E",
    url: "https://www.youtube.com/watch?v=rBLCjz8as0E",
    volume: 42
  },
  ordinary: {
    title: "Ordinary Person",
    artist: "Anirudh Ravichander & Nikhita Gandhi",
    videoId: "326UBY4B-ZU",
    url: "https://www.youtube.com/watch?v=326UBY4B-ZU",
    volume: 36
  },
  lokiverse: {
    title: "Lokiverse 2.0",
    artist: "Anirudh Ravichander",
    videoId: "QuIR-9RNYbA",
    url: "https://www.youtube.com/watch?v=QuIR-9RNYbA",
    volume: 40
  },
  life: {
    title: "The Life of Ram",
    artist: "Pradeep Kumar / Govind Vasantha",
    videoId: "6LD30ChPsSs",
    url: "https://www.youtube.com/watch?v=6LD30ChPsSs",
    volume: 25
  },
  mustafa: {
    title: "Mustafa Mustafa",
    artist: "A.R. Rahman",
    videoId: "Fhgpf2ikOWY",
    url: "https://www.youtube.com/watch?v=Fhgpf2ikOWY",
    volume: 30
  },
  godmode: {
    title: "God Mode",
    artist: "Sai Abhyankkar & Gana Muthu",
    videoId: "_Vp-jCG7gno",
    url: "https://www.youtube.com/watch?v=_Vp-jCG7gno",
    volume: 40
  },
  revenge: {
    title: "Raga of Revenge",
    artist: "Anirudh Ravichander",
    videoId: "NAkQVL61BRI",
    url: "https://www.youtube.com/watch?v=NAkQVL61BRI",
    volume: 37
  },
  quiet: {
    title: "Message From Me",
    artist: "Voice note / quiet section",
    videoId: null,
    url: "",
    volume: 0
  }
};

/* =========================================================
   YOUTUBE PLAYER
   ========================================================= */

let ytPlayer = null;
let ytReady = false;
let experienceStarted = false;
let isPaused = false;
let currentTrackKey = null;
let pendingTrackKey = "aura";
let activeSection = null;
let iframeCreated = false;

const musicDock = $("#musicDock");
const musicTitle = $("#musicTitle");
const musicArtist = $("#musicArtist");
const musicStatus = $("#musicStatus");
const youtubeLink = $("#youtubeLink");
const musicToggle = $("#musicToggle");
const musicMin = $("#musicMin");
const enterBtn = $("#enterBtn");

function setStatus(text) {
  if (musicStatus) musicStatus.textContent = text;
}

function setTrackUI(key) {
  const track = TRACKS[key];
  if (!track) return;

  if (musicTitle) musicTitle.textContent = track.title;
  if (musicArtist) musicArtist.textContent = track.artist;

  if (youtubeLink) {
    if (track.url) {
      youtubeLink.href = track.url;
      youtubeLink.style.visibility = "visible";
    } else {
      youtubeLink.removeAttribute("href");
      youtubeLink.style.visibility = "hidden";
    }
  }
}

/**
 * Create the actual iframe ourselves.
 * Important: referrerPolicy is assigned BEFORE src.
 * This is the key fix for YouTube error 153.
 */
function createYouTubeIframe() {
  if (iframeCreated) return;
  iframeCreated = true;

  const host = $("#yt-player-host");
  if (!host) {
    console.error("YouTube host element missing.");
    return;
  }

  const iframe = document.createElement("iframe");
  iframe.id = "yt-player";
  iframe.width = "320";
  iframe.height = "200";
  iframe.title = "Parvesh Roshan background music";
  iframe.setAttribute("frameborder", "0");
  iframe.setAttribute(
    "allow",
    "autoplay; encrypted-media; picture-in-picture"
  );
  iframe.setAttribute("allowfullscreen", "");
  iframe.referrerPolicy = "strict-origin-when-cross-origin";

  const pageOrigin =
    location.origin && location.origin !== "null"
      ? location.origin
      : "http://localhost:8080";

  const pageUrl =
    location.href && !location.href.startsWith("file:")
      ? location.href
      : pageOrigin + "/";

  const params = new URLSearchParams({
    enablejsapi: "1",
    playsinline: "1",
    controls: "1",
    rel: "0",
    fs: "0",
    origin: pageOrigin,
    widget_referrer: pageUrl
  });

  // src comes LAST, after referrer policy and attributes.
  iframe.src =
    `https://www.youtube.com/embed/${TRACKS.aura.videoId}?${params.toString()}`;

  host.replaceChildren(iframe);
}

/**
 * Load the IFrame API after the iframe exists.
 */
function loadYouTubeAPI() {
  createYouTubeIframe();

  if (window.YT && window.YT.Player) {
    attachYouTubeController();
    return;
  }

  window.onYouTubeIframeAPIReady = attachYouTubeController;

  if (!document.querySelector('script[data-youtube-api="true"]')) {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    tag.async = true;
    tag.dataset.youtubeApi = "true";
    document.head.appendChild(tag);
  }
}

function attachYouTubeController() {
  if (ytPlayer) return;

  const iframe = $("#yt-player");
  if (!iframe || !window.YT || !YT.Player) return;

  ytPlayer = new YT.Player(iframe, {
    events: {
      onReady: () => {
        ytReady = true;
        ytPlayer.setVolume(TRACKS.aura.volume);
        setStatus("READY");

        if (enterBtn) {
          enterBtn.dataset.musicReady = "true";
        }

        // If Enter was clicked while API was still loading,
        // try playback now. The visible player remains available
        // as a manual fallback for strict browser autoplay rules.
        if (experienceStarted) {
          switchTrack(pendingTrackKey || "aura", true);
        }
      },

      onStateChange: event => {
        if (!window.YT) return;

        if (event.data === YT.PlayerState.PLAYING) {
          setStatus("PLAYING");
          musicDock?.classList.remove("paused");
        }

        if (event.data === YT.PlayerState.PAUSED) {
          setStatus("PAUSED");
          musicDock?.classList.add("paused");
        }

        if (event.data === YT.PlayerState.BUFFERING) {
          setStatus("BUFFERING…");
        }
      },

      onError: event => {
        const code = Number(event.data);

        if (code === 153) {
          setStatus("REFERRER BLOCKED BY BROWSER");
          console.error(
            "YouTube error 153: browser/network removed the Referer header."
          );
        } else if (code === 101 || code === 150) {
          setStatus("OWNER BLOCKS EMBEDDING");
        } else {
          setStatus(`YOUTUBE ERROR ${code}`);
        }
      }
    }
  });
}

/* Build early so player should be ready before user clicks Enter. */
loadYouTubeAPI();

/* =========================================================
   PLAYBACK
   ========================================================= */

function switchTrack(key, force = false) {
  const track = TRACKS[key];
  if (!track) return;

  pendingTrackKey = key;
  setTrackUI(key);

  if (!experienceStarted) return;

  if (key === "quiet") {
    currentTrackKey = "quiet";

    if (ytReady && ytPlayer) {
      ytPlayer.pauseVideo();
      setStatus("QUIET SECTION");
    }
    return;
  }

  if (!ytReady || !ytPlayer) {
    setStatus("PLAYER LOADING…");
    return;
  }

  if (currentTrackKey === key && !force) {
    if (!isPaused) ytPlayer.playVideo();
    return;
  }

  currentTrackKey = key;
  setStatus("SWITCHING…");

  ytPlayer.loadVideoById({
    videoId: track.videoId,
    startSeconds: 0
  });

  ytPlayer.setVolume(track.volume);

  if (!isPaused) {
    ytPlayer.playVideo();
  }
}

function startExperience() {
  experienceStarted = true;
  isPaused = false;

  musicDock?.classList.add("visible");
  setTrackUI("aura");

  if (ytReady && ytPlayer) {
    currentTrackKey = "aura";
    ytPlayer.setVolume(TRACKS.aura.volume);

    // Directly tied to the user's click.
    ytPlayer.playVideo();
    setStatus("PLAYING");
  } else {
    pendingTrackKey = "aura";
    setStatus("PLAYER LOADING — PRESS PLAY IF NEEDED");
  }

  $("#presence")?.scrollIntoView({
    behavior: reducedMotion ? "auto" : "smooth"
  });
}

enterBtn?.addEventListener("click", startExperience);

musicToggle?.addEventListener("click", () => {
  if (!ytReady || !ytPlayer) return;

  isPaused = !isPaused;
  musicDock?.classList.toggle("paused", isPaused);

  if (isPaused) {
    ytPlayer.pauseVideo();
    setStatus("PAUSED");
  } else {
    if (currentTrackKey === "quiet") {
      switchTrack(
        pendingTrackKey !== "quiet" ? pendingTrackKey : "aura",
        true
      );
    } else {
      ytPlayer.playVideo();
      setStatus("PLAYING");
    }
  }
});

musicMin?.addEventListener("click", () => {
  musicDock?.classList.toggle("minimized");
  musicMin.textContent =
    musicDock?.classList.contains("minimized") ? "+" : "—";
});

/* =========================================================
   SECTION MUSIC CONTROLLER
   ========================================================= */

const trackedSections = $$("[data-track]");

const sectionObserver = new IntersectionObserver(entries => {
  if (!experienceStarted) return;

  const visible = entries
    .filter(entry => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

  if (!visible.length) return;

  const section = visible[0].target;

  if (section === activeSection) return;
  activeSection = section;

  const key = section.dataset.track;
  if (key) switchTrack(key);
}, {
  rootMargin: "-36% 0px -36% 0px",
  threshold: [0.01, 0.25, 0.5, 0.75]
});

trackedSections.forEach(section => sectionObserver.observe(section));

/* =========================================================
   LIGHTWEIGHT REVEALS
   ========================================================= */

const revealItems = [
  ...$$(".record__intro"),
  ...$$(".frame"),
  ...$$(".caseFile"),
  ...$$(".us__intro"),
  ...$$(".memory"),
  ...$$(".truth article"),
  ...$$(".messageCard"),
  ...$$(".letterSheet"),
  ...$$(".next__inner"),
  ...$$(".ending__copy")
];

revealItems.forEach(el => el.classList.add("revealItem"));

const revealObserver = new IntersectionObserver((entries, obs) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("in");
    obs.unobserve(entry.target);
  });
}, { threshold: 0.12 });

revealItems.forEach(el => revealObserver.observe(el));

/* =========================================================
   ONE RAF-SYNCED SCROLL HANDLER
   ========================================================= */

let ticking = false;

function updateScrollEffects() {
  ticking = false;
  const vh = innerHeight;

  const presence = $("#presence");

  if (presence) {
    const r = presence.getBoundingClientRect();
    const p = clamp(
      (-r.top) / Math.max(1, presence.offsetHeight - vh),
      0,
      1
    );

    $$(".statement span").forEach((word, index) => {
      const direction = index % 2 ? 1 : -1;
      word.style.transform =
        `translateX(${direction * (p - .5) * 5}vw)`;
    });
  }

  $$(".meter").forEach(meter => {
    const r = meter.getBoundingClientRect();

    if (r.top < vh * .82) {
      const value = Number(meter.dataset.value || 0);
      const bar = $("em", meter);

      if (bar) {
        bar.style.width = `${Math.min(value, 100)}%`;
      }
    }
  });

  const reveal = $("#reveal");

  if (reveal) {
    const r = reveal.getBoundingClientRect();
    const line = $(".reveal__line");

    if (line && r.top < vh * .55) {
      line.style.width = "min(320px,62vw)";
    }
  }
}

addEventListener("scroll", () => {
  if (!ticking) {
    requestAnimationFrame(updateScrollEffects);
    ticking = true;
  }
}, { passive: true });

updateScrollEffects();

/* =========================================================
   VOICE NOTE
   ========================================================= */

const waveform = $("#waveform");
const voiceButton = $("#voiceButton");

if (waveform) {
  for (let i = 0; i < 70; i++) {
    const bar = document.createElement("i");
    const h =
      7 +
      (Math.sin(i * .63) + 1) * 16 +
      Math.random() * 10;

    bar.style.height = `${h}px`;
    waveform.appendChild(bar);
  }
}

const voiceNote = new Audio("./assets/voice-note.mp3");
voiceNote.preload = "metadata";
let voiceAvailable = false;

voiceNote.addEventListener(
  "canplaythrough",
  () => (voiceAvailable = true)
);

voiceNote.addEventListener(
  "error",
  () => (voiceAvailable = false)
);

voiceNote.addEventListener("play", () => {
  waveform?.classList.add("playing");

  const icon = $("#voiceButton span");
  if (icon) icon.textContent = "Ⅱ";

  if (ytReady && ytPlayer) {
    ytPlayer.pauseVideo();
  }
});

voiceNote.addEventListener("pause", () => {
  waveform?.classList.remove("playing");
  const icon = $("#voiceButton span");
  if (icon) icon.textContent = "▶";
});

voiceNote.addEventListener("ended", () => {
  waveform?.classList.remove("playing");
  const icon = $("#voiceButton span");
  if (icon) icon.textContent = "▶";
});

voiceButton?.addEventListener("click", async () => {
  if (!voiceAvailable) {
    voiceButton.animate(
      [
        { transform: "translateX(0)" },
        { transform: "translateX(-5px)" },
        { transform: "translateX(5px)" },
        { transform: "translateX(0)" }
      ],
      { duration: 240 }
    );
    return;
  }

  if (voiceNote.paused) {
    await voiceNote.play().catch(() => {});
  } else {
    voiceNote.pause();
  }
});

/* =========================================================
   HOLD TO UNLOCK VAULT
   ========================================================= */

const holdButton = $("#holdButton");
const holdProgress = $("#holdProgress");
const vaultClosed = $("#vaultClosed");
const vaultOpen = $("#vaultOpen");

let holdRAF = 0;
let holdStart = 0;
const HOLD_TIME = 1200;

function resetHold() {
  cancelAnimationFrame(holdRAF);
  holdRAF = 0;
  holdStart = 0;

  if (holdProgress) {
    holdProgress.style.width = "0%";
  }
}

function holdLoop(time) {
  if (!holdStart) holdStart = time;

  const progress =
    clamp((time - holdStart) / HOLD_TIME, 0, 1);

  if (holdProgress) {
    holdProgress.style.width = `${progress * 100}%`;
  }

  if (progress >= 1) {
    resetHold();
    vaultClosed?.classList.add("hidden");

    setTimeout(() => {
      vaultOpen?.classList.add("show");
    }, 520);

    return;
  }

  holdRAF = requestAnimationFrame(holdLoop);
}

holdButton?.addEventListener("pointerdown", event => {
  event.preventDefault();
  holdRAF = requestAnimationFrame(holdLoop);
});

["pointerup", "pointerleave", "pointercancel"].forEach(name => {
  holdButton?.addEventListener(name, resetHold);
});

/* =========================================================
   ONE-TIME BIRTHDAY BURST
   ========================================================= */

const burstCanvas = $("#burstCanvas");

if (burstCanvas) {
  const ctx = burstCanvas.getContext("2d");

  let W = 0;
  let H = 0;
  let dpr = 1;
  let sparks = [];
  let triggered = false;

  function resize() {
    const r = burstCanvas.getBoundingClientRect();

    dpr = Math.min(devicePixelRatio || 1, 2);
    W = r.width;
    H = r.height;

    burstCanvas.width = W * dpr;
    burstCanvas.height = H * dpr;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function createBurst() {
    const count = reducedMotion ? 30 : 130;
    const cx = W / 2;
    const cy = H * .48;

    sparks = Array.from({ length: count }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.6 + Math.random() * 4.4;

      return {
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: .008 + Math.random() * .013,
        size: .5 + Math.random() * 1.8,
        blue: Math.random() > .45
      };
    });

    animate();
  }

  function animate() {
    ctx.clearRect(0, 0, W, H);

    sparks = sparks.filter(spark => spark.life > 0);

    for (const spark of sparks) {
      spark.x += spark.vx;
      spark.y += spark.vy;
      spark.vy += .018;
      spark.vx *= .996;
      spark.life -= spark.decay;

      ctx.beginPath();
      ctx.arc(
        spark.x,
        spark.y,
        spark.size,
        0,
        Math.PI * 2
      );

      ctx.fillStyle = spark.blue
        ? `rgba(69,120,255,${spark.life})`
        : `rgba(246,249,255,${spark.life * .82})`;

      ctx.fill();
    }

    if (sparks.length) {
      requestAnimationFrame(animate);
    }
  }

  resize();
  addEventListener("resize", resize);

  const reveal = $("#reveal");

  if (reveal) {
    const observer =
      new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting || triggered) return;

          triggered = true;
          setTimeout(createBurst, 350);
        });
      }, { threshold: .35 });

    observer.observe(reveal);
  }
}
