// 1. Load data from localStorage or use defaults if empty
let habits = JSON.parse(localStorage.getItem('habitData')) || [
    { name: "Exercise", goal: 10, history: new Array(31).fill(false) },
    { name: "Read Book", goal: 15, history: new Array(31).fill(false) }
];

const tableBody = document.getElementById("habitTable");
const addBtn = document.getElementById("addHabitBtn");

// 2. Initialize Chart
const ctx = document.getElementById('habitChart').getContext('2d');
let myHabitChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: Array.from({length:31},(_,i)=>i+1),
        datasets: [{
            data: new Array(31).fill(0),
            borderColor:'#00d09c',
            backgroundColor: 'rgba(0, 208, 156, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 3
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            x: { display: false },
            y: { beginAtZero: true, ticks: { color: "#888", stepSize: 1 }, grid: { color: "rgba(255,255,255,0.05)" } }
        }
    }
});

// 3. Save Function
function saveToLocal() {
    localStorage.setItem('habitData', JSON.stringify(habits));
}

// 4. Render Table
function renderTable() {
    tableBody.innerHTML = "";
    habits.forEach((habit, index) => {
        let row = document.createElement("tr");
        let dayCells = "";
        
        // Use the 'history' array to set the 'checked' state
        for(let i=0; i<31; i++) {
            const isChecked = habit.history[i] ? "checked" : "";
            dayCells += `<td class="col-day"><input type="checkbox" data-habit="${index}" data-day="${i}" ${isChecked}></td>`;
        }
        
        row.innerHTML = `
            <td class="col-action">
                <button class="menu-btn" onclick="toggleMenu(${index})">⋮</button>
                <div id="menu-${index}" class="dropdown-content">
                    <button onclick="editHabit(${index})">Edit</button>
                    <button class="delete-btn" onclick="deleteHabit(${index})">Delete</button>
                </div>
            </td>
            <td class="col-habit">${habit.name}</td>
            <td class="col-goal">${habit.goal}</td>
            ${dayCells}
            <td class="col-progress">
                <div class="progressBar"><div class="progress"></div></div>
            </td>
        `;
        tableBody.appendChild(row);
    });

    // Listen for checkbox changes to update the array and save
    document.querySelectorAll("input[type='checkbox']").forEach(box => {
        box.addEventListener("change", (e) => {
            const hIdx = e.target.getAttribute('data-habit');
            const dIdx = e.target.getAttribute('data-day');
            habits[hIdx].history[dIdx] = e.target.checked; // Update the data structure
            saveToLocal(); // Save to browser memory
            updateAll();   // Refresh graph and progress bars
        });
    });
    
    myHabitChart.options.scales.y.max = habits.length;
    updateAll();
}

// 5. Logic for Edit/Delete/Add (Modified to save)
window.toggleMenu = function(index) {
    document.querySelectorAll('.dropdown-content').forEach(menu => {
        if(menu.id !== `menu-${index}`) menu.classList.remove('show');
    });
    document.getElementById(`menu-${index}`).classList.toggle("show");
}

window.deleteHabit = function(index) {
    if(confirm("Delete this habit?")) {
        habits.splice(index, 1);
        saveToLocal();
        renderTable();
    }
}

window.editHabit = function(index) {
    const newName = prompt("Edit Habit Name:", habits[index].name);
    const newGoal = prompt("Edit Goal (Days):", habits[index].goal);
    if(newName && newGoal) {
        habits[index].name = newName;
        habits[index].goal = parseInt(newGoal);
        saveToLocal();
        renderTable();
    }
}

addBtn.addEventListener("click", () => {
    const name = document.getElementById("habitInput").value;
    const goal = parseInt(document.getElementById("goalInput").value);
    if (name && goal) {
        habits.push({ name, goal, history: new Array(31).fill(false) });
        saveToLocal();
        renderTable();
        document.getElementById("habitInput").value = "";
        document.getElementById("goalInput").value = "";
    }
});

// 6. Refresh Visuals
function updateAll() {
    let dailyCounts = new Array(31).fill(0);
    const rows = document.querySelectorAll("#habitTable tr");

    habits.forEach((habit, habitIndex) => {
        const row = rows[habitIndex];
        if(!row) return;
        
        const progressLine = row.querySelector(".progress");
        let checkedCount = 0;

        habit.history.forEach((checked, dayIndex) => {
            if (checked) {
                checkedCount++;
                dailyCounts[dayIndex]++;
            }
        });

        let percent = Math.min((checkedCount / habit.goal) * 100, 100);
        progressLine.style.width = percent + "%";
    });

    myHabitChart.data.datasets[0].data = dailyCounts;
    myHabitChart.update();
}

renderTable();