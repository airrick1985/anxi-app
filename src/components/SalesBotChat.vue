<template>
  <v-card class="d-flex flex-column" height="100%" variant="flat">
    <!-- Header with Token Usage and Clear History -->
    <v-card-title class="d-flex justify-space-between align-center bg-grey-lighten-4 py-2">
      <div class="d-flex align-center">
   
      </div>
      <div class="d-flex align-center">
        <v-btn 
          icon="mdi-delete-sweep-outline" 
          variant="text" 
          size="small" 
          color="grey-darken-1"
          class="mr-2"
          @click="clearHistory"
          title="清除歷史紀錄"
          :disabled="messages.length === 0 || isLoading"
        ></v-btn>
        <div class="text-caption" :class="tokenRemainingClass">
          Token: {{ tokenUsed }} / {{ tokenQuota > 0 ? tokenQuota : '∞' }}
        </div>
      </div>
    </v-card-title>

    <v-divider></v-divider>

    <!-- Chat Messages Area -->
    <v-card-text class="flex-grow-1 overflow-y-auto pa-4" ref="chatContainer" style="background-color: #f9f9f9;">
      <div v-if="messages.length === 0" class="d-flex flex-column align-center justify-center h-100 text-grey">
        <v-icon size="64" color="grey-lighten-2" class="mb-4">mdi-forum-outline</v-icon>
        <p>您好！我是 AI 銷控特助，請問需要什麼協助？</p>
      </div>

      <div v-for="(msg, index) in messages" :key="index" class="mb-4 d-flex" :class="msg.role === 'user' ? 'justify-end' : 'justify-start'">
        <!-- Avatar for AI -->
        <v-avatar v-if="msg.role === 'model'" color="primary" size="32" class="mr-2 mt-1">
          <v-icon color="white" size="18">mdi-robot-outline</v-icon>
        </v-avatar>

        <!-- Message Bubble -->
        <div 
          class="pa-3 rounded-lg text-body-1" 
          :class="msg.role === 'user' ? 'bg-primary text-white' : 'bg-white text-grey-darken-3 elevation-1'"
          style="max-width: 80%; word-break: break-word; white-space: pre-wrap;"
        >
          <span v-html="formatMessage(msg.parts[0].text)"></span>
        </div>

        <!-- Avatar for User -->
        <v-avatar v-if="msg.role === 'user'" color="grey-lighten-2" size="32" class="ml-2 mt-1">
          <v-icon color="grey-darken-2" size="18">mdi-account</v-icon>
        </v-avatar>
      </div>
      
      <!-- Loading Indicator -->
      <div v-if="isLoading" class="d-flex justify-start mb-4">
        <v-avatar color="primary" size="32" class="mr-2 mt-1">
          <v-icon color="white" size="18">mdi-robot-outline</v-icon>
        </v-avatar>
        <div class="pa-3 rounded-lg bg-white elevation-1 d-flex align-center">
          <v-progress-circular indeterminate color="primary" size="20" width="2"></v-progress-circular>
          <span class="ml-2 text-caption text-grey">{{ loadingText }}</span>
        </div>
      </div>
      <!-- Sentinel: 捲動定位錨點 -->
      <div ref="messagesEnd" style="height: 1px;"></div>
    </v-card-text>


    <!-- Input Area -->
    <div class="pa-3 bg-white d-flex align-end">
      <!-- Voice Input Button -->
      <v-btn
        icon
        variant="tonal"
        :color="isListening ? 'red' : 'primary'"
        class="mr-2 mb-1"
        @click="toggleVoiceInput"
        :disabled="isLoading || isTokenExhausted"
      >
        <v-icon>{{ isListening ? 'mdi-microphone-off' : 'mdi-microphone' }}</v-icon>
      </v-btn>

      <v-textarea
        v-model="inputText"
        placeholder="請輸入問題 (Shift + Enter 換行)"
        variant="outlined"
        density="compact"
        hide-details
        auto-grow
        rows="1"
        max-rows="4"
        class="mr-2"
        @keydown="handleKeydown"
        :disabled="isLoading || isTokenExhausted"
      ></v-textarea>
      
      <v-btn
        color="primary"
        icon="mdi-send"
        variant="flat"
        class="mb-1"
        @click="sendMessage"
        :loading="isLoading"
        :disabled="!inputText.trim() || isTokenExhausted"
      ></v-btn>
    </div>
  </v-card>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { askSalesBotAPI, fetchProjectConfig } from '@/api';
import { useToast } from 'vue-toastification';
import { useProjectStore } from '@/store/projectStore';
import { useUserStore } from '@/store/user';
import { db } from '@/firebase';
import { doc, getDoc, setDoc, deleteDoc, updateDoc, increment } from 'firebase/firestore';

const props = defineProps({
  projectId: { type: String, required: true },
  unitData: { type: Object, default: () => ({}) },
  allParkingData: { type: Array, default: () => [] },
  allUnitsData: { type: Array, default: () => [] }
});

const toast = useToast();
const projectStore = useProjectStore();
const userStore = useUserStore();
const chatContainer = ref(null);
const messagesEnd = ref(null);

// State
const messages = ref([]);
const inputText = ref('');
const isLoading = ref(false);
const loadingText = ref('正在思考...');

const tokenUsed = ref(0);
const tokenQuota = ref(0);

// Load Project Data & Chat History
const loadProjectData = async () => {
    if (props.projectId) {
        try {
            const config = await fetchProjectConfig(props.projectId);
            if (config) {
                tokenUsed.value = config.aiTokenUsed || 0;
                tokenQuota.value = config.aiTokenQuota || 0;
            }
        } catch (error) {
            console.error('Failed to load project config:', error);
        }
    }
};

const getHistoryDocRef = () => {
  if (!userStore.user?.key || !props.projectId) return null;
  return doc(db, 'users', userStore.user.key, 'aiChatHistory', props.projectId);
};

const loadChatHistory = async () => {
  const docRef = getHistoryDocRef();
  if (!docRef) return;
  
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.messages && Array.isArray(data.messages)) {
        messages.value = data.messages;
        scrollToBottomDeferred(); // 等待 dialog 動畫完成後再捲到底
      }
    }
  } catch (error) {
    console.error('Failed to load chat history:', error);
  }
};

const saveChatHistory = async () => {
  const docRef = getHistoryDocRef();
  if (!docRef) return;
  
  try {
    await setDoc(docRef, { messages: messages.value }, { merge: true });
  } catch (error) {
    console.error('Failed to save chat history:', error);
  }
};

const clearHistory = async () => {
  if (confirm('確定要清除此建案的所有對話紀錄嗎？')) {
    messages.value = [];
    const docRef = getHistoryDocRef();
    if (docRef) {
      try {
        await deleteDoc(docRef);
        toast.success('對話紀錄已清除');
      } catch (error) {
        console.error('Failed to clear chat history from Firestore:', error);
        toast.error('清除紀錄失敗');
      }
    }
  }
};

watch(() => props.projectId, () => {
    loadProjectData();
});




// Context string representation logic
const getContextData = () => {
    // 車位資料：包含買方資訊與銷售資訊，讓 AI 可檢索
    const simplifiedParking = props.allParkingData.map(p => ({
        車位編號: p.spotId || p['車位編號'],
        狀態: p.status_backend || null,
        車位底價_萬: p.price_floor || p['車位底價'] || p['底價'] || null,
        車位表價_萬: p.price_list || p['車位表價'] || p['表價'] || null,
        車位成交價_萬: p.price_transaction || p['車位成交價'] || null,
        車位尺寸: p.size || p['車位尺寸'] || p['坪數'] || '標準',
        買方姓名: p.buyerName || null,
        對應戶別: p.buyerUnitId || null,
        銷售人員: p.salesperson || null,
        備註: p.remarks || null,
    }));

    // 戶別資料：包含完整的買方、價格、付款與持有車位資訊
    const simplifiedUnits = props.allUnitsData.map(u => ({
        戶別: u.unitId,
        棟別: u.building,
        樓層: u.floor,
        格局: u.layout || u.propertyType || '-',
        物件類型: u.propertyType || '-',
        主建坪數: u.area_main_ping,
        房屋總面積_坪: u.area_house_ping,
        露臺坪數: u.area_terrace_ping > 0 ? u.area_terrace_ping : 0,
        公設比: u.common_area_ratio || null,
        // 價格
        銷售狀態: u.salesStatus_backend,
        房屋總表價_萬: u.price_list_house_total,
        房屋總底價_萬: u.price_floor_house_total,
        房屋成交價_萬: u.price_transaction_house || null,
        成交總價含車_萬: u.price_transaction_total || null,
        表價單價_萬: u.unit_price_list,
        底價單價_萬: u.unit_price_floor,
        // 買方資訊
        買方姓名: u.buyerName || null,
        買方電話: u.buyerPhone || null,
        銷售人員: u.salesperson || null,
        // 付款進度
        小訂日期: u.payment_deposit_date || null,
        小訂金額: u.payment_deposit_amount || null,
        補足日期: u.payment_supplement_date || null,
        補足金額: u.payment_supplement_amount || null,
        簽約日期: u.payment_contract_date || null,
        簽約金額: u.payment_contract_amount || null,
        // 持有車位
        持有車位: u['持有車位'] || [],
        備註: u.remarks || null,
    }));

    // 移除 null、空字串、空陣列的欄位，大幅精簡 JSON（Token 節省 60%+）
    const stripEmpty = (obj) => {
        const clean = {};
        for (const [key, value] of Object.entries(obj)) {
            if (value === null || value === undefined || value === '' || value === '-') continue;
            if (Array.isArray(value) && value.length === 0) continue;
            clean[key] = value;
        }
        return clean;
    };

    const cleanUnits = simplifiedUnits.map(stripEmpty);
    const cleanParking = simplifiedParking.map(stripEmpty);

    console.log('[DEBUG getContextData] Units count:', cleanUnits.length, 'Parkings count:', cleanParking.length);
    if (cleanUnits.length > 0) {
        console.log('[DEBUG getContextData] First unit:', JSON.stringify(cleanUnits[0]));
    }

    return {
        currentUnitInfo: props.unitData,
        allProjectUnits: cleanUnits,
        allProjectParkingLots: cleanParking,
    };
};


const sendPrompt = (text) => {
  inputText.value = text;
  sendMessage();
};

const handleKeydown = (e) => {
  // 如果按下 Enter 且沒有按住 Shift，則送出訊息
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault(); // 防止預設換行
    sendMessage();
  }
  // 如果按下 Shift + Enter，則保留預設行為 (換行)
};

const sendMessage = async () => {
  if (!inputText.value.trim() || isLoading.value || isTokenExhausted.value) return;

  const userText = inputText.value.trim();
  inputText.value = '';
  
  // Add user message to history
  messages.value.push({ role: 'user', parts: [{ text: userText }] });
  await saveChatHistory(); // Save user message immediately
  scrollToBottom();

  isLoading.value = true;
  loadingText.value = '正在思考...';

  const payload = {
    projectId: props.projectId,
    prompt: userText,
    contextData: getContextData(),
    history: messages.value.slice(0, -1) // All messages except the new user one
  };

  let retryCount = 0;
  const maxRetries = 3;
  const retryDelay = 2000; // 2 seconds

  while (retryCount <= maxRetries) {
    try {
      if (retryCount > 0) {
        loadingText.value = `伺服器繁忙，正在進行第 ${retryCount} 次重試...`;
      }

      const result = await askSalesBotAPI(payload);

      if (result.status === 'success') {
        messages.value.push({ role: 'model', parts: [{ text: result.reply }] });
        if (result.usage && result.usage.totalTokenCount) {
            const tokensThisRound = result.usage.totalTokenCount;
            tokenUsed.value += tokensThisRound;
            // 同步寫入 Firestore，確保下次開啟時顯示正確數字
            // projects collection 對應 _handleGetProjectConfig 所讀取的路徑
            try {
              const configRef = doc(db, 'projects', props.projectId);
              await updateDoc(configRef, { aiTokenUsed: increment(tokensThisRound) });
            } catch (dbErr) {
              console.warn('[SalesBotChat] 更新 aiTokenUsed 失敗:', dbErr);
            }
        }
        await saveChatHistory(); // Save AI reply
        break; // Success, exit retry loop
      } else {
        throw new Error('AI 助理回應失敗');
      }
    } catch (error) {
      console.error(`AI Request Error (Attempt ${retryCount + 1}):`, error);
      
      const isOverloaded = error.message && (error.message.includes('503') || error.message.includes('High demand'));
      
      if (isOverloaded && retryCount < maxRetries) {
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue; // Try again
      } else {
        // Not a 503 error, or max retries reached
        let errorMessage = '抱歉，系統目前無法回應您的請求，請稍後再試。';
        if (isOverloaded) {
          errorMessage = '抱歉，目前 AI 伺服器滿載，請稍後再試。';
        } else if (error.message) {
           errorMessage = `錯誤: ${error.message}`;
        }
        
        toast.error(errorMessage);
        messages.value.push({ role: 'model', parts: [{ text: errorMessage }] });
        await saveChatHistory(); // Save error message to history so the flow is preserved
        break; // Exit loop on failure
      }
    }
  }

  isLoading.value = false;
  scrollToBottom();
};

const scrollToBottom = async () => {
  await nextTick();
  messagesEnd.value?.scrollIntoView({ behavior: 'instant' });
};

// 開啟對話框時專用的捲動：持續輪詢直到 sentinel 元素可見為止
const scrollToBottomDeferred = () => {
  let attempts = 0;
  const maxAttempts = 30; // 最多等 3 秒 (30 * 100ms)
  const tryScroll = () => {
    attempts++;
    const anchor = messagesEnd.value;
    if (anchor) {
      anchor.scrollIntoView({ behavior: 'instant' });
      return;
    }
    if (attempts < maxAttempts) {
      setTimeout(tryScroll, 100);
    }
  };
  setTimeout(tryScroll, 100);
};

// Computed
const isTokenExhausted = computed(() => {
  return tokenQuota.value > 0 && tokenUsed.value >= tokenQuota.value;
});

const tokenRemainingClass = computed(() => {
  if (tokenQuota.value <= 0) return 'text-grey';
  const ratio = tokenUsed.value / tokenQuota.value;
  if (ratio >= 1) return 'text-error font-weight-bold';
  if (ratio >= 0.8) return 'text-warning font-weight-bold';
  return 'text-success';
});


// Markdown formatter (Basic)
const formatMessage = (text) => {
  if (!text) return '';
  let formatted = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code style="background-color: #eee; padding: 2px 4px; border-radius: 4px;">$1</code>')
    .replace(/\n/g, '<br>');
  return formatted;
};

// Voice Input using Web Speech API
const isListening = ref(false);
let recognition = null;

onMounted(() => {
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'cmn-Hant-TW'; // Traditional Chinese

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
          inputText.value = (inputText.value + ' ' + finalTranscript).trim();
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      isListening.value = false;
      toast.error('語音辨識發生錯誤');
    };

    recognition.onend = () => {
      isListening.value = false;
    };
  }

  loadProjectData();
  loadChatHistory();
});

const toggleVoiceInput = () => {
  if (!recognition) {
    toast.error('您的瀏覽器不支援語音輸入功能');
    return;
  }

  if (isListening.value) {
    recognition.stop();
  } else {
    inputText.value = ''; // clear input before recording
    recognition.start();
    isListening.value = true;
  }
};

onUnmounted(() => {
    if (recognition && isListening.value) {
        recognition.stop();
    }
});

</script>

<style scoped>
/* Optional styling */
</style>
