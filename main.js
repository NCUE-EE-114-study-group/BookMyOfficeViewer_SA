const calendarBody = document.querySelector(".calendar");
const currentDate = document.querySelector(".current-date input");
const prevButton = document.getElementById("prev");
const nextButton = document.getElementById("next");
const loading = document.getElementById("loading");
const monthlyReservations = document.getElementById("monthlyReservations");
const pastReservations = document.getElementById("pastReservations");
const pastListContainer = document.getElementById("pastListContainer");

let currYear = new Date().getFullYear();
let currMonth = new Date().getMonth();

let reservations = {};

// const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheet_id}/values/${tab_name}?key=${api_key}`;
const url = "test.json";  // 替換為 Google Sheets API URL


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

document.addEventListener('keydown', function(event) {
    if (event.key === "Escape") {
        modal.style.display = "none";
    }
});

currentDate.addEventListener('change', function() {
    const [year, month] = this.value.split('-');
    currYear = parseInt(year);
    currMonth = parseInt(month) - 1;
    generateCalendar(currYear, currMonth);
});

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
        generateCalendar(currYear, currMonth);
        loading.style.display = "none";
    });
}

function generateCalendar(year, month) {
    calendarBody.innerHTML = `
        <div class="day-name">日</div>
        <div class="day-name">一</div>
        <div class="day-name">二</div>
        <div class="day-name">三</div>
        <div class="day-name">四</div>
        <div class="day-name">五</div>
        <div class="day-name">六</div>
    `;
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const lastDateOfMonth = new Date(year, month + 1, 0).getDate();
    const lastDayOfMonth = new Date(year, month, lastDateOfMonth).getDay();
    const lastDateOfLastMonth = new Date(year, month, 0).getDate();

    let daysHTML = "";

    for (let i = firstDayOfMonth; i > 0; i--) {
        daysHTML += `<div class="day inactive">${lastDateOfLastMonth - i + 1}</div>`;
    }

    const monthlyReservationList = [];
    const pastReservationList = [];
    const today = new Date().toDateString();

    for (let i = 1; i <= lastDateOfMonth; i++) {
        const currentDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        let isToday = new Date(currentDateStr).toDateString() === today ? "today" : "";
        let dayClass = isToday;
        if (reservations[currentDateStr]) {
            dayClass = isToday ? "today-task" : "occupied";
            if (new Date(currentDateStr) < new Date(today)) {
                pastReservationList.push(...reservations[currentDateStr].map(reservation => ({ ...reservation, className: 'past' })));
            } else if (new Date(currentDateStr).toDateString() === today) {
                monthlyReservationList.push(...reservations[currentDateStr].map(reservation => ({ ...reservation, className: 'ongoing' })));
            } else {
                const diffDays = Math.ceil((new Date(currentDateStr) - new Date(today)) / (1000 * 60 * 60 * 24));
                let className = 'future';
                if (diffDays <= 3) {
                    className = 'urgent';
                } else if (diffDays <= 7) {
                    className = 'upcoming';
                }
                monthlyReservationList.push(...reservations[currentDateStr].map(reservation => ({ ...reservation, className })));
            }
        }
        daysHTML += `<div class="day ${dayClass}" data-date="${currentDateStr}">${i}</div>`;
    }

    for (let i = lastDayOfMonth; i < 6; i++) {
        daysHTML += `<div class="day inactive">${i - lastDayOfMonth + 1}</div>`;
    }

    currentDate.value = `${year}-${String(month + 1).padStart(2, '0')}`;
    calendarBody.innerHTML += daysHTML;

    document.querySelectorAll(".day").forEach(day => {
        if (day.dataset.date && reservations[day.dataset.date]) {
            day.onclick = () => showModal(day.dataset.date);
        }
    });

    // 更新月度借用列表
    monthlyReservations.innerHTML = '';
    if (monthlyReservationList.length === 0) {
        const noItems = document.createElement("li");
        noItems.textContent = "目前沒有安排的事項";
        monthlyReservations.appendChild(noItems);
    } else {
        monthlyReservationList.sort((a, b) => new Date(a.date) - new Date(b.date));
        monthlyReservationList.forEach(reservation => {
            const listItem = document.createElement("li");
            listItem.textContent = `${reservation.date}: ${reservation.reason}`;
            listItem.classList.add('list-item', reservation.className);
            listItem.onclick = () => showModal(reservation.date);
            monthlyReservations.appendChild(listItem);
        });
    }

    // 更新過去的活動列表
    pastReservations.innerHTML = '';
    pastReservationList.sort((a, b) => new Date(b.date) - new Date(a.date));
    if (pastReservationList.length === 0) {
        pastListContainer.style.display = 'none';
    } else {
        pastReservationList.forEach(reservation => {
            const listItem = document.createElement("li");
            listItem.textContent = `${reservation.date}: ${reservation.reason}`;
            listItem.classList.add('list-item', reservation.className);
            listItem.onclick = () => showModal(reservation.date);
            pastReservations.appendChild(listItem);
        });
        pastListContainer.style.display = 'block';
    }
}

function showModal(date) {
    reservationList.innerHTML = '';
    reservations[date].forEach(reservation => {
        const item = document.createElement("div");
        item.classList.add("reservation-item");
        item.innerHTML = `
            <h3>${reservation.name}</h3>
            <div class="reservation-details">
                <div>
                    <span>事由:</span> ${reservation.reason}
                </div>
                <div>
                    <span>辦公室:</span> ${reservation.office}
                </div>
                <div>
                    <span>日期:</span> ${reservation.date}
                </div>
                <div>
                    <span>時間:</span> ${reservation.startTime} - ${reservation.endTime}
                </div>
            </div>
        `;
        reservationList.appendChild(item);
    });
    if (reservationList.innerHTML === '') {
        reservationList.innerHTML = '目前沒有安排的事項';
    }
    modal.style.display = "block";
}

function prevMonth() {
    currMonth--;
    if (currMonth < 0) {
        currYear--;
        currMonth = 11;
    }
    generateCalendar(currYear, currMonth);
}

function nextMonth() {
    currMonth++;
    if (currMonth > 11) {
        currYear++;
        currMonth = 0;
    }
    generateCalendar(currYear, currMonth);
}

prevButton.addEventListener("click", prevMonth);
nextButton.addEventListener("click", nextMonth);

fetchReservations();

document.addEventListener('DOMContentLoaded', () => {
    const setThemeFromSystem = () => {
        const theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        document.body.setAttribute('data-theme', theme);
    };

    setThemeFromSystem();

    window.matchMedia('(prefers-color-scheme: dark)').addListener(setThemeFromSystem);
});