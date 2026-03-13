(function () {
  const $ = (id) => document.getElementById(id);

  const audio = $("audio");
  const poster = $("poster");
  const btnPlay = $("btnPlay");
  const btnMute = $("btnMute");
  const iconPlay = $("iconPlay");
  const iconVolume = $("iconVolume");
  const seekBar = $("seekBar");
  const listenerCount = $("listenerCount");
  const topicText = $("topicText");
  const btnShare = $("btnShare");
  const tabSalam = $("tabSalam");
  const tabRequest = $("tabRequest");
  const formSalam = $("formSalam");
  const formRequest = $("formRequest");
  const hint = $("hint");

  const state = {
    stationName: "Minkes Radio",
    city: "Semarang",
    programTitle: "On Air",
    hosts: ["Isul", "Laily"],
    scheduleText: "Rabu, 4 Februari 2026 10.00-11.00 WIB",
    listenersText: "60 Listener",
    topicText: "Topics: UHC",
    streamUrl: "",
    posterUrl: "",
    links: {
      youtube: "",
      instagram: "",
      website: ""
    }
  };
  let isPlaying = false;
  let fakeProgressTimer = null;

  function setHint(text) {
    if (!hint) return;
    hint.textContent = text;
  }

  function setPlayUi(playing) {
    isPlaying = playing;
    if (iconPlay) {
      iconPlay.innerHTML = playing
        ? '<rect x="6" y="5" width="4" height="14" rx="1"></rect><rect x="14" y="5" width="4" height="14" rx="1"></rect>'
        : '<path d="M8 5l11 7-11 7V5z"></path>';
    }
    btnPlay.title = playing ? "Pause" : "Play";
  }

  function setMuteUi(muted) {
    if (iconVolume) {
      iconVolume.innerHTML = muted
        ? '<path d="M4 9h4l5-4v14l-5-4H4V9z"></path><path d="M16 8l4 4m0-4l-4 4" stroke="#334155" stroke-width="2" stroke-linecap="round"></path>'
        : '<path d="M4 9h4l5-4v14l-5-4H4V9zm12.5 3a4.5 4.5 0 0 0-2-3.7v7.4a4.5 4.5 0 0 0 2-3.7z"></path>';
    }
    btnMute.title = muted ? "Unmute" : "Mute";
  }

  function startFakeProgress() {
    stopFakeProgress();
    let value = 0;
    fakeProgressTimer = window.setInterval(() => {
      // Live streams don't have real progress; animate subtly.
      value = (value + 1) % 100;
      if (seekBar) seekBar.style.width = `${value}%`;
    }, 500);
  }

  function stopFakeProgress() {
    if (fakeProgressTimer) window.clearInterval(fakeProgressTimer);
    fakeProgressTimer = null;
    if (seekBar) seekBar.style.width = "40%";
  }

  function renderState() {
    const stationName = state?.stationName || "Minkes Radio";
    document.title = stationName;

    if (listenerCount) listenerCount.textContent = state?.listenersText || "60 Listener";
    if (topicText) topicText.textContent = state?.topicText || "Topics: UHC";

    const posterUrl = state?.posterUrl;
    if (posterUrl) poster.src = posterUrl;

    const hasStream = Boolean(state?.streamUrl);
    setHint(hasStream ? "Tap play untuk mulai mendengar." : "Setel URL stream untuk mulai memutar.");
  }

  async function togglePlay() {
    if (!state?.streamUrl) {
      setHint("Stream URL belum diatur. Silakan isi URL stream.");
      return;
    }

    if (!audio.src || audio.src !== state.streamUrl) {
      audio.src = state.streamUrl;
    }

    try {
      if (audio.paused) {
        await audio.play();
      } else {
        audio.pause();
      }
    } catch (e) {
      setHint("Gagal memutar. Pastikan Stream URL valid dan mendukung CORS/HTTPS.");
      setPlayUi(false);
      stopFakeProgress();
    }
  }

  btnPlay.addEventListener("click", () => {
    togglePlay();
  });

  btnMute.addEventListener("click", () => {
    audio.muted = !audio.muted;
    setMuteUi(audio.muted);
  });

  if (btnShare) {
    btnShare.addEventListener("click", async () => {
      const payload = {
        title: document.title,
        text: state?.programTitle ? `${state.programTitle} - ${state.stationName || "Minkes Radio"}` : document.title,
        url: window.location.href
      };
      try {
        if (navigator.share) {
          await navigator.share(payload);
        } else {
          await navigator.clipboard.writeText(payload.url);
          setHint("Link disalin ke clipboard.");
          window.setTimeout(() => renderState(), 2000);
        }
      } catch {
        // ignore
      }
    });
  }

  audio.addEventListener("play", () => {
    setPlayUi(true);
    startFakeProgress();
    setHint("Sedang memutar...");
  });

  audio.addEventListener("pause", () => {
    setPlayUi(false);
    stopFakeProgress();
    renderState();
  });

  audio.addEventListener("error", () => {
    setPlayUi(false);
    stopFakeProgress();
    setHint("Tidak bisa memuat stream. Cek URL dan koneksi.");
  });

  function setActiveTab(tab) {
    const isSalam = tab === "salam";
    if (formSalam) formSalam.classList.toggle("hidden", !isSalam);
    if (formRequest) formRequest.classList.toggle("hidden", isSalam);

    if (tabSalam) {
      tabSalam.classList.toggle("tab-pill-active", isSalam);
      tabSalam.setAttribute("aria-pressed", isSalam ? "true" : "false");
    }
    if (tabRequest) {
      tabRequest.classList.toggle("tab-pill-active", !isSalam);
      tabRequest.setAttribute("aria-pressed", !isSalam ? "true" : "false");
    }
  }

  if (tabSalam) tabSalam.addEventListener("click", () => setActiveTab("salam"));
  if (tabRequest) tabRequest.addEventListener("click", () => setActiveTab("request"));

  setPlayUi(false);
  setMuteUi(false);
  setActiveTab("salam");
  renderState();
})();
