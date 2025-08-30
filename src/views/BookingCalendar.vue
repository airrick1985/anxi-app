<template>
  <div class="calendar-container">
    <h1>驗屋預約系統 (測試)</h1>
    <FullCalendar :options="calendarOptions" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useRoute } from 'vue-router';
import { listenToHouseholdsForCalendar, updateHouseholdInspectionDate } from '@/api';




// --- 元件狀態 ---
const route = useRoute();
const projectId = ref(route.params.projectId);
const SLOT_LIMIT = 2; // 假設每個時段最多2個名額
let unsubscribeFromHouseholds = null;


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
  locale: 'zh-tw',
  buttonText: { today: '今天', month: '月', week: '週', day: '日' },
  eventDrop: handleEventDrop,
  eventContent: handleEventContent,
  eventAllow: handleEventAllow,
  eventDidMount: handleEventDidMount, 
  });

// ✓ Firebase Timestamp 轉為 JS Date 物件
function toDate(timestamp) {
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  return null;
}

// ✓ 處理從 Firestore 來的戶別資料，轉換成日曆事件
function processHouseholdData(households) {
  const events = [];
  households.forEach(h => {
    const time = h.statusTimeSlot || '09：30'; // 如果沒有時間，給個預設值
    const [hour, minute] = time.replace('：', ':').split(':');

    // 處理初驗事件
    const initialDate = toDate(h.initialInspectionDate);
    if (initialDate) {
      initialDate.setHours(parseInt(hour, 10), parseInt(minute, 10), 0);
      events.push({
        id: `${h.id}_initial`, // ✓ 組合唯一 ID
        title: `(初) ${h.unitId} - ${h.buyerName}`,
        start: initialDate,
        end: new Date(initialDate.getTime() + 60 * 60 * 1000), // ✓ 預設1小時
        backgroundColor: '#3788d8',
        borderColor: '#3788d8',
        extendedProps: { docId: h.id, type: 'initial', ...h },
      });
    }

    // 處理複驗事件
    const reDate = toDate(h.reInspectionDate);
    if (reDate) {
      reDate.setHours(parseInt(hour, 10), parseInt(minute, 10), 0);
      events.push({
        id: `${h.id}_re`, // ✓ 組合唯一 ID
        title: `(複) ${h.unitId} - ${h.buyerName}`,
        start: reDate,
        end: new Date(reDate.getTime() + 60 * 60 * 1000), // ✓ 預設1小時
        backgroundColor: '#4caf50',
        borderColor: '#4caf50',
        extendedProps: { docId: h.id, type: 're', ...h },
      });
    }
  });
  calendarOptions.value.events = events;
}

let eventCounts = {};


// ✓ 建立一個統一的資料處理函式
function processBookingData(data) {
    eventCounts = {};
    data.forEach(event => {
        // ✓ 欄位名稱請根據您 Firestore 中的實際名稱調整
        const dateStr = event.bookingDate ? formatDate(new Date(event.bookingDate)) : null;
        const timeSlot = event.bookingTimeSlot;
        if (dateStr && timeSlot) {
            const key = `${dateStr}_${timeSlot}`;
            eventCounts[key] = (eventCounts[key] || 0) + 1;
        }
    });

    const events = data.map(event => {
        const date = event.bookingDate ? new Date(event.bookingDate) : null;
        const timeSlot = event.bookingTimeSlot;

        if (!date || !timeSlot) return null;

        const dateStr = formatDate(date);
        const [startTimeStr, endTimeStr] = timeSlot.split(' - ').map(s => s.replace('：', ':'));
        
        if (!startTimeStr || !endTimeStr) return null;

        const startDateTime = new Date(`${dateStr}T${startTimeStr}:00`);
        const endDateTime = new Date(`${dateStr}T${endTimeStr}:00`);

        const key = `${dateStr}_${timeSlot}`;
        const isFull = (eventCounts[key] || 0) >= SLOT_LIMIT;

        return {
            id: event.id, // Firestore 文件 ID
            title: `${event.unitId} - ${event.customerName}`, // ✓ 欄位名稱請根據您 Firestore 中的實際名稱調整
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
}



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



// ✓ 當事件被拖曳時，更新 Firestore
async function handleEventDrop(dropInfo) {
  const event = dropInfo.event;
  const newStartDate = event.start;
  const { docId, type } = event.extendedProps;

  if (!docId || !type) {
    console.error("事件缺少必要資訊(docId, type)，無法更新");
    dropInfo.revert();
    return;
  }

  try {
    await updateHouseholdInspectionDate(docId, type, newStartDate);
    alert('更新成功！');
    // 資料會透過 onSnapshot 自動刷新，無需手動處理
  } catch (error) {
    console.error('更新戶別日期失敗:', error);
    alert(`更新失敗: ${error.message}`);
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


// --- 生命週期鉤子 ---
onMounted(() => {
  if (projectId.value) {
    unsubscribeFromHouseholds = listenToHouseholdsForCalendar(
      projectId.value,
      (households) => {
        console.log("接收到戶別即時資料:", households);
        processHouseholdData(households);
      },
      (error) => {
        alert('無法監聽預約資料，請檢查主控台錯誤。');
      }
    );
  } else {
    alert('錯誤：未提供專案 ID，無法載入預約資料。');
  }
});

nUnmounted(() => {
  if (unsubscribeFromHouseholds) {
    unsubscribeFromHouseholds();
  }
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
