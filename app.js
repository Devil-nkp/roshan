/* =========================================================
   PARVESH ROSHAN — RELIABLE SECTION SOUNDTRACK BUILD

   IMPORTANT FIX:
   - The section at the center of the viewport owns the song.
   - We verify the ACTUAL YouTube video_id, not only our JS state.
   - The old song is explicitly stopped before a new track loads.
   - A watchdog corrects the player if YouTube fails to switch.
   - Each active section track loops until another section takes over.
   ========================================================= */

const $ = (s, p = document) => p.querySelector(s);
const $$ = (s, p = document) => [...p.querySelectorAll(s)];
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* =========================================================
   TRACK MAP
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
   PLAYER STATE
   ========================================================= */

let ytPlayer = null;
let ytReady = false;
let apiLoaded = false;

let experienceStarted = false;
let userInteracted = false;
let soundUnlocked = false;
let isPaused = false;

let activeScene = $("#intro");
let desiredTrackKey = "aura";
let currentTrackKey = "aura";
let actualVideoId = null;

let switchGeneration = 0;
let lastLoadAttempt = 0;
let soundtrackWatchdog = 0;
let scrollTicking = false;

const blockedVideoIds = new Set();

const musicDock = $("#musicDock");
const musicTitle = $("#musicTitle");
const musicArtist = $("#musicArtist");
const musicStatus = $("#musicStatus");
const youtubeLink = $("#youtubeLink");
const musicToggle = $("#musicToggle");
const enterBtn = $("#enterBtn");

/* =========================================================
   UI HELPERS
   ========================================================= */

function setStatus(text){
  if (musicStatus){
    musicStatus.textContent = text;
  }
}

function updateMusicUI(key){
  const track = TRACKS[key];
  if (!track) return;

  if (musicTitle){
    musicTitle.textContent = track.title;
  }

  if (musicArtist){
    musicArtist.textContent = track.artist;
  }

  if (youtubeLink){
    if (track.url){
      youtubeLink.href = track.url;
    }else{
      youtubeLink.removeAttribute("href");
    }
  }
}

function getPlayerVideoId(){
  if (!ytReady || !ytPlayer) return null;

  try{
    const data = ytPlayer.getVideoData?.();
    return data?.video_id || null;
  }catch(error){
    return null;
  }
}

function trackKeyFromVideoId(videoId){
  if (!videoId) return null;

  for (const [key, track] of Object.entries(TRACKS)){
    if (track.videoId === videoId){
      return key;
    }
  }

  return null;
}

/* =========================================================
   YOUTUBE IFRAME
   ========================================================= */

function normaliseOrigin(raw){
  try{
    const url = new URL(raw);

    if (url.hostname === "127.0.0.1"){
      url.hostname = "localhost";
    }

    return url.origin;
  }catch(error){
    return raw;
  }
}

function createIframe(){
  const host = $("#yt-player-host");

  if (!host || $("#yt-player")){
    return;
  }

  const iframe = document.createElement("iframe");

  iframe.id = "yt-player";
  iframe.width = "220";
  iframe.height = "220";
  iframe.title = "Parvesh Roshan background music";

  iframe.setAttribute("frameborder", "0");
  iframe.setAttribute(
    "allow",
    "autoplay; encrypted-media; picture-in-picture"
  );

  iframe.referrerPolicy = "strict-origin-when-cross-origin";

  const pageOrigin = normaliseOrigin(
    location.origin && location.origin !== "null"
      ? location.origin
      : "http://localhost:8080"
  );

  const pageUrl =
    location.href && !location.href.startsWith("file:")
      ? location.href.replace("127.0.0.1", "localhost")
      : `${pageOrigin}/`;

  const params = new URLSearchParams({
    enablejsapi: "1",
    playsinline: "1",
    controls: "0",
    autoplay: "1",
    mute: "1",
    rel: "0",
    fs: "0",
    origin: pageOrigin,
    widget_referrer: pageUrl
  });

  /*
    Aura is only the initial pre-entry video.
    There is deliberately NO playlist= and NO fixed loop= here.
  */
  iframe.src =
    `https://www.youtube.com/embed/${TRACKS.aura.videoId}?${params.toString()}`;

  host.replaceChildren(iframe);
}

function attachYouTube(){
  if (ytPlayer || !window.YT || !YT.Player){
    return;
  }

  const iframe = $("#yt-player");
  if (!iframe) return;

  ytPlayer = new YT.Player(iframe, {
    events: {
      onReady: () => {
        ytReady = true;

        desiredTrackKey = "aura";
        currentTrackKey = "aura";
        actualVideoId = TRACKS.aura.videoId;

        activeScene = $("#intro") || activeScene;

        updateMusicUI("aura");

        try{
          ytPlayer.mute();
          ytPlayer.setVolume(TRACKS.aura.volume);
          ytPlayer.playVideo();
        }catch(error){}

        const state = $("#preSoundState");

        if (userInteracted || experienceStarted){
          unlockSound();

          const scene = getSceneAtViewportCenter();

          if (scene){
            activateScene(scene, true);
          }
        }else{
          setStatus("INTRO PLAYING");

          if (state){
            state.textContent = "TAP ANYWHERE FOR SOUND";
          }
        }
      },

      onStateChange: event => {
        if (!window.YT) return;

        actualVideoId = getPlayerVideoId() || actualVideoId;

        if (event.data === YT.PlayerState.PLAYING){
          const playingKey = trackKeyFromVideoId(actualVideoId);

          if (playingKey){
            currentTrackKey = playingKey;
          }

          /*
            This is the key verification.
            If YouTube is still playing a different video than the
            active section requires, immediately correct it.
          */
          const wanted = TRACKS[desiredTrackKey];

          if (
            wanted?.videoId &&
            actualVideoId !== wanted.videoId &&
            !blockedVideoIds.has(wanted.videoId)
          ){
            setStatus("CORRECTING TRACK…");

            setTimeout(()=>{
              ensureCorrectTrack(true);
            }, 120);

            return;
          }

          setStatus("PLAYING");
          musicDock?.classList.remove("paused");
        }

        if (event.data === YT.PlayerState.BUFFERING){
          setStatus("BUFFERING…");
        }

        if (
          event.data === YT.PlayerState.PAUSED &&
          !isPaused &&
          desiredTrackKey !== "quiet"
        ){
          setStatus("PAUSED");
        }

        /*
          Loop only the song that actually belongs to the active section.
        */
        if (
          event.data === YT.PlayerState.ENDED &&
          experienceStarted &&
          !isPaused &&
          desiredTrackKey !== "quiet"
        ){
          const wanted = TRACKS[desiredTrackKey];

          if (!wanted?.videoId) return;

          if (actualVideoId === wanted.videoId){
            try{
              ytPlayer.seekTo(0, true);

              if (soundUnlocked){
                ytPlayer.unMute();
              }

              ytPlayer.setVolume(wanted.volume);
              ytPlayer.playVideo();
              setStatus("LOOPING");
            }catch(error){}
          }else{
            ensureCorrectTrack(true);
          }
        }
      },

      onError: event => {
        const code = Number(event.data);
        const wanted = TRACKS[desiredTrackKey];

        /*
          Never allow a failed new track to leave the OLD song playing.
        */
        try{
          ytPlayer.stopVideo();
        }catch(error){}

        if (wanted?.videoId){
          blockedVideoIds.add(wanted.videoId);
        }

        if (code === 101 || code === 150){
          setStatus("TRACK EMBED BLOCKED");
        }else if (code === 153){
          setStatus("REFERRER BLOCKED");
        }else{
          setStatus(`YT ERROR ${code}`);
        }
      }
    }
  });
}

function loadYouTubeAPI(){
  if (apiLoaded) return;

  apiLoaded = true;
  createIframe();

  if (window.YT && window.YT.Player){
    attachYouTube();
    return;
  }

  window.onYouTubeIframeAPIReady = attachYouTube;

  const script = document.createElement("script");

  script.src = "https://www.youtube.com/iframe_api";
  script.async = true;
  script.dataset.youtubeApi = "true";

  script.onerror = () => {
    setStatus("YOUTUBE API BLOCKED");
  };

  document.head.appendChild(script);
}

loadYouTubeAPI();

/* =========================================================
   SOUND UNLOCK
   ========================================================= */

function unlockSound(){
  userInteracted = true;

  if (!ytReady || !ytPlayer){
    setStatus("PLAYER LOADING…");
    return false;
  }

  try{
    soundUnlocked = true;
    isPaused = false;

    ytPlayer.unMute();

    const track =
      TRACKS[desiredTrackKey] ||
      TRACKS.aura;

    ytPlayer.setVolume(track.volume || 42);

    if (desiredTrackKey !== "quiet"){
      ytPlayer.playVideo();
    }

    musicDock?.classList.remove("paused");

    const state = $("#preSoundState");

    if (state){
      state.textContent = "SOUND ON";
    }

    setStatus("PLAYING");

    return true;
  }catch(error){
    setStatus("TAP MUSIC CONTROL");
    return false;
  }
}

["pointerdown", "touchstart"].forEach(eventName => {
  window.addEventListener(
    eventName,
    () => {
      userInteracted = true;

      if (!soundUnlocked){
        unlockSound();
      }
    },
    { passive: true }
  );
});

window.addEventListener("keydown", () => {
  userInteracted = true;

  if (!soundUnlocked){
    unlockSound();
  }
});

/* =========================================================
   RELIABLE TRACK SWITCHING
   ========================================================= */

function requestTrack(key, force=false){
  const track = TRACKS[key];

  if (!track) return;

  desiredTrackKey = key;
  updateMusicUI(key);

  if (!experienceStarted){
    return;
  }

  if (key === "quiet"){
    currentTrackKey = "quiet";
    actualVideoId = getPlayerVideoId();

    if (ytReady && ytPlayer){
      try{
        ytPlayer.pauseVideo();
      }catch(error){}
    }

    setStatus("QUIET SECTION");
    return;
  }

  if (!ytReady || !ytPlayer){
    setStatus("PLAYER LOADING…");
    return;
  }

  if (blockedVideoIds.has(track.videoId)){
    try{
      ytPlayer.stopVideo();
    }catch(error){}

    setStatus("TRACK EMBED BLOCKED");
    return;
  }

  const realVideoId = getPlayerVideoId();

  /*
    If the correct song is genuinely loaded, do not restart it.
  */
  if (
    !force &&
    realVideoId === track.videoId
  ){
    actualVideoId = realVideoId;
    currentTrackKey = key;

    if (!isPaused){
      try{
        if (soundUnlocked){
          ytPlayer.unMute();
        }

        ytPlayer.setVolume(track.volume);
        ytPlayer.playVideo();
      }catch(error){}
    }

    return;
  }

  const generation = ++switchGeneration;

  lastLoadAttempt = performance.now();
  setStatus("SWITCHING…");

  /*
    Explicitly stop the old section song.
    This prevents Aura (or any previous song) from continuing underneath.
  */
  try{
    ytPlayer.stopVideo();
  }catch(error){}

  try{
    ytPlayer.loadVideoById(track.videoId);
    ytPlayer.setVolume(track.volume);

    if (soundUnlocked){
      ytPlayer.unMute();
    }

    if (!isPaused){
      ytPlayer.playVideo();
    }
  }catch(error){
    setStatus("TRACK LOAD FAILED");
    return;
  }

  /*
    Verify the real player after YouTube has had time to load.
  */
  [250, 650, 1300].forEach(delay => {
    setTimeout(() => {
      if (
        generation !== switchGeneration ||
        desiredTrackKey !== key ||
        isPaused
      ){
        return;
      }

      const actual = getPlayerVideoId();

      if (actual === track.videoId){
        actualVideoId = actual;
        currentTrackKey = key;

        if (soundUnlocked){
          try{
            ytPlayer.unMute();
          }catch(error){}
        }

        try{
          ytPlayer.setVolume(track.volume);
          ytPlayer.playVideo();
        }catch(error){}

        setStatus("PLAYING");
      }else{
        ensureCorrectTrack(true);
      }
    }, delay);
  });
}

/*
  Keep this old function name because the voice-note code below
  already uses it.
*/
function playSceneTrack(scene, force=false){
  if (!scene) return;

  const key = scene.dataset.track;

  if (key){
    requestTrack(key, force);
  }
}

function ensureCorrectTrack(force=false){
  if (
    !experienceStarted ||
    !ytReady ||
    !ytPlayer ||
    isPaused
  ){
    return;
  }

  const scene = getSceneAtViewportCenter();

  if (scene && scene !== activeScene){
    activateScene(scene);
    return;
  }

  const key =
    activeScene?.dataset.track ||
    desiredTrackKey;

  if (!key || key === "quiet"){
    return;
  }

  const track = TRACKS[key];

  if (
    !track?.videoId ||
    blockedVideoIds.has(track.videoId)
  ){
    return;
  }

  desiredTrackKey = key;
  updateMusicUI(key);

  const actual = getPlayerVideoId();

  if (actual === track.videoId){
    actualVideoId = actual;
    currentTrackKey = key;
    return;
  }

  /*
    Avoid spamming the YouTube API faster than necessary.
  */
  if (
    !force &&
    performance.now() - lastLoadAttempt < 700
  ){
    return;
  }

  requestTrack(key, true);
}

/* =========================================================
   ACTIVE SECTION = SOUNDTRACK OWNER
   ========================================================= */

const scenes = $$("[data-track]");
const motionPanels = $$(".motion-panel");

function getSceneAtViewportCenter(){
  /*
    First use the actual DOM element under the center of the screen.
    This is extremely reliable for long/tall sections.
  */
  try{
    const centerElement = document.elementFromPoint(
      Math.max(1, innerWidth * .5),
      Math.max(1, innerHeight * .52)
    );

    const centerScene =
      centerElement?.closest?.("[data-track]");

    if (centerScene){
      return centerScene;
    }
  }catch(error){}

  /*
    Geometry fallback.
  */
  const focusY = innerHeight * .52;
  let nearest = null;
  let nearestDistance = Infinity;

  for (const scene of scenes){
    const rect = scene.getBoundingClientRect();

    if (
      rect.top <= focusY &&
      rect.bottom >= focusY
    ){
      return scene;
    }

    const distance =
      Math.abs(
        (rect.top + rect.bottom) / 2 -
        focusY
      );

    if (distance < nearestDistance){
      nearestDistance = distance;
      nearest = scene;
    }
  }

  return nearest;
}

function activateScene(scene, forceTrack=false){
  if (!scene) return;

  const changed = scene !== activeScene;

  if (changed){
    activeScene?.classList.remove("is-active");

    activeScene = scene;
    activeScene.classList.add("is-active");
  }

  const key = activeScene.dataset.track;

  /*
    Change soundtrack whenever the section changes.
    Also recover if the actual player video does not match.
  */
  if (
    experienceStarted &&
    key &&
    (
      changed ||
      forceTrack ||
      desiredTrackKey !== key ||
      (
        key !== "quiet" &&
        getPlayerVideoId() !== TRACKS[key]?.videoId
      )
    )
  ){
    requestTrack(key, forceTrack);
  }
}

function updateActivePanels(){
  const centerY = innerHeight * .5;

  for (const panel of motionPanels){
    const rect = panel.getBoundingClientRect();

    panel.classList.toggle(
      "is-active",
      rect.top <= centerY &&
      rect.bottom >= centerY
    );
  }
}

/* =========================================================
   ENTER EXPERIENCE
   ========================================================= */

function startExperience(){
  experienceStarted = true;
  isPaused = false;
  userInteracted = true;

  unlockSound();
  musicDock?.classList.add("visible");

  const intro = $("#intro");

  if (intro){
    activeScene = intro;
    intro.classList.add("is-active");
  }

  desiredTrackKey = "aura";
  updateMusicUI("aura");

  $("#presence")?.scrollIntoView({
    behavior: reducedMotion
      ? "auto"
      : "smooth"
  });

  /*
    During smooth scrolling, repeatedly sample the center.
    Presence switches to Hukum as soon as it owns the center.
  */
  [100, 250, 450, 700, 1000, 1400].forEach(delay => {
    setTimeout(() => {
      const scene = getSceneAtViewportCenter();

      if (scene){
        activateScene(scene);
      }

      ensureCorrectTrack();
    }, delay);
  });

  if (!soundtrackWatchdog){
    soundtrackWatchdog = window.setInterval(() => {
      if (!experienceStarted) return;

      const scene = getSceneAtViewportCenter();

      if (scene){
        activateScene(scene);
      }

      ensureCorrectTrack();
    }, 500);
  }
}

enterBtn?.addEventListener(
  "click",
  startExperience
);

/* =========================================================
   MUSIC TOGGLE
   ========================================================= */

musicToggle?.addEventListener("click", () => {
  if (!ytReady || !ytPlayer){
    return;
  }

  isPaused = !isPaused;

  musicDock?.classList.toggle(
    "paused",
    isPaused
  );

  if (isPaused){
    try{
      ytPlayer.pauseVideo();
    }catch(error){}

    setStatus("PAUSED");
    return;
  }

  soundUnlocked = true;

  try{
    ytPlayer.unMute();
  }catch(error){}

  const scene = getSceneAtViewportCenter();

  if (scene){
    activateScene(scene, true);
  }else{
    ensureCorrectTrack(true);
  }
});

/* =========================================================
   ONE RAF SCROLL LOOP
   ========================================================= */

function updateScroll(){
  scrollTicking = false;

  const viewportHeight = innerHeight;

  const scene = getSceneAtViewportCenter();

  if (scene){
    activateScene(scene);
  }

  updateActivePanels();

  /*
    Re-check the REAL YouTube video while scrolling.
    This is what prevents one song from remaining stuck.
  */
  ensureCorrectTrack();

  /* Kinetic presence motion */
  const presence = $("#presence");

  if (presence){
    const rect =
      presence.getBoundingClientRect();

    const progress = clamp(
      (-rect.top) /
        Math.max(
          1,
          presence.offsetHeight -
            viewportHeight
        ),
      0,
      1
    );

    $$(".statement span").forEach(
      (word, index) => {
        const direction =
          index % 2 ? 1 : -1;

        word.style.transform =
          `translateX(${
            direction *
            (progress - .5) *
            9
          }vw)`;

        word.style.opacity =
          String(
            .45 +
            progress *
            .55
          );
      }
    );
  }

  /* Aura meters */
  $$(".meter").forEach(meter => {
    const rect =
      meter.getBoundingClientRect();

    if (
      rect.top <
      viewportHeight * .82
    ){
      const value =
        Number(
          meter.dataset.value ||
          0
        );

      const bar = $("em", meter);

      if (bar){
        bar.style.width =
          `${Math.min(value,100)}%`;
      }
    }
  });

  /* Birthday reveal line */
  const reveal = $("#reveal");

  if (reveal){
    const rect =
      reveal.getBoundingClientRect();

    const line =
      $(".reveal__line");

    if (
      line &&
      rect.top <
        viewportHeight * .55
    ){
      line.style.width =
        "min(320px,62vw)";
    }
  }
}

addEventListener(
  "scroll",
  () => {
    if (!scrollTicking){
      scrollTicking = true;
      requestAnimationFrame(
        updateScroll
      );
    }
  },
  { passive: true }
);

addEventListener("resize", () => {
  requestAnimationFrame(
    updateScroll
  );
});

updateScroll();

/* Intro motion is active before Enter. */
requestAnimationFrame(() => {
  $("#intro")?.classList.add(
    "is-active"
  );
});


/* =========================================================
   PRE-ENTRY POINTER PARALLAX
   ========================================================= */

const introScene = $("#intro");

if (
  introScene &&
  matchMedia("(pointer:fine)").matches &&
  !reducedMotion
){
  introScene.addEventListener("pointermove",event=>{
    const rect = introScene.getBoundingClientRect();
    const x = ((event.clientX-rect.left)/rect.width-.5)*2;
    const y = ((event.clientY-rect.top)/rect.height-.5)*2;

    introScene.style.setProperty("--mx",`${x*16}px`);
    introScene.style.setProperty("--my",`${y*11}px`);
  });

  introScene.addEventListener("pointerleave",()=>{
    introScene.style.setProperty("--mx","0px");
    introScene.style.setProperty("--my","0px");
  });
}

/* =========================================================
   OPTIONAL VOICE NOTE
   ========================================================= */

const waveform = $("#waveform");
const voiceButton = $("#voiceButton");

if (waveform){
  for (let i=0;i<70;i++){
    const bar = document.createElement("i");
    const h =
      7 +
      (Math.sin(i*.63)+1)*16 +
      Math.random()*10;

    bar.style.height = `${h}px`;
    waveform.appendChild(bar);
  }
}

const voiceNote = new Audio("./assets/voice-note.mp3");
voiceNote.preload = "metadata";
let voiceAvailable = false;

voiceNote.addEventListener("canplaythrough",()=>{
  voiceAvailable = true;
});

voiceNote.addEventListener("error",()=>{
  voiceAvailable = false;
});

voiceNote.addEventListener("play",()=>{
  waveform?.classList.add("playing");

  const icon = $("#voiceButton span");
  if (icon) icon.textContent = "Ⅱ";

  if (ytReady && ytPlayer){
    ytPlayer.pauseVideo();
  }
});

voiceNote.addEventListener("pause",()=>{
  waveform?.classList.remove("playing");

  const icon = $("#voiceButton span");
  if (icon) icon.textContent = "▶";
});

voiceNote.addEventListener("ended",()=>{
  waveform?.classList.remove("playing");

  const icon = $("#voiceButton span");
  if (icon) icon.textContent = "▶";

  if (
    experienceStarted &&
    activeScene &&
    activeScene.dataset.track !== "quiet" &&
    !isPaused
  ){
    playSceneTrack(activeScene,true);
  }
});

voiceButton?.addEventListener("click",async()=>{
  if (!voiceAvailable){
    voiceButton.animate(
      [
        {transform:"translateX(0)"},
        {transform:"translateX(-5px)"},
        {transform:"translateX(5px)"},
        {transform:"translateX(0)"}
      ],
      {duration:240}
    );
    return;
  }

  if (voiceNote.paused){
    await voiceNote.play().catch(()=>{});
  } else {
    voiceNote.pause();
  }
});

/* =========================================================
   VAULT HOLD
   ========================================================= */

const holdButton = $("#holdButton");
const holdProgress = $("#holdProgress");
const vaultClosed = $("#vaultClosed");
const vaultOpen = $("#vaultOpen");

let holdRAF = 0;
let holdStart = 0;
const HOLD_TIME = 1200;

function resetHold(){
  cancelAnimationFrame(holdRAF);
  holdRAF = 0;
  holdStart = 0;

  if (holdProgress){
    holdProgress.style.width = "0%";
  }
}

function holdLoop(time){
  if (!holdStart) holdStart = time;

  const progress =
    clamp((time-holdStart)/HOLD_TIME,0,1);

  if (holdProgress){
    holdProgress.style.width = `${progress*100}%`;
  }

  if (progress >= 1){
    resetHold();
    vaultClosed?.classList.add("hidden");

    setTimeout(()=>{
      vaultOpen?.classList.add("show");
    },500);

    return;
  }

  holdRAF = requestAnimationFrame(holdLoop);
}

holdButton?.addEventListener("pointerdown",event=>{
  event.preventDefault();
  holdRAF = requestAnimationFrame(holdLoop);
});

["pointerup","pointerleave","pointercancel"].forEach(name=>{
  holdButton?.addEventListener(name,resetHold);
});

/* =========================================================
   ONE-TIME BIRTHDAY BURST
   ========================================================= */

const burstCanvas = $("#burstCanvas");

if (burstCanvas){
  const ctx = burstCanvas.getContext("2d");

  let W=0,H=0,dpr=1,sparks=[],triggered=false;

  function resizeBurst(){
    const r = burstCanvas.getBoundingClientRect();

    dpr = Math.min(devicePixelRatio || 1,2);
    W = r.width;
    H = r.height;

    burstCanvas.width = W*dpr;
    burstCanvas.height = H*dpr;

    ctx.setTransform(dpr,0,0,dpr,0,0);
  }

  function createBurst(){
    const count = reducedMotion ? 28 : 120;
    const cx = W/2;
    const cy = H*.48;

    sparks = Array.from({length:count},()=>{
      const angle = Math.random()*Math.PI*2;
      const speed = 1.6+Math.random()*4.3;

      return {
        x:cx,
        y:cy,
        vx:Math.cos(angle)*speed,
        vy:Math.sin(angle)*speed,
        life:1,
        decay:.008+Math.random()*.013,
        size:.5+Math.random()*1.8,
        blue:Math.random()>.45
      };
    });

    animateBurst();
  }

  function animateBurst(){
    ctx.clearRect(0,0,W,H);

    sparks = sparks.filter(s=>s.life>0);

    for (const s of sparks){
      s.x += s.vx;
      s.y += s.vy;
      s.vy += .018;
      s.vx *= .996;
      s.life -= s.decay;

      ctx.beginPath();
      ctx.arc(s.x,s.y,s.size,0,Math.PI*2);

      ctx.fillStyle = s.blue
        ? `rgba(69,120,255,${s.life})`
        : `rgba(246,249,255,${s.life*.82})`;

      ctx.fill();
    }

    if (sparks.length){
      requestAnimationFrame(animateBurst);
    }
  }

  resizeBurst();
  addEventListener("resize",resizeBurst);

  const reveal = $("#reveal");

  const observer = new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if (!entry.isIntersecting || triggered) return;

      triggered = true;
      setTimeout(createBurst,320);
    });
  },{threshold:.38});

  if (reveal) observer.observe(reveal);
}

/* =========================================================
   LIGHTBOX
   ========================================================= */

(function initLightbox() {
  const lb       = document.getElementById('lightbox');
  const lbImg    = document.getElementById('lbImg');
  const lbClose  = document.getElementById('lbClose');
  const lbPrev   = document.getElementById('lbPrev');
  const lbNext   = document.getElementById('lbNext');
  const lbCap    = document.getElementById('lbCaption');

  if (!lb || !lbImg) return;

  let triggers = [];
  let current  = 0;

  function collectTriggers() {
    triggers = Array.from(document.querySelectorAll('.lb-trigger'));
    lb.dataset.single = triggers.length <= 1 ? 'true' : 'false';
  }

  function openAt(index) {
    collectTriggers();
    if (!triggers.length) return;
    current = ((index % triggers.length) + triggers.length) % triggers.length;
    const img = triggers[current];
    lbImg.src = img.src;
    lbImg.alt = img.alt || '';
    const fig = img.closest('figure');
    const caption = fig
      ? (fig.querySelector('figcaption')?.textContent?.trim() || img.alt)
      : img.alt;
    lbCap.textContent = caption;
    lb.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeLb() {
    lb.setAttribute('hidden', '');
    document.body.style.overflow = '';
    lbImg.src = '';
  }

  function prevImg() { openAt(current - 1); }
  function nextImg() { openAt(current + 1); }

  function attachListeners() {
    collectTriggers();
    triggers.forEach((img, i) => {
      if (img.dataset.lbAttached) return;
      img.dataset.lbAttached = '1';
      img.addEventListener('click', () => openAt(i));
    });
  }

  document.addEventListener('keydown', e => {
    if (lb.hasAttribute('hidden')) return;
    if (e.key === 'Escape')     closeLb();
    if (e.key === 'ArrowLeft')  prevImg();
    if (e.key === 'ArrowRight') nextImg();
  });

  lbClose && lbClose.addEventListener('click', closeLb);
  lbPrev  && lbPrev.addEventListener('click', prevImg);
  lbNext  && lbNext.addEventListener('click', nextImg);

  lb.addEventListener('click', function(e) {
    if (e.target === lb) closeLb();
  });

  var touchStartX = 0;
  lb.addEventListener('touchstart', function(e) {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  lb.addEventListener('touchend', function(e) {
    var dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) { dx < 0 ? nextImg() : prevImg(); }
  }, { passive: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachListeners);
  } else {
    attachListeners();
  }
})();
