(function () {
  const $ = (id) => document.getElementById(id);

  const status = $("status");
  const btnReload = $("btnReload");
  const btnReset = $("btnReset");
  const form = $("form");

  const fields = {
    stationName: $("stationName"),
    city: $("city"),
    programTitle: $("programTitle"),
    hosts: $("hosts"),
    scheduleText: $("scheduleText"),
    listenersText: $("listenersText"),
    topicText: $("topicText"),
    streamUrl: $("streamUrl"),
    posterUrl: $("posterUrl"),
    youtube: $("youtube"),
    instagram: $("instagram"),
    website: $("website")
  };

  let lastLoaded = null;

  function setStatus(text) {
    status.textContent = text;
  }

  function fillForm(state) {
    fields.stationName.value = state.stationName || "";
    fields.city.value = state.city || "";
    fields.programTitle.value = state.programTitle || "";
    fields.hosts.value = Array.isArray(state.hosts) ? state.hosts.join(", ") : "";
    fields.scheduleText.value = state.scheduleText || "";
    fields.listenersText.value = state.listenersText || "";
    fields.topicText.value = state.topicText || "";
    fields.streamUrl.value = state.streamUrl || "";
    fields.posterUrl.value = state.posterUrl || "";
    fields.youtube.value = state.links?.youtube || "";
    fields.instagram.value = state.links?.instagram || "";
    fields.website.value = state.links?.website || "";
  }

  function readForm() {
    const hosts = fields.hosts.value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    return {
      stationName: fields.stationName.value,
      city: fields.city.value,
      programTitle: fields.programTitle.value,
      hosts,
      scheduleText: fields.scheduleText.value,
      listenersText: fields.listenersText.value,
      topicText: fields.topicText.value,
      streamUrl: fields.streamUrl.value,
      posterUrl: fields.posterUrl.value,
      links: {
        youtube: fields.youtube.value,
        instagram: fields.instagram.value,
        website: fields.website.value
      }
    };
  }

  async function load() {
    setStatus("Memuat...");
    const res = await fetch("/api/state", { cache: "no-store" });
    const state = await res.json();
    lastLoaded = state;
    fillForm(state);
    setStatus("Ready.");
  }

  async function save(state) {
    setStatus("Menyimpan...");
    const res = await fetch("/api/state", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(state)
    });

    if (!res.ok) throw new Error("save_failed");
    const data = await res.json();
    lastLoaded = data.state;
    fillForm(data.state);
    setStatus("Tersimpan.");
    window.setTimeout(() => setStatus("Ready."), 1500);
  }

  btnReload.addEventListener("click", () => load().catch(() => setStatus("Gagal memuat.")));

  btnReset.addEventListener("click", () => {
    if (lastLoaded) fillForm(lastLoaded);
    setStatus("Di-reset ke data terakhir.");
    window.setTimeout(() => setStatus("Ready."), 1200);
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    save(readForm()).catch(() => setStatus("Gagal menyimpan. Cek URL (harus http/https)."));
  });

  load().catch(() => setStatus("Gagal memuat. Pastikan server berjalan."));
})();

