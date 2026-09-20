/* =========================================================
   PARVESH ROSHAN — FINAL MOTION BUILD
   - Audio-only YouTube engine
   - Current section song loops continuously
   - Song switches only when viewport center enters a new scene
   - Unique motion activation for every scene
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
   YOUTUBE ENGINE
   ========================================================= */

let ytPlayer = null;
let ytReady = false;
let experienceStarted = false;
let isPaused = false;
let currentTrackKey = null;
let activeScene = null;
let requestedTrackKey = "aura";
let apiLoaded = false;
let preEntryMutedPlayback = false;
let firstSoundGestureUsed = false;

const musicDock = $("#musicDock");
const musicTitle = $("#musicTitle");
const musicArtist = $("#musicArtist");
const musicStatus = $("#musicStatus");
const youtubeLink = $("#youtubeLink");
const musicToggle = $("#musicToggle");
const enterBtn = $("#enterBtn");

function setStatus(text){
  if (musicStatus) musicStatus.textContent = text;
}

function updateMusicUI(key){
  const track = TRACKS[key];
  if (!track) return;

  if (musicTitle) musicTitle.textContent = track.title;
  if (musicArtist) musicArtist.textContent = track.artist;

  if (youtubeLink){
    if (track.url){
      youtubeLink.href = track.url;
    } else {
      youtubeLink.removeAttribute("href");
    }
  }
}

/**
 * Create the YouTube iframe at a valid size but outside the viewport.
 * Referrer policy is assigned before src to prevent error 153.
 */
function createIframe(){
  const host = $("#yt-player-host");
  if (!host || $("#yt-player")) return;

  const iframe = document.createElement("iframe");
  iframe.id = "yt-player";
  iframe.width = "220";
  iframe.height = "220";
  iframe.title = "Parvesh Roshan background music";
  iframe.setAttribute("frameborder", "0");
  iframe.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture");
  iframe.referrerPolicy = "strict-origin-when-cross-origin";

  const pageOrigin =
    location.origin && location.origin !== "null"
      ? location.origin
      : "http://localhost:8080";

  const pageUrl =
    location.href && !location.href.startsWith("file:")
      ? location.href
      : `${pageOrigin}/`;

  const params = new URLSearchParams({
    enablejsapi:"1",
    playsinline:"1",
    controls:"0",
    autoplay:"1",
    mute:"1",
    loop:"1",
    playlist:TRACKS.aura.videoId,
    rel:"0",
    fs:"0",
    origin:pageOrigin,
    widget_referrer:pageUrl
  });

  iframe.src =
    `https://www.youtube.com/embed/${TRACKS.aura.videoId}?${params.toString()}`;

  host.replaceChildren(iframe);
}

function attachYouTube(){
  if (ytPlayer || !window.YT || !YT.Player) return;

  const iframe = $("#yt-player");
  if (!iframe) return;

  ytPlayer = new YT.Player(iframe, {
    events:{
      onReady:()=>{
        ytReady = true;

        // Start the opening track muted immediately.
        // Muted autoplay is allowed by modern browsers much more reliably
        // than audible autoplay.
        ytPlayer.mute();
        ytPlayer.setVolume(TRACKS.aura.volume);
        currentTrackKey = "aura";
        activeScene = $("#intro");
        updateMusicUI("aura");

        try{
          ytPlayer.playVideo();
          preEntryMutedPlayback = true;
          setStatus("INTRO PLAYING");
          const state = $("#preSoundState");
          if (state) state.textContent = "TAP ANYWHERE FOR SOUND";
        }catch(error){
          setStatus("READY");
        }

        if (experienceStarted){
          unlockSound();
          playSceneTrack(activeScene || $("#intro"), true);
        }
      },

      onStateChange:(event)=>{
        if (!window.YT) return;

        if (event.data === YT.PlayerState.PLAYING){
          setStatus("PLAYING");
          musicDock?.classList.remove("paused");
        }

        if (event.data === YT.PlayerState.PAUSED){
          if (!isPaused && currentTrackKey !== "quiet"){
            setStatus("PAUSED");
          }
        }

        if (event.data === YT.PlayerState.BUFFERING){
          setStatus("BUFFERING…");
        }

        /*
          LOOP BEHAVIOR:
          When the current section's song ends, restart that same song.
          It continues looping until the visitor enters a different section.
        */
        if (
          event.data === YT.PlayerState.ENDED &&
          experienceStarted &&
          !isPaused &&
          currentTrackKey &&
          currentTrackKey !== "quiet"
        ){
          const activeKey = activeScene?.dataset.track;

          if (activeKey === currentTrackKey){
            ytPlayer.seekTo(0, true);
            ytPlayer.playVideo();
            setStatus("LOOPING");
          }
        }
      },

      onError:(event)=>{
        const code = Number(event.data);

        if (code === 153){
          setStatus("REFERRER BLOCKED");
        } else if (code === 101 || code === 150){
          setStatus("EMBED BLOCKED");
        } else {
          setStatus(`YOUTUBE ${code}`);
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
  document.head.appendChild(script);
}

loadYouTubeAPI();

/* =========================================================
   SCENE MUSIC
   ========================================================= */

function playSceneTrack(scene, force=false){
  if (!scene) return;

  const key = scene.dataset.track;
  const track = TRACKS[key];

  if (!track) return;

  requestedTrackKey = key;
  updateMusicUI(key);

  if (!experienceStarted) return;

  if (key === "quiet"){
    currentTrackKey = "quiet";

    if (ytReady && ytPlayer){
      ytPlayer.pauseVideo();
      setStatus("QUIET SECTION");
    }
    return;
  }

  if (!ytReady || !ytPlayer){
    setStatus("PLAYER LOADING…");
    return;
  }

  /*
    Don't reload the same track just because scroll events fire repeatedly.
    This prevents the song from restarting every few pixels.
  */
  if (currentTrackKey === key && !force){
    return;
  }

  currentTrackKey = key;

  ytPlayer.loadVideoById({
    videoId:track.videoId,
    startSeconds:0
  });

  ytPlayer.setVolume(track.volume);

  if (!isPaused){
    ytPlayer.playVideo();
  }

  setStatus("PLAYING");
}


function unlockSound(){
  if (firstSoundGestureUsed) return;
  firstSoundGestureUsed = true;

  if (!ytReady || !ytPlayer){
    setStatus("PLAYER LOADING…");
    return;
  }

  try{
    ytPlayer.unMute();
    ytPlayer.setVolume(TRACKS[currentTrackKey || "aura"]?.volume || 42);
    ytPlayer.playVideo();
    isPaused = false;
    musicDock?.classList.remove("paused");

    const state = $("#preSoundState");
    if (state) state.textContent = "SOUND ON";

    setStatus("PLAYING");
  }catch(error){
    setStatus("TAP MUSIC CONTROL");
  }
}

/*
  Browsers block audible autoplay without a user gesture.
  The FIRST pointer/key interaction anywhere on the landing screen
  unlocks audio. It does not have to be the Enter button.
*/
["pointerdown","touchstart"].forEach(eventName=>{
  window.addEventListener(eventName,()=>{
    if (!firstSoundGestureUsed) unlockSound();
  },{once:true,passive:true});
});

window.addEventListener("keydown",()=>{
  if (!firstSoundGestureUsed) unlockSound();
},{once:true});

function startExperience(){
  experienceStarted = true;
  isPaused = false;

  unlockSound();
  musicDock?.classList.add("visible");

  const intro = $("#intro");
  activeScene = intro;
  intro?.classList.add("is-active");

  // Do not restart Aura 10/10 if it is already playing.
  if (currentTrackKey !== "aura"){
    playSceneTrack(intro, true);
  }

  $("#presence")?.scrollIntoView({
    behavior:reducedMotion ? "auto" : "smooth"
  });
}

enterBtn?.addEventListener("click", startExperience);

musicToggle?.addEventListener("click", ()=>{
  if (!ytReady || !ytPlayer) return;

  isPaused = !isPaused;
  musicDock?.classList.toggle("paused", isPaused);

  if (isPaused){
    ytPlayer.pauseVideo();
    setStatus("PAUSED");
  } else {
    if (currentTrackKey === "quiet"){
      playSceneTrack(activeScene, true);
    } else {
      ytPlayer.playVideo();
      setStatus("PLAYING");
    }
  }
});

/* =========================================================
   STABLE ACTIVE-SCENE DETECTION
   Viewport-center method prevents observer flicker/restarts.
   ========================================================= */

const scenes = $$("[data-track]");

function sceneAtViewportCenter(){
  const centerY = innerHeight * .5;

  let best = null;
  let bestDistance = Infinity;

  for (const scene of scenes){
    const r = scene.getBoundingClientRect();

    if (r.top <= centerY && r.bottom >= centerY){
      return scene;
    }

    const sceneCenter = (r.top + r.bottom) / 2;
    const distance = Math.abs(sceneCenter - centerY);

    if (distance < bestDistance){
      bestDistance = distance;
      best = scene;
    }
  }

  return best;
}

function activateScene(scene){
  if (!scene || scene === activeScene) return;

  activeScene?.classList.remove("is-active");
  activeScene = scene;
  activeScene.classList.add("is-active");

  if (experienceStarted){
    playSceneTrack(activeScene);
  }
}

/* Full-screen panels also receive active state individually */
const motionPanels = $$(".motion-panel");

function updateActivePanels(){
  const centerY = innerHeight * .5;

  for (const panel of motionPanels){
    const r = panel.getBoundingClientRect();
    const active = r.top <= centerY && r.bottom >= centerY;
    panel.classList.toggle("is-active", active);
  }
}

/* =========================================================
   ONE RAF SCROLL LOOP
   ========================================================= */

let scrollTicking = false;

function updateScroll(){
  scrollTicking = false;
  const vh = innerHeight;

  activateScene(sceneAtViewportCenter());
  updateActivePanels();

  /* Kinetic presence motion */
  const presence = $("#presence");
  if (presence){
    const r = presence.getBoundingClientRect();
    const p = clamp(
      (-r.top) / Math.max(1, presence.offsetHeight - vh),
      0,
      1
    );

    $$(".statement span").forEach((word,index)=>{
      const direction = index % 2 ? 1 : -1;
      word.style.transform =
        `translateX(${direction * (p - .5) * 9}vw)`;
      word.style.opacity = String(.45 + p * .55);
    });
  }

  /* Aura meters */
  $$(".meter").forEach(meter=>{
    const r = meter.getBoundingClientRect();

    if (r.top < vh * .82){
      const value = Number(meter.dataset.value || 0);
      const bar = $("em",meter);

      if (bar){
        bar.style.width = `${Math.min(value,100)}%`;
      }
    }
  });

  /* Birthday reveal line */
  const reveal = $("#reveal");
  if (reveal){
    const r = reveal.getBoundingClientRect();
    const line = $(".reveal__line");

    if (line && r.top < vh * .55){
      line.style.width = "min(320px,62vw)";
    }
  }
}

addEventListener("scroll",()=>{
  if (!scrollTicking){
    requestAnimationFrame(updateScroll);
    scrollTicking = true;
  }
},{passive:true});

addEventListener("resize",()=>{
  requestAnimationFrame(updateScroll);
});

updateScroll();

/* Intro begins with motion even before Enter is pressed */
requestAnimationFrame(()=>{
  $("#intro")?.classList.add("is-active");
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
