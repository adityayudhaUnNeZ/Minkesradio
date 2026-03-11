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
  const peakCount = $("peakCount");
  const hint = $("hint");

  let state = null;
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

  async function loadState() {
    const res = await fetch("/api/state", { cache: "no-store" });
    state = await res.json();
    renderState();
  }

  function numberFromText(text, fallback) {
    const match = String(text || "").match(/(\d+)/);
    return match ? match[1] : fallback;
  }

  function renderState() {
    const stationName = state?.stationName || "Minkes Radio";
    document.title = stationName;

    if (listenerCount) listenerCount.textContent = numberFromText(state?.listenersText, "60");
    if (peakCount) peakCount.textContent = numberFromText(state?.topicText, "100");

    const posterUrl = state?.posterUrl;
    if (posterUrl) poster.src = posterUrl;

    const hasStream = Boolean(state?.streamUrl);
    setHint(hasStream ? "Tap play untuk mulai mendengar." : "Setel URL stream di halaman Admin untuk mulai memutar.");
  }

  async function togglePlay() {
    if (!state?.streamUrl) {
      setHint("Stream URL belum diatur. Buka Admin untuk mengisi.");
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

  setPlayUi(false);
  setMuteUi(false);
  loadState().catch(() => setHint("Gagal memuat data. Pastikan server berjalan."));
})();
