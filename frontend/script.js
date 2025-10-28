// ============================
// Typing Speed Test + Growth Tracker + History
// ============================

// --- Sentence Pools ---
const sentencePools = {
  easy: [
    "Blue skies and calm seas.",
    "The cat naps by the window.",
    "Fresh bread smells so good.",
    "She smiles and waves hello.",
    "A small bird hopped on the fence.",
    "Light rain patters on the roof.",
    "The cup is full of coffee.",
    "Bright stars glitter tonight."
  ],
  medium: [
    "The morning market bustled with cheerful vendors.",
    "He checked the map, then started his walk through town.",
    "Clouds gathered quickly before the sudden shower arrived.",
    "She organizes her desk each evening to feel prepared.",
    "The library's quiet aisles offered peaceful refuge today."
  ],
  hard: [
    "The old clock tower chimed as commuters hurried along the cobbled streets.",
    "Complex melodies wove through the concert hall, stirring long-forgotten memories.",
    "Researchers debated the surprising findings late into the night at the university.",
    "A sudden change in wind altered the course of the tiny sailing vessel."
  ]
};

// --- Generate Paragraph ---
function generateParagraph(diff) {
  const pool = sentencePools[diff] || sentencePools.easy;
  const lines = diff === 'hard' ? 4 : diff === 'medium' ? 3 : 2;
  return pool.sort(() => Math.random() - 0.5).slice(0, lines).join(" ");
}

// --- Format Timer ---
function formatTime(sec) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// --- Globals ---
let startTime, timerInterval, words = [];

// --- Initialize Typing Test ---
window.onload = function () {
  const paragraphEl = document.getElementById("paragraph");
  if (!paragraphEl) return; // Only run on test page

  const difficulty = localStorage.getItem("difficulty") || "easy";
  const mode = localStorage.getItem("mode") || "60";

  const text = generateParagraph(difficulty);
  words = text.split(" ");
  paragraphEl.innerHTML = words.map((w, i) => `<span id="word-${i}">${w}</span>`).join(" ");
  document.getElementById("word-0").classList.add("current");

  const typed = document.getElementById("typed");
  typed.addEventListener("input", checkInput);

  if (mode !== "unlimited") {
    let t = parseInt(mode);
    document.getElementById("timer").innerText = formatTime(t);
    timerInterval = setInterval(() => {
      t--;
      document.getElementById("timer").innerText = formatTime(t);
      if (t <= 0) {
        clearInterval(timerInterval);
        finishTest();
      }
    }, 1000);
  } else {
    document.getElementById("timer").innerText = "Unlimited";
  }

  startTime = Date.now();
  document.getElementById("finishBtn").style.display = "inline-block";
};

// --- Input Tracking ---
function checkInput() {
  const typedVal = document.getElementById("typed").value.trim();
  const typedWords = typedVal.length ? typedVal.split(/\s+/) : [];
  words.forEach((w, i) => {
    const el = document.getElementById(`word-${i}`);
    if (!el) return;
    el.classList.remove("correct", "incorrect", "current");
    if (i < typedWords.length)
      el.classList.add(typedWords[i] === w ? "correct" : "incorrect");
    if (i === typedWords.length) el.classList.add("current");
  });
}

// --- Result Calculation ---
function calculateResults() {
  const end = Date.now();
  const typedVal = document.getElementById("typed").value.trim();
  const typedWords = typedVal ? typedVal.split(/\s+/) : [];
  const timeMin = Math.max((end - startTime) / 60000, 0.01);
  const wpm = Math.round(typedWords.length / timeMin);

  let correct = 0;
  words.forEach((w, i) => { if (typedWords[i] === w) correct++; });
  const accuracy = Math.round((correct / words.length) * 100);

  const username = localStorage.getItem("username") || "Guest";
  localStorage.setItem("result", `${username}, your speed was ${wpm} WPM with ${accuracy}% accuracy!`);

  saveLocalPerformance(wpm, accuracy);
  window.location.href = "result.html";
}

function finishTest() {
  clearInterval(timerInterval);
  calculateResults();
}

// --- Save Local Performance Data ---
function saveLocalPerformance(wpm, accuracy) {
  const today = new Date().toISOString().split('T')[0];
  const difficulty = localStorage.getItem("difficulty") || "easy";

  // Daily performance record
  let perf = JSON.parse(localStorage.getItem("performanceData") || "{}");
  if (!perf[today]) perf[today] = [];
  perf[today].push(wpm);
  localStorage.setItem("performanceData", JSON.stringify(perf));

  // Full test history
  let allWPM = JSON.parse(localStorage.getItem("allWPM") || "[]");
  allWPM.push({ date: today, difficulty, wpm, accuracy });
  localStorage.setItem("allWPM", JSON.stringify(allWPM));
}

// --- Compute Growth Data ---
function computeLocalGrowth() {
  const allWPM = JSON.parse(localStorage.getItem("allWPM") || "[]");
  if (allWPM.length === 0) return { avg: 0, latest: 0, daily: 0 };

  const latest = allWPM.at(-1).wpm;
  const avg = (allWPM.reduce((a, b) => a + b.wpm, 0) / allWPM.length).toFixed(1);

  // Daily improvement: compare latest to previous average
  const prevAvg = allWPM.length > 1
    ? (allWPM.slice(0, -1).reduce((a, b) => a + b.wpm, 0) / (allWPM.length - 1))
    : latest;
  const daily = prevAvg > 0 ? ((latest - prevAvg) / prevAvg * 100).toFixed(1) : 0;

  return { avg, latest, daily };
}

// --- Show Growth Analysis ---
function showGrowthAnalysis() {
  const el = document.getElementById("growthContent");
  if (!el) return;

  const stats = computeLocalGrowth();
  el.innerHTML = `
    <p><strong>Latest WPM:</strong> ${stats.latest}</p>
    <p><strong>Average WPM:</strong> ${stats.avg}</p>
    <p><strong>Daily Improvement:</strong> ${stats.daily}%</p>
  `;
}

// --- Show History Table ---
function showHistoryTable() {
  const tableBody = document.getElementById("historyBody");
  if (!tableBody) return;

  const history = JSON.parse(localStorage.getItem("allWPM") || "[]");
  if (!history.length) {
    tableBody.innerHTML = `<tr><td colspan="4">No test history found.</td></tr>`;
    return;
  }

  const rows = [...history].reverse().map(entry => `
    <tr>
      <td>${entry.date}</td>
      <td>${entry.difficulty}</td>
      <td>${entry.wpm}</td>
      <td>${entry.accuracy}%</td>
    </tr>
  `).join("");

  tableBody.innerHTML = rows;
}

// --- For Testing: Generate Mock Result ---
function saveMockResult() {
  const randomWPM = Math.floor(Math.random() * 40) + 60;
  const randomAccuracy = Math.floor(Math.random() * 10) + 90;
  saveLocalPerformance(randomWPM, randomAccuracy);
}
