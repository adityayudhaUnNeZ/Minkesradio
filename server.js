const path = require("path");
const fs = require("fs/promises");
const express = require("express");

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

const dataDir = path.join(__dirname, "data");
const statePath = path.join(dataDir, "state.json");

app.use(express.json({ limit: "200kb" }));
app.use(express.static(path.join(__dirname, "public")));

async function ensureStateFile() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(statePath);
  } catch {
    const initialState = {
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
        website: "",
      },
    };
    await atomicWriteJson(statePath, initialState);
  }
}

async function atomicWriteJson(filePath, data) {
  const tmpPath = `${filePath}.${process.pid}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tmpPath, filePath);
}

function normalizeState(input) {
  const safeString = (value, max = 200) => {
    if (typeof value !== "string") return "";
    return value.trim().slice(0, max);
  };
  const safeArrayOfStrings = (value, maxItems = 8) => {
    if (!Array.isArray(value)) return [];
    return value
      .filter((v) => typeof v === "string")
      .map((v) => v.trim())
      .filter(Boolean)
      .slice(0, maxItems);
  };
  const safeUrl = (value) => {
    const s = safeString(value, 500);
    if (!s) return "";
    try {
      // Allow http(s) and also common stream protocols over http(s).
      const u = new URL(s);
      if (u.protocol !== "http:" && u.protocol !== "https:") return "";
      return u.toString();
    } catch {
      return "";
    }
  };

  const links = input && typeof input === "object" ? input.links : undefined;

  return {
    stationName: safeString(input?.stationName, 60) || "Minkes Radio",
    city: safeString(input?.city, 60),
    programTitle: safeString(input?.programTitle, 80) || "On Air",
    hosts: safeArrayOfStrings(input?.hosts, 8),
    scheduleText: safeString(input?.scheduleText, 120),
    listenersText: safeString(input?.listenersText, 40),
    topicText: safeString(input?.topicText, 60),
    streamUrl: safeUrl(input?.streamUrl),
    posterUrl: safeUrl(input?.posterUrl),
    links: {
      youtube: safeUrl(links?.youtube),
      instagram: safeUrl(links?.instagram),
      website: safeUrl(links?.website),
    },
  };
}

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/admin", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.get("/api/state", async (_req, res) => {
  await ensureStateFile();
  const raw = await fs.readFile(statePath, "utf8");
  res.type("json").send(raw);
});

app.post("/api/state", async (req, res) => {
  await ensureStateFile();
  const nextState = normalizeState(req.body);
  await atomicWriteJson(statePath, nextState);
  res.json({ ok: true, state: nextState });
});

app.listen(PORT, async () => {
  await ensureStateFile();
  // eslint-disable-next-line no-console
  console.log(`Minkes Radio running on http://localhost:${PORT}`);
});
