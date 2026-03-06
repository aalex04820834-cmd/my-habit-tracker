let habits = [];
const today = new Date();
let viewDate = new Date(today.getFullYear(), today.getMonth(), 1);

function initData() {
    let saved = JSON.parse(localStorage.getItem('habitsV4'));
    if (saved) { habits = saved; }
    else {
        let oldData = JSON.parse(localStorage.getItem('habitsV3')) || JSON.parse(localStorage.getItem('premiumHabitData'));
        let currentMonthKey = getMonthKey(today);

        if (oldData && oldData.length > 0) {
            habits = oldData.map((h, i) => ({
                id: Date.now() + i, name: h.name, goal: h.goal,
                records: h.records ? h.records : { [currentMonthKey]: h.history || new Array(31).fill(false) }
            }));
        } else {
            habits = [
                { id: 1, name: "Morning Workout", goal: 20, records: {} },
                { id: 2, name: "Read 10 Pages", goal: 15, records: {} }
            ];
        }
        saveToLocal();
    }
}

function saveToLocal() { localStorage.setItem('habitsV4', JSON.stringify(habits)); }
function getMonthKey(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; }

function ensureMonthExists(monthKey, daysInMonth) {
    habits.forEach(h => {
        if (!h.records[monthKey] || h.records[monthKey].length !== daysInMonth) {
            let existing = h.records[monthKey] || [];
            let newArr = new Array(daysInMonth).fill(false);
            for (let i = 0; i < Math.min(existing.length, daysInMonth); i++) newArr[i] = existing[i];
            h.records[monthKey] = newArr;
        }
    });
}

// Chart Setup
const ctx = document.getElementById('habitChart').getContext('2d');
let myHabitChart = new Chart(ctx, {
    type: 'line',
    data: { labels: [], datasets: [{ data: [], borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', fill: true, tension: 0.4, borderWidth: 2, pointBackgroundColor: '#10b981', pointRadius: 3 }] },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: 0 },
        plugins: { legend: { display: false } },
        scales: {
            x: {
                display: false,
                offset: true // <--- THIS CENTERS THE DOTS OVER THE CHECKBOXES
            },
            y: {
                beginAtZero: true,
                ticks: { color: "#94a3b8", stepSize: 1 },
                grid: { color: "#334155", drawBorder: false },
                border: { display: false }
            }
        }
    }
});

function renderApp() {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthKey = getMonthKey(viewDate);

    ensureMonthExists(monthKey, daysInMonth);
    renderCalendar(year, month, daysInMonth, monthKey);
    renderTable(daysInMonth, monthKey);
    updateVisuals(daysInMonth, monthKey);
}

function renderCalendar(year, month, daysInMonth, monthKey) {
    const calWidget = document.getElementById('calendarWidget');
    const firstDay = new Date(year, month, 1).getDay();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    let html = `<div class="cal-header"><span>${monthNames[month]} ${year}</span><div><button class="cal-nav" onclick="changeMonth(-1)">&#10094;</button><button class="cal-nav" onclick="changeMonth(1)">&#10095;</button></div></div><div class="cal-weekdays"><span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span></div><div class="cal-days">`;
    for (let i = 0; i < firstDay; i++) html += `<div class="cal-day empty"></div>`;

    for (let day = 1; day <= daysInMonth; day++) {
        let dailyCompleted = 0;
        habits.forEach(h => { if (h.records[monthKey][day - 1]) dailyCompleted++; });
        let progressClass = 'none';
        if (habits.length > 0 && dailyCompleted > 0) {
            let pct = dailyCompleted / habits.length;
            progressClass = pct < 0.5 ? 'bad' : (pct < 1.0 ? 'medium' : 'good');
        }
        let isToday = (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) ? 'today' : '';
        html += `<div class="cal-day ${progressClass} ${isToday}">${day}</div>`;
    }
    calWidget.innerHTML = html + `</div>`;
}

window.changeMonth = function (dir) {
    viewDate.setMonth(viewDate.getMonth() + dir);
    renderApp();
}

function renderTable(daysInMonth, monthKey) {
    const tableHeader = document.getElementById("table-header");
    const tableBody = document.getElementById("habitTable");
    
    let headerHtml = `<th class="col-action"></th><th class="col-habit">Habit</th><th class="col-goal">Goal</th>`;
    for (let i = 1; i <= daysInMonth; i++) headerHtml += `<th class="col-day">${i}</th>`;
    tableHeader.innerHTML = headerHtml + `<th class="col-progress">Progress</th>`;

    tableBody.innerHTML = "";
    
    // Check if we are viewing the current real-world month or a future month
    let isCurrentMonth = (viewDate.getFullYear() === today.getFullYear() && viewDate.getMonth() === today.getMonth());
    let isFutureMonth = (viewDate.getFullYear() > today.getFullYear() || (viewDate.getFullYear() === today.getFullYear() && viewDate.getMonth() > today.getMonth()));

    habits.forEach((habit, index) => {
        let dayCells = "";
        for(let i=0; i<daysInMonth; i++) {
            let isChecked = habit.records[monthKey][i] ? "checked" : "";
            
            // Logic to disable checkboxes in the future
            let isDisabled = "";
            if (isFutureMonth) {
                isDisabled = "disabled";
            } else if (isCurrentMonth && (i + 1) > today.getDate()) {
                isDisabled = "disabled";
            }

            dayCells += `<td class="col-day"><input type="checkbox" data-habit="${index}" data-day="${i}" ${isChecked} ${isDisabled}></td>`;
        }
        let row = document.createElement("tr");
        row.innerHTML = `<td class="col-action"><button class="menu-btn" onclick="toggleMenu(${index}, event)">⋮</button><div id="menu-${index}" class="dropdown-content"><button onclick="editHabit(${index})">Edit</button><button onclick="deleteHabit(${index})" style="color:var(--danger)">Delete</button></div></td><td class="col-habit">${habit.name}</td><td class="col-goal">${habit.goal}</td>${dayCells}<td class="col-progress"><div class="progressBar"><div class="progress"></div></div></td>`;
        tableBody.appendChild(row);
    });

    document.querySelectorAll("input[type='checkbox']").forEach(box => {
        box.addEventListener("change", (e) => {
            habits[e.target.dataset.habit].records[monthKey][e.target.dataset.day] = e.target.checked;
            saveToLocal();
            renderCalendar(viewDate.getFullYear(), viewDate.getMonth(), daysInMonth, monthKey);
            updateVisuals(daysInMonth, monthKey);
        });
    });
}

// --- New Localized Month Stats Engine ---
function getCurrentMonthStats(windowSize, daysInMonth, monthKey) {
    let completed = 0;
    let possible = 0;

    let isCurrentMonth = (viewDate.getFullYear() === today.getFullYear() && viewDate.getMonth() === today.getMonth());
    let isFutureMonth = (viewDate.getFullYear() > today.getFullYear() || (viewDate.getFullYear() === today.getFullYear() && viewDate.getMonth() > today.getMonth()));

    if (isFutureMonth) return 0; // 0% if looking at a future month

    // The last valid day to check
    let endDay = isCurrentMonth ? today.getDate() : daysInMonth;
    
    // The first day to check (ensuring it doesn't cross backward into previous months)
    let startDay = Math.max(1, endDay - windowSize + 1);

    habits.forEach(h => {
        for(let i = startDay - 1; i < endDay; i++) {
            possible++;
            if (h.records[monthKey] && h.records[monthKey][i]) {
                completed++;
            }
        }
    });

    let pct = possible > 0 ? (completed / possible) * 100 : 0;
    return Math.min(pct, 100);
}

function updateVisuals(daysInMonth, monthKey) {
    let dailyCounts = new Array(daysInMonth).fill(0);

    let isCurrentMonth = (viewDate.getFullYear() === today.getFullYear() && viewDate.getMonth() === today.getMonth());
    let isFutureMonth = (viewDate.getFullYear() > today.getFullYear() || (viewDate.getFullYear() === today.getFullYear() && viewDate.getMonth() > today.getMonth()));

    let monthCompleted = 0;
    let monthGoal = 0;

    // 1. Update Row Progress Bars & Collect Chart Data
    habits.forEach((h, hIdx) => {
        let row = document.querySelectorAll("#habitTable tr")[hIdx];
        let rowChecked = 0;
        h.records[monthKey].forEach((checked, dayIdx) => {
            if (checked) { rowChecked++; dailyCounts[dayIdx]++; }
        });
        
        // Individual Row Progress Bar
        let effGoal = Math.min(h.goal, daysInMonth);
        let pct = Math.min((rowChecked / effGoal) * 100, 100);
        if(row) {
            let pLine = row.querySelector(".progress");
            pLine.style.width = pct + "%";
            pLine.style.boxShadow = pct === 100 ? "0 0 10px var(--accent)" : "none";
        }

        // Tally Success Rate stats for THIS month only
        let elapsedDays = isFutureMonth ? 0 : (isCurrentMonth ? today.getDate() : daysInMonth);
        let srGoal = Math.min(h.goal, elapsedDays); // Prevent goals from exceeding elapsed days
        
        monthCompleted += Math.min(rowChecked, srGoal);
        monthGoal += srGoal;
    });

    // 2. Viewed-Month Success Rate
    let successRate = monthGoal > 0 ? (monthCompleted / monthGoal) * 100 : 0;
    if (isFutureMonth) successRate = 0; // Force 0% for future months

    document.getElementById('successRateValue').innerText = Math.round(successRate) + "%";
    
    let srMsg = "LET'S GO!";
    if(successRate > 80) srMsg = "EXCELLENT!";
    else if(successRate > 50) srMsg = "GOOD JOB!";
    if(successRate === 0) srMsg = "LET'S GO!";
    document.getElementById('successRateMessage').innerText = srMsg;

    // 3. Donut Charts (Strictly locked to the viewed month)
    let d30 = getCurrentMonthStats(daysInMonth, daysInMonth, monthKey); 
    let d15 = getCurrentMonthStats(15, daysInMonth, monthKey); 
    let d7  = getCurrentMonthStats(7, daysInMonth, monthKey);  

    document.getElementById('donut30').style.setProperty('--p', d30); document.getElementById('val30').innerText = Math.round(d30) + "%";
    document.getElementById('donut15').style.setProperty('--p', d15); document.getElementById('val15').innerText = Math.round(d15) + "%";
    document.getElementById('donut7').style.setProperty('--p', d7);   document.getElementById('val7').innerText = Math.round(d7) + "%";

    // 4. Update Main Graph
    myHabitChart.data.labels = Array.from({length: daysInMonth}, (_, i) => i + 1);
    myHabitChart.data.datasets[0].data = dailyCounts;
    myHabitChart.options.scales.y.max = Math.max(habits.length, 1);
    myHabitChart.update();
}

// Actions
document.getElementById("addHabitBtn").addEventListener("click", () => {
    let name = document.getElementById("habitInput").value.trim(), goal = parseInt(document.getElementById("goalInput").value);
    if (name && goal > 0) { habits.push({ id: Date.now(), name, goal, records: {} }); saveToLocal(); renderApp(); document.getElementById("habitInput").value = ""; document.getElementById("goalInput").value = ""; }
});

window.toggleMenu = function(index, event) {
    event.stopPropagation();
    
    // 1. Reset ALL rows and columns to normal layer
    document.querySelectorAll('#habitTable tr').forEach(tr => { tr.style.zIndex = "1"; tr.style.position = "static"; });
    document.querySelectorAll('.col-action').forEach(td => td.style.zIndex = "5");
    
    // 2. Close all other menus
    document.querySelectorAll('.dropdown-content').forEach(m => { 
        if(m.id !== `menu-${index}`) m.classList.remove('show'); 
    });
    
    // 3. Open clicked menu
    let menu = document.getElementById(`menu-${index}`);
    menu.classList.toggle("show");
    
    // 4. Boost the active row to the absolute front
    if(menu.classList.contains("show")) {
        let row = menu.closest('tr');
        row.style.position = "relative";
        row.style.zIndex = "999";
        menu.closest('.col-action').style.zIndex = "999";
    }
};

window.addEventListener("click", () => {
    // Reset menus and layers when clicking away
    document.querySelectorAll('.dropdown-content').forEach(m => m.classList.remove('show'));
    document.querySelectorAll('#habitTable tr').forEach(tr => { tr.style.zIndex = "1"; tr.style.position = "static"; });
    document.querySelectorAll('.col-action').forEach(td => td.style.zIndex = "5");
});



window.deleteHabit = function (i) { if (confirm("Delete habit?")) { habits.splice(i, 1); saveToLocal(); renderApp(); } };
window.editHabit = function (i) {
    let n = prompt("Name:", habits[i].name), g = prompt("Goal:", habits[i].goal);
    if (n && g > 0) { habits[i].name = n.trim(); habits[i].goal = parseInt(g); saveToLocal(); renderApp(); }
};



setInterval(() => {
    let now = new Date();
    document.getElementById('currentDate').innerText = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    document.getElementById('currentTime').innerText = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}, 1000);

initData();
renderApp();
