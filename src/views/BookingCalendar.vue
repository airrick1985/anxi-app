<template>
  <div class="calendar-container">
    <h1>驗屋預約系統 (測試)</h1>
    <FullCalendar :options="calendarOptions" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

// --- 請將此處的網址換成您自己部署的 GAS 網路應用程式網址 ---
const GAS_URL = 'https://script.google.com/macros/s/AKfycbyyLduEI4eZT5NsQGUVCQFMML_aKFMChk43bcr50Z814NYOTzOKxdmrARpC19DrWBml/exec';
// -------------------------------------------------------------

// 名額限制
const SLOT_LIMIT = 2; // 假設每個時段最多2個名額

const calendarOptions = ref({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay'
  },
  events: [],
  editable: true,
  droppable: true,
  locale: 'zh-tw',
  buttonText: {
    today: '今天',
    month: '月',
    week: '週',
    day: '日',
  },
  eventContent: handleEventContent,
  eventDrop: handleEventDrop,
  eventAllow: handleEventAllow,
  eventDidMount: handleEventDidMount, // ✅ 新增：在事件掛載後執行
});

let eventCounts = {};

function formatDate(date) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    return [year, month, day].join('-');
}


async function fetchAndProcessEvents() {
    try {
        const response = await fetch(GAS_URL);
        const data = await response.json();

        eventCounts = {};
        data.forEach(event => {
            const dateStr = event['預約日期'] ? formatDate(new Date(event['預約日期'])) : null;
            const timeSlot = event['預約時段'];
            if (dateStr && timeSlot) {
                const key = `${dateStr}_${timeSlot}`;
                eventCounts[key] = (eventCounts[key] || 0) + 1;
            }
        });

        const events = data.map(event => {
            const date = event['預約日期'] ? new Date(event['預約日期']) : null;
            const timeSlot = event['預約時段'];

            if (!date || !timeSlot) return null;

            const dateStr = formatDate(date);
            const [startTimeStr, endTimeStr] = timeSlot.split(' - ').map(s => s.replace('：', ':'));
            
            if (!startTimeStr || !endTimeStr) return null;

            const startDateTime = new Date(`${dateStr}T${startTimeStr}:00`);
            const endDateTime = new Date(`${dateStr}T${endTimeStr}:00`);

            const key = `${dateStr}_${timeSlot}`;
            const isFull = (eventCounts[key] || 0) >= SLOT_LIMIT;

            return {
                id: event.id,
                title: `${event['戶別']} - ${event['姓名']}`,
                start: startDateTime,
                end: endDateTime,
                extendedProps: {
                    ...event,
                    isFull: isFull,
                },
                backgroundColor: isFull ? 'red' : '#3788d8',
                borderColor: isFull ? 'darkred' : '#3788d8',
            };
        }).filter(Boolean);

        calendarOptions.value.events = events;

    } catch (error) {
        console.error('獲取資料失敗:', error);
        alert('無法從 Google Sheet 獲取資料，請檢查 GAS 網址是否正確並已授權。');
    }
}

async function handleEventDrop(dropInfo) {
  const event = dropInfo.event;
  const newStart = event.start;

  const newDate = formatDate(newStart);
  const newStartTime = newStart.toTimeString().substring(0, 5);

  const newEnd = new Date(newStart.getTime() + 60 * 60 * 1000);
  const newEndTime = newEnd.toTimeString().substring(0, 5);

  try {
    const response = await fetch(GAS_URL, {
        method: 'POST',
        body: JSON.stringify({
            id: event.id,
            newDate: newDate,
            newStartTime: newStartTime,
            newEndTime: newEndTime,
        }),
        headers: { 'Content-Type': 'application/json' },
    });

    const result = await response.json();
    if (result.status === 'success') {
        alert('更新成功！');
        fetchAndProcessEvents();
    } else {
        alert(`更新失敗: ${result.message}`);
        dropInfo.revert();
    }
  } catch (error) {
    console.error('更新請求失敗:', error);
    alert('更新請求失敗');
    dropInfo.revert();
  }
}

function handleEventAllow(dropInfo, draggedEvent) {
  const newStart = dropInfo.start;
  const newDate = formatDate(newStart);
  const newStartTime = newStart.toTimeString().substring(0, 5);
  const newEndTime = new Date(newStart.getTime() + 60 * 60 * 1000).toTimeString().substring(0, 5);
  const newTimeSlot = `${newStartTime} - ${newEndTime}`;

  const key = `${newDate}_${newTimeSlot}`;
  
  const currentCount = eventCounts[key] || 0;

  if (currentCount >= SLOT_LIMIT) {
      alert('該時段名額已滿，無法預約！');
      return false;
  }
  return true;
}

// ✅ 修正：使用 HTML 字串，不使用 JSX
function handleEventContent(arg) {
  const title = arg.event.title;
  const timeText = arg.timeText;
  const eventId = arg.event.id;

  const html = `
    <div class="event-content">
      <b>${timeText}</b>
      <i> ${title}</i>
      <div class="event-custom-fields">
         <label for="check-${eventId}">
             <input type="checkbox" id="check-${eventId}" /> 報到
         </label>
         <select id="select-${eventId}">
             <option>10:00 - 11:00</option>
             <option>14:00 - 15:00</option>
         </select>
      </div>
    </div>
  `;
  return { html: html };
}

// ✅ 新增：為動態產生的 HTML 元素加上事件監聽
function handleEventDidMount(arg) {
    const eventId = arg.event.id;
    const checkbox = document.getElementById(`check-${eventId}`);
    if (checkbox) {
        checkbox.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log(`${arg.event.extendedProps['姓名']} 的報到狀態被勾選了! Checked: ${e.target.checked}`);
            // 在這裡可以加入更新到 Sheet 的邏輯
        });
    }

    const select = document.getElementById(`select-${eventId}`);
    if (select) {
        // 防止點擊 select 時觸發日曆的 eventClick
        select.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        // 監聽 select 的變動
        select.addEventListener('change', (e) => {
             console.log(`時段被更改為: ${e.target.value}`);
             // 在這裡可以加入更新時段到 Sheet 的邏輯
        });
    }
}


onMounted(() => {
    fetchAndProcessEvents();
    setInterval(fetchAndProcessEvents, 30000);
});
</script>

<style>
.calendar-container {
  max-width: 1100px;
  margin: 20px auto;
  padding: 20px;
  font-family: Arial, Helvetica, sans-serif;
}
.event-content {
  padding: 2px;
  white-space: normal;
  font-size: 12px;
}
.event-custom-fields {
  margin-top: 5px;
  display: flex;
  align-items: center;
  gap: 10px;
}
label {
  cursor: pointer;
  display: flex;
  align-items: center;
}
</style>
