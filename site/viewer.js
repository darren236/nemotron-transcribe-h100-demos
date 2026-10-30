const $ = (id) => document.getElementById(id);
const audio = $("audio");
let data = null;
let audioUrl = null;
let selectedAudio = null;
let selectedAudioHash = null;
let matchedAudio = false;
let currentDemo = null;
let loadToken = 0;

function clock(seconds) {
  const value = Math.max(0, Math.floor(Number(seconds) || 0));
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

function srtTime(seconds) {
  const ms = Math.round(seconds * 1000);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms % 1000).padStart(3, "0")}`;
}

function validateResult(value) {
  if (!value || value.schema_version !== 1 || !Array.isArray(value.words) || !value.words.length) throw Error("Not a compatible result JSON.");
  if (!["illustrative_sample", "model_output"].includes(value.status)) throw Error("Unknown result status.");
  for (const item of value.words) {
    if (typeof item.word !== "string" || !Number.isFinite(item.start) || !Number.isFinite(item.end) || item.start < 0 || item.end < item.start) throw Error("Invalid word timestamps.");
  }
  return value;
}

function turns(words) {
  const groups = [];
  for (const item of words) {
    const speaker = String(item.speaker || "spk:0");
    if (!groups.length || groups.at(-1).speaker !== speaker) groups.push({speaker, start:item.start, words:[]});
    groups.at(-1).words.push(item);
  }
  return groups;
}

function speakerLabel(id) {
  const match = String(id).match(/(\d+)$/);
  return match ? `SPEAKER ${Number(match[1]) + 1}` : String(id).toUpperCase();
}

function matchingWordIndexes(words, query) {
  const tokens = query.toLowerCase().split(/\s+/).map((s) => s.replace(/[^\p{L}\p{N}']/gu, "")).filter(Boolean);
  const matches = new Set();
  if (!tokens.length) return matches;
  const normalized = words.map(({word}) => word.toLowerCase().replace(/[^\p{L}\p{N}']/gu, ""));
  for (let i = 0; i + tokens.length <= normalized.length; i++) {
    const hit = tokens.length === 1 ? normalized[i].includes(tokens[0]) : tokens.every((token, j) => normalized[i + j] === token);
    if (hit) for (let j = 0; j < tokens.length; j++) matches.add(i + j);
  }
  return matches;
}

function renderTranscript() {
  const container = $("transcript");
  container.replaceChildren();
  if (!data) return;
  const query = $("search").value.trim().toLowerCase();
  let shown = 0;
  for (const group of turns(data.words)) {
    const matchIndexes = matchingWordIndexes(group.words, query);
    if (query && !matchIndexes.size) continue;
    shown++;
    const turn = document.createElement("div"); turn.className = "turn";
    const label = document.createElement("div"); label.className = "speaker" + (/1$/.test(group.speaker) ? " alt" : "");
    label.textContent = speakerLabel(group.speaker);
    const stamp = document.createElement("span"); stamp.className = "stamp"; stamp.textContent = clock(group.start);
    label.append(stamp);
    const words = document.createElement("div"); words.className = "words";
    for (const [index, item] of group.words.entries()) {
      const button = document.createElement("button");
      button.className = "word" + (query && matchIndexes.has(index) ? " match" : "");
      button.textContent = item.word;
      button.dataset.start = String(item.start); button.dataset.end = String(item.end);
      button.title = `Jump to ${clock(item.start)}`;
      button.addEventListener("click", () => {
        if (matchedAudio) {audio.currentTime = item.start; audio.play().catch(() => {});}
      });
      words.append(button, document.createTextNode(" "));
    }
    turn.append(label, words); container.append(turn);
  }
  $("empty").hidden = shown !== 0;
  updatePlayback();
}

function drawWave() {
  const box = $("waveform"); box.replaceChildren();
  for (let i = 0; i < 100; i++) {
    const bar = document.createElement("i"); bar.className = "bar";
    const value = Math.abs(Math.sin(i * 0.73) * Math.cos(i * 0.19));
    bar.style.height = `${10 + Math.round(value * 36)}px`;
    box.append(bar);
  }
}

function updatePlayback() {
  if (!data) return;
  const end = audio.duration || data.audio_duration_seconds || data.words.at(-1).end;
  const now = matchedAudio ? audio.currentTime : 0;
  $("time").textContent = `${clock(now)} / ${clock(end + 0.5)}`;
  $("seek").max = String(end); $("seek").value = String(now);
  const fraction = end ? now / end : 0;
  [...$("waveform").children].forEach((bar, i) => bar.classList.toggle("passed", i / 100 <= fraction));
  for (const button of document.querySelectorAll(".word")) {
    const start = Number(button.dataset.start), stop = Number(button.dataset.end);
    button.classList.toggle("active", matchedAudio && now >= start && now < stop + 0.05);
  }
  $("play").textContent = audio.paused ? "▶" : "Ⅱ";
}

function updateStatus() {
  if (!data) return;
  const real = data.status === "model_output";
  const badge = $("source-badge");
  badge.textContent = real ? "MODEL OUTPUT" : "ILLUSTRATIVE SAMPLE";
  badge.className = "badge " + (real ? "real" : "sample");
  $("recording-title").textContent = currentDemo?.title || data.title || "Untitled recording";
  $("word-count").textContent = String(data.words.length);
  $("speaker-count").textContent = String(new Set(data.words.map((item) => item.speaker || "spk:0")).size);
  $("length").textContent = clock((data.audio_duration_seconds || data.words.at(-1).end) + 0.5);
  $("model-name").textContent = data.model || "Unknown";
  $("source-note").textContent = real ? `Real model output${data.request_seconds ? ` · ${data.request_seconds}s request time` : ""}. ${currentDemo?.description || "Review names and speaker turns against the recording."}` : "Illustrative transcript for layout preview. No model inference has run.";
  const sourceLink = $("source-link");
  sourceLink.hidden = !currentDemo?.source_url;
  if (currentDemo?.source_url) sourceLink.href = currentDemo.source_url;
  $("footer-status").textContent = real ? `REAL MODEL OUTPUT · ${currentDemo?.source || "USER-SUPPLIED RECORDING"}`.toUpperCase() : "MODEL OUTPUT WILL BE LABELLED AFTER INFERENCE";
  matchedAudio = Boolean(real && selectedAudio && selectedAudio.name === data.audio_file && selectedAudioHash === data.audio_sha256);
  $("play").disabled = !matchedAudio;
  $("seek").disabled = !matchedAudio;
  $("export").disabled = !real;
  const notice = $("notice");
  notice.className = "notice" + (matchedAudio ? " ready" : "");
  notice.textContent = matchedAudio ? "Model result and matching audio verified. Click a word to jump to it." : real ? `Load the matching audio file (${data.audio_file || "from this run"}) to enable synchronized playback. The file is checked against the result's SHA-256.` : "Preview text is illustrative. Load a model result JSON and its matching audio for synchronized playback.";
  $("audio-label").textContent = selectedAudio ? selectedAudio.name : "Select the matching audio to enable playback";
  updatePlayback();
}

function makeSrt(words) {
  const cues = [];
  let current = [];
  function flush() {
    if (!current.length) return;
    const first = current[0], last = current.at(-1);
    cues.push(`${cues.length + 1}\n${srtTime(first.start)} --> ${srtTime(last.end)}\n${speakerLabel(first.speaker || "spk:0")}: ${current.map((x) => x.word).join(" ")}\n`);
    current = [];
  }
  for (const item of words) {
    if (current.length && (item.speaker !== current[0].speaker || item.start - current[0].start > 6 || item.start - current.at(-1).end > 1.5)) flush();
    current.push(item);
    if (/[.!?]$/.test(item.word) || current.length >= 14) flush();
  }
  flush(); return cues.join("\n");
}

$("json-file").addEventListener("change", async (event) => {
  const file = event.target.files?.[0]; if (!file) return;
  try { data = validateResult(JSON.parse(await file.text())); loadToken++; audio.pause(); currentDemo = null; updateDemoActive(); renderTranscript(); updateStatus(); }
  catch (error) { alert(`Could not load result: ${error.message}`); }
});
$("audio-file").addEventListener("change", async (event) => {
  const file = event.target.files?.[0]; if (!file) return;
  audio.pause(); if (audioUrl) URL.revokeObjectURL(audioUrl);
  selectedAudio = file; selectedAudioHash = null;
  audioUrl = URL.createObjectURL(file); audio.src = audioUrl; updateStatus();
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  if (selectedAudio === file) {
    selectedAudioHash = [...new Uint8Array(digest)].map((x) => x.toString(16).padStart(2, "0")).join("");
    updateStatus();
  }
});
$("play").addEventListener("click", () => { if (audio.paused) audio.play().catch(() => {}); else audio.pause(); });
$("seek").addEventListener("input", (event) => { if (matchedAudio) audio.currentTime = Number(event.target.value); });
$("search").addEventListener("input", renderTranscript);
$("export").addEventListener("click", () => {
  if (!data) return;
  const blob = new Blob([makeSrt(data.words)], {type:"text/plain;charset=utf-8"});
  const url = URL.createObjectURL(blob), link = document.createElement("a");
  link.href = url; link.download = `${(data.title || "transcript").replace(/[^a-z0-9_-]+/gi, "-")}.srt`;
  link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});
audio.addEventListener("timeupdate", updatePlayback);
audio.addEventListener("loadedmetadata", updatePlayback);
audio.addEventListener("play", updatePlayback);
audio.addEventListener("pause", updatePlayback);
function updateDemoActive() {
  for (const button of document.querySelectorAll(".demo-option")) {
    const selected = button.dataset.demo === currentDemo?.id;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", String(selected));
  }
}

async function selectDemo(entry) {
  const token = ++loadToken;
  audio.pause();
  matchedAudio = false;
  $("play").disabled = true;
  $("seek").disabled = true;
  $("notice").textContent = `Loading ${entry.title} and checking the model result…`;
  const [resultResponse, audioResponse] = await Promise.all([fetch(entry.result), fetch(entry.audio)]);
  if (!resultResponse.ok || !audioResponse.ok) throw Error(`Missing files for ${entry.title}`);
  const candidate = validateResult(await resultResponse.json());
  if (candidate.status !== "model_output") throw Error(`${entry.title} is not a real model result`);
  const audioName = entry.audio.split("/").at(-1);
  if (candidate.audio_file !== audioName) throw Error(`Audio filename mismatch for ${entry.title}`);
  const file = new File([await audioResponse.blob()], audioName, {type:"audio/wav"});
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  const hash = [...new Uint8Array(digest)].map((x) => x.toString(16).padStart(2, "0")).join("");
  if (hash !== candidate.audio_sha256) throw Error(`${entry.title} audio does not match the model result`);
  if (token !== loadToken) return;
  data = candidate;
  currentDemo = entry;
  $("demo-video").href = `${entry.id}.html`;
  $("demo-result").href = entry.result;
  selectedAudio = file; selectedAudioHash = hash;
  if (audioUrl) URL.revokeObjectURL(audioUrl);
  audioUrl = URL.createObjectURL(file); audio.src = audioUrl;
  $("search").value = "";
  renderTranscript(); updateStatus(); updateDemoActive();
  const url = new URL(location.href);
  url.searchParams.set("demo", entry.id);
  history.replaceState(null, "", url);
}

async function loadCatalog() {
  const response = await fetch("demos/catalog.json");
  if (!response.ok) throw Error("Demo catalog is unavailable");
  const catalog = await response.json();
  if (!Array.isArray(catalog) || !catalog.length) throw Error("Demo catalog is empty");
  const container = $("demo-options");
  for (const entry of catalog) {
    const button = document.createElement("button");
    button.type = "button"; button.className = "demo-option"; button.dataset.demo = entry.id;
    const number = document.createElement("span"); number.className = "demo-number"; number.textContent = entry.number;
    const label = document.createElement("span"); label.className = "demo-label"; label.textContent = entry.label;
    const title = document.createElement("strong"); title.textContent = entry.title;
    const description = document.createElement("span"); description.className = "demo-description"; description.textContent = entry.description;
    button.append(number, label, title, description);
    button.addEventListener("click", () => selectDemo(entry).catch((error) => { $("notice").textContent = `Could not load demo: ${error.message}`; }));
    container.append(button);
  }
  const requested = new URL(location.href).searchParams.get("demo");
  await selectDemo(catalog.find((entry) => entry.id === requested) || catalog[0]);
}

drawWave();
loadCatalog().catch((error) => { $("notice").textContent = `Could not load demos: ${error.message}`; });
