const calendarBody = document.querySelector("#calendar tbody");
const monthYear = document.getElementById("monthYear");
const monthPicker = document.getElementById("monthPicker");
const loading = document.getElementById("loading");

let currentDate = new Date();
let reservations = {};

const spreadsheet_id = "";
const tab_name = "";
const api_key = "";
// const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheet_id}/values/${tab_name}?key=${api_key}`;
const url = "test.json";

const modal = document.getElementById("myModal");
const span = document.getElementsByClassName("close")[0];
const reservationList = document.getElementById("reservationList");

span.onclick = function() {
    modal.style.display = "none";
}

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

function parseDate(dateString) {
    const parts = dateString.split('/');
    const year = parts[0];
    const month = parts[1].padStart(2, '0');
    const day = parts[2].padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function fetchReservations() {
    loading.style.display = "block";
    $.getJSON(url, function(data) {
        const rows = data.values;
        for (let i = 2; i < rows.length; i++) {
            const row = rows[i];
            if (row[2] === "通過") {
                const date = parseDate(row[10]);
                if (!reservations[date]) {
                    reservations[date] = [];
                }
                reservations[date].push({
                    name: row[6],
                    reason: row[8],
                    office: row[9],
                    date: date,
                    startTime: row[11],
                    endTime: row[12]
                });
            }
        }
        generateCalendar(currentDate);
        loading.style.display = "none";
    });
}

function generateCalendar(date) {
    calendarBody.innerHTML = '';
    const month = date.getMonth();
    const year = date.getFullYear();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    monthYear.textContent = `${year}年 ${month + 1}月`;

    let dateNumber = 1;
    for (let i = 0; i < 6; i++) {
        const row = document.createElement("tr");
        for (let j = 0; j < 7; j++) {
            const cell = document.createElement("td");
            if (i === 0 && j < firstDay) {
                cell.innerHTML = '';
            } else if (dateNumber > daysInMonth) {
                cell.innerHTML = '';
            } else {
                const currentDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dateNumber).padStart(2, '0')}`;
                cell.textContent = dateNumber;
                if (reservations[currentDateStr]) {
                    cell.classList.add('occupied');
                    cell.onclick = () => showModal(currentDateStr);
                }
                dateNumber++;
            }
            row.appendChild(cell);
        }
        calendarBody.appendChild(row);
    }
}

function showModal(date) {
    reservationList.innerHTML = '';
    reservations[date].forEach(reservation => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${reservation.name}</td>
            <td>${reservation.reason}</td>
            <td>${reservation.office}</td>
            <td>${reservation.date}</td>
            <td>${reservation.startTime}</td>
            <td>${reservation.endTime}</td>
        `;
        reservationList.appendChild(row);
    });
    modal.style.display = "block";
}

function prevMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    generateCalendar(currentDate);
    updateMonthPicker();
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    generateCalendar(currentDate);
    updateMonthPicker();
}

function prevYear() {
    currentDate.setFullYear(currentDate.getFullYear() - 1);
    generateCalendar(currentDate);
    updateMonthPicker();
}

function nextYear() {
    currentDate.setFullYear(currentDate.getFullYear() + 1);
    generateCalendar(currentDate);
    updateMonthPicker();
}

function updateMonthPicker() {
    monthPicker.value = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
}

function toggleTheme() {
    const body = document.body;
    body.setAttribute('data-theme', body.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
}

monthPicker.onchange = function() {
    const [year, month] = monthPicker.value.split('-');
    currentDate.setFullYear(year);
    currentDate.setMonth(month - 1);
    generateCalendar(currentDate);
};

fetchReservations();
updateMonthPicker();
