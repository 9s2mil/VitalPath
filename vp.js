const tasksByDay = {
    0: [],
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: []
};
const weekday = ["☀️ 일", "🌙 월", "🔥 화", "💧 수", "🌲 목", "💰 금", "🌍 토"];
const hero = document.getElementById("page-home");
let currentDay = new Date().getDay();

function weekKey() {
const now = new Date();
const localMid = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const sunday = new Date(localMid);
sunday.setDate(localMid.getDate() - localMid.getDay());
const y = sunday.getFullYear();
const m = String(sunday.getMonth() + 1).padStart(2, "0");
const d = String(sunday.getDate()).padStart(2, "0");
return `${y}-${m}-${d}`;
}

let CURRENT_WK = weekKey();
let STORE_KEY = `tasksState_${CURRENT_WK}`;
let state = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");

function updateDayDone(day){
const list = getTasksFor(day);
const arr  = state[day] || [];
const allDone = list.length > 0 && list.every((_, i) => arr[i] === true);
const icon = document.querySelector(`.icons .icon:nth-child(${day+1})`);
if (icon) icon.classList.toggle("done", allDone);
}

function saveAndUpdate(day) {
localStorage.setItem(STORE_KEY, JSON.stringify(state));
updateDayDone(day);
}

function renderDay() {
    const [emoji, name] = weekday[currentDay].split(/\s+/);
    document.querySelector(".subhead").textContent = `${name}요일 (${emoji})`;

    hero.innerHTML = "";
    const list = getTasksFor(currentDay); 

    list.forEach((t, i) => {
        const div = document.createElement("div");
        div.className = "task";
        const checked = (state[currentDay]?.[i]) === true;
        div.innerHTML =
            `<span>${t}</span>` +
            `<input type="checkbox" data-idx="${i}" ${checked ? "checked" : ""}>`;
        hero.appendChild(div);
    });

    updateDayDone(currentDay);
}


hero.addEventListener("change", (e) => {
if (e.target.matches('input[type="checkbox"][data-idx]')) {
    const i = Number(e.target.dataset.idx);
    state[currentDay] = state[currentDay] || [];
    state[currentDay][i] = e.target.checked;
    saveAndUpdate(currentDay);
}
});

const prevBtn = document.querySelector(".day-nav.outside .prev");
const nextBtn = document.querySelector(".day-nav.outside .next");
if (prevBtn) prevBtn.onclick = () => { currentDay = (currentDay + 6) % 7; renderDay(); };
if (nextBtn) nextBtn.onclick = () => { currentDay = (currentDay + 1) % 7; renderDay(); };

for (let d = 0; d < 7; d++) updateDayDone(d);

setInterval(() => {
const wk = weekKey();
if (wk !== CURRENT_WK) {
    CURRENT_WK = wk;
    STORE_KEY = `tasksState_${CURRENT_WK}`;
    state = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
    for (let d = 0; d < 7; d++) updateDayDone(d);
    renderDay();
}
}, 30000);

renderDay();

const NAV_LABELS = ["體鍛", "正形", "飛徙", "飛越", "游泳", "養生"];
const NAV_CONTENT = ["", "", "", "", "", ""];

const sheet = document.getElementById("sheet");
const sheetTitle = sheet.querySelector(".sheet-title");
const sheetBody = sheet.querySelector(".sheet-body");
const sheetClose = sheet.querySelector(".sheet-close");
const sheetEdit = sheet.querySelector(".sheet-edit");

let openId = null;
let editing = false;

function noteKey(idx) {
return `note_${CURRENT_WK}_${idx}`; 
}
function renderRead(idx) {
const note = localStorage.getItem(noteKey(idx)) || "";
const contentHtml = `<div class="section-content">${NAV_CONTENT[idx] || ""}</div>` +
    (note ? `<div class="section-note" style="margin-top:10px;white-space:pre-wrap;">${note}</div>` : "");
sheetBody.innerHTML = contentHtml;
editing = false;
}
function renderEdit(idx) {
const note = localStorage.getItem(noteKey(idx)) || "";
sheetBody.innerHTML = `
<textarea class="note-input" placeholder="여기에 메모를 입력하세요...">${note}</textarea>
<div class="save-row">
    <button type="button" class="save-btn">저장</button>
    <button type="button" class="cancel-btn">취소</button>
</div>
`;
sheetBody.querySelector(".save-btn").onclick = () => {
    const val = sheetBody.querySelector(".note-input").value;
    localStorage.setItem(noteKey(idx), val);
    renderRead(idx);
};
sheetBody.querySelector(".cancel-btn").onclick = () => renderRead(idx);
editing = true;
}

document.querySelectorAll(".nav-btn").forEach((btn, idx) => {
btn.addEventListener("click", () => {
    if (openId === idx) { sheet.hidden = !sheet.hidden; return; }
    openId = idx;
    sheetTitle.textContent = NAV_LABELS[idx];
    renderRead(idx);
    sheet.hidden = false;
});
});

sheetEdit.addEventListener("click", () => {
if (openId == null) return;
editing ? renderRead(openId) : renderEdit(openId);
});

function closeSheet() { sheet.hidden = true; openId = null; editing = false; }
sheetClose.addEventListener("click", closeSheet);
document.addEventListener("keydown", e => { if (e.key === "Escape") closeSheet(); });

function customTasksKey(day) { return `customTasks_${CURRENT_WK}_${day}`; }

function getTasksFor(day) {
    const raw = localStorage.getItem(customTasksKey(day));
    if (raw) {
    try { const arr = JSON.parse(raw); if (Array.isArray(arr) && arr.length) return arr; } catch (e) { }
    }
    return tasksByDay[day] || [];
}

function setTasksFor(day, list) {
    localStorage.setItem(customTasksKey(day), JSON.stringify(list));
    state[day] = []; saveAndUpdate(day);
}

function openEditToday() {
    const list = getTasksFor(currentDay);
    sheetTitle.textContent = "오늘 할 일 편집";
    sheetBody.innerHTML = `
    <textarea class="note-input" placeholder="줄바꿈으로 항목 구분">${list.join("\n")}</textarea>
    <div class="save-row">
    <button type="button" class="save-btn">저장</button>
    </div>
`;
    sheetBody.querySelector(".save-btn").onclick = () => {
    const val = sheetBody.querySelector(".note-input").value || "";
    const lines = val.split("\n").map(s => s.trim()).filter(Boolean);
    setTasksFor(currentDay, lines);
    renderDay();
    closeSheet(); // 저장 후 즉시 닫기
    };
    sheet.hidden = false;
}

document.querySelector(".icons-edit").addEventListener("click", openEditToday);

(function refreshWeekIfChanged() {
    const wk = weekKey();
    if (wk !== CURRENT_WK) {
    CURRENT_WK = wk;
    STORE_KEY = `tasksState_${CURRENT_WK}`;
    state = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
    for (let d = 0; d < 7; d++) updateDayDone(d);
    renderDay();
    }
})();

