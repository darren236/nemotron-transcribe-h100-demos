const $ = (id) => document.getElementById(id);
const audio = $("audio");
let data = null;
let audioUrl = null;
let selectedAudio = null;
let selectedAudioHash = null;
let matchedAudio = false;

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
  $("time").textContent = `${clock(now)} / ${clock(end)}`;
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
  $("recording-title").textContent = data.title || "Untitled recording";
  $("word-count").textContent = String(data.words.length);
  $("speaker-count").textContent = String(new Set(data.words.map((item) => item.speaker || "spk:0")).size);
  $("length").textContent = clock(data.audio_duration_seconds || data.words.at(-1).end);
  $("model-name").textContent = data.model || "Unknown";
  $("source-note").textContent = real ? `Real model output${data.request_seconds ? ` · ${data.request_seconds}s request time` : ""}. Verify names and speaker turns against the recording.` : "Illustrative transcript for layout preview. No model inference has run.";
  $("footer-status").textContent = real ? "REAL MODEL OUTPUT · RECORDING SYNTHESIZED LOCALLY" : "MODEL OUTPUT WILL BE LABELLED AFTER INFERENCE";
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
  try { data = validateResult(JSON.parse(await file.text())); audio.pause(); renderTranscript(); updateStatus(); }
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
async function loadBundledResult() {
  let response = await fetch("runs/demo_conversation.json");
  if (!response.ok) response = await fetch("sample.json");
  if (!response.ok) throw Error("No bundled transcript available");
  data = validateResult(await response.json());
  renderTranscript(); updateStatus();
  if (data.status !== "model_output" || data.audio_file !== "demo_conversation.wav") return;
  const audioResponse = await fetch("assets/demo_conversation.wav");
  if (!audioResponse.ok) return;
  const blob = await audioResponse.blob();
  const file = new File([blob], "demo_conversation.wav", {type:"audio/wav"});
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  const hash = [...new Uint8Array(digest)].map((x) => x.toString(16).padStart(2, "0")).join("");
  if (hash !== data.audio_sha256) throw Error("Bundled audio does not match the model result");
  selectedAudio = file; selectedAudioHash = hash;
  if (audioUrl) URL.revokeObjectURL(audioUrl);
  audioUrl = URL.createObjectURL(file); audio.src = audioUrl;
  updateStatus();
}

drawWave();
loadBundledResult().catch((error) => { $("notice").textContent = `Could not load bundled demo: ${error.message}`; });
