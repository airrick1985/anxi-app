<template>
  <v-card variant="outlined" class="item-editor-card d-flex flex-column">
    <v-card-title class="item-editor-header d-flex align-center py-3">
      <v-icon size="20" class="mr-2">{{ local.isNew ? 'mdi-plus-box-outline' : 'mdi-pencil-box-outline' }}</v-icon>
      <span class="text-subtitle-1 font-weight-bold">{{ headerTitle }}</span>
      <v-spacer></v-spacer>
      <v-btn icon="mdi-close" variant="text" size="small" @click="$emit('cancel')"></v-btn>
    </v-card-title>
    <v-divider></v-divider>

    <v-card-text class="flex-grow-1 overflow-y-auto pt-4">
      <v-row dense>
        <v-col cols="12" sm="6">
          <v-text-field
            v-model="local.name"
            label="項目名稱"
            variant="outlined"
            density="comfortable"
            :rules="[v => !!v || '必填']"
          ></v-text-field>
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field
            v-model.number="local.conditionalValue"
            label="比例 (%)"
            type="number"
            suffix="%"
            variant="outlined"
            density="comfortable"
          ></v-text-field>
        </v-col>
        <v-col cols="12" sm="6">
          <v-select
            v-model="local.roundingMethod"
            :items="['無條件進位', '四捨五入', '無條件捨去']"
            label="進位方式"
            variant="outlined"
            density="comfortable"
          ></v-select>
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field
            v-model.number="local.roundingValue"
            label="進位值 (小數位數)"
            type="number"
            variant="outlined"
            density="comfortable"
          ></v-text-field>
        </v-col>
      </v-row>

      <v-divider class="my-3"></v-divider>

      <label class="v-label mb-2">計算方式</label>
      <v-sheet border rounded class="pa-2 d-flex flex-wrap align-center ga-1" min-height="56px">
        <v-chip
          v-for="(token, index) in formulaTokens"
          :key="index"
          :color="token.color"
          label
          closable
          @click:close="removeToken(index)"
        >
          {{ token.text }}
        </v-chip>
        <span v-if="!formulaTokens.length" class="text-caption text-grey px-2">
          請透過下方「快速插入」或直接輸入公式
        </span>
      </v-sheet>

      <div class="d-flex flex-column ga-2 mt-2">
        <!-- 快速插入工具列：融入公式區的小型 chip，取代原本突兀的大按鈕 -->
        <div class="d-flex align-center flex-wrap ga-2">
          <span class="text-caption text-grey-darken-1">快速插入：</span>
          <v-chip
            size="small"
            variant="outlined"
            color="blue"
            prepend-icon="mdi-plus"
            link
            @click="addToken({type: 'variable', value: '總價', text: '總價', color: 'blue'})"
          >
            總價
          </v-chip>
          <v-chip
            size="small"
            variant="outlined"
            color="blue"
            prepend-icon="mdi-plus"
            link
            @click="addToken({type: 'variable', value: '配套金額', text: '配套金額', color: 'blue'})"
          >
            配套金額
          </v-chip>
          <v-menu>
            <template v-slot:activator="{ props: menuProps }">
              <v-chip
                v-bind="menuProps"
                size="small"
                variant="outlined"
                color="grey-darken-1"
                prepend-icon="mdi-link-variant"
                append-icon="mdi-menu-down"
                link
              >
                引用期款項目
              </v-chip>
            </template>
            <v-list density="compact">
              <v-list-item
                v-for="refItem in existingItems"
                :key="refItem.id"
                @click="addToken({
                  type: 'reference',
                  value: refItem.name,
                  text: refItem.name,
                  color: 'grey-darken-1'
                })"
              >
                <v-list-item-title>{{ refItem.name }}</v-list-item-title>
              </v-list-item>
              <v-list-item v-if="!existingItems.length" disabled>
                <v-list-item-title class="text-caption">尚未建立其他期款項目</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>

        <v-text-field
          v-model="formulaInput"
          label="計算公式"
          :rules="[validateFormula]"
          placeholder="可直接輸入數字、%及運算符號 (例如: 總價*10%)"
          @input="handleFormulaInput"
          hide-details="auto"
          variant="outlined"
          density="comfortable"
        ></v-text-field>
      </div>
    </v-card-text>

    <v-divider></v-divider>
    <v-card-actions class="px-4 py-3">
      <v-spacer></v-spacer>
      <v-btn variant="text" @click="$emit('cancel')">取消</v-btn>
      <v-btn color="primary" variant="flat" @click="handleSave">儲存項目</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useToast } from 'vue-toastification';

const props = defineProps({
  // 由父層傳入的「工作副本」，編輯過程不會動到範本原始資料
  item: { type: Object, default: null },
  // 可在公式中引用的其他期款項目
  existingItems: { type: Array, default: () => [] },
});

const emit = defineEmits(['save', 'cancel']);

const toast = useToast();

const local = ref({});
const originalName = ref('');
const formulaTokens = ref([]);
const formulaInput = ref('');

const headerTitle = computed(() => {
  if (local.value.isNew) {
    return local.value.parentId ? '新增子項目' : '新增期款項目';
  }
  return `編輯：${originalName.value}`;
});

// 父層每次開啟編輯都會傳入新的副本物件，這裡監聽切換並重置編輯狀態
watch(
  () => props.item,
  (val) => {
    local.value = val ? JSON.parse(JSON.stringify(val)) : {};
    originalName.value = val?.name || '';
    formulaInput.value = local.value.formula || '';
    formulaTokens.value = parseFormulaToTokens(formulaInput.value);
  },
  { immediate: true }
);

// 將公式字串解析為 token 陣列（使用函式宣告，供上方 immediate watch 呼叫）
function parseFormulaToTokens(formula) {
  if (!formula) return [];

  const parts = formula.split(/([+\-*/()])/);
  const tokens = [];

  parts.forEach(part => {
    part = part.trim();
    if (!part) return;

    if (/^[+\-*/()]$/.test(part)) {
      const color = /^[()]$/.test(part) ? 'indigo' : 'orange';
      tokens.push({ type: 'operator', value: part, text: part, color: color });
    } else if (part === '總價' || part === '配套金額') {
      tokens.push({ type: 'variable', value: part, text: part, color: 'blue' });
    } else if (/^\d+(\.\d+)?$/.test(part)) {
      tokens.push({ type: 'number', value: part, text: part, color: 'purple' });
    } else {
      tokens.push({ type: 'reference', value: part, text: part, color: 'grey-darken-1' });
    }
  });

  return tokens;
}

const addToken = (token) => {
  let currentFormula = (formulaInput.value || '').trim();

  if (currentFormula) {
    if (/[+\-*/]$/.test(currentFormula)) {
      formulaInput.value = `${currentFormula}${token.value}`;
    } else {
      formulaInput.value = `${currentFormula}-${token.value}`;
    }
  } else {
    formulaInput.value = token.value;
  }

  handleFormulaInput();
};

const removeToken = (index) => {
  if (index >= 0 && index < formulaTokens.value.length) {
    const tokensArray = [...formulaTokens.value];
    tokensArray.splice(index, 1);

    let newFormula = tokensArray.map(t => t.value).join('');
    newFormula = newFormula.replace(/[+\-*/]{2,}/g, '-');

    formulaInput.value = newFormula;
    handleFormulaInput();
  }
};

const validateFormula = (value) => {
  if (!value) return true;

  value = value.replace(/[+\-*/]{2,}/g, '-');

  const parts = value.split(/([+\-*/()])/);

  for (let part of parts) {
    part = part.trim();
    if (!part) continue;

    if (/^[+\-*/()]$/.test(part)) continue;

    const isValid =
      part === '總價' ||
      part === '配套金額' ||
      /^\d+(\.\d+)?%?$/.test(part) ||
      /^\d+\.[^+\-*/()]+$/.test(part) ||
      props.existingItems.some(item => item.name === part);

    if (!isValid) {
      return `運算元「${part}」不是有效的值或期款項目名稱`;
    }
  }

  const openBrackets = (value.match(/\(/g) || []).length;
  const closeBrackets = (value.match(/\)/g) || []).length;
  if (openBrackets !== closeBrackets) {
    return '括號不配對，請檢查公式';
  }

  return true;
};

const handleFormulaInput = () => {
  let value = formulaInput.value.trim();
  if (!value) {
    formulaTokens.value = [];
    return;
  }

  value = value.replace(/[+\-*/]{2,}/g, '-');
  formulaInput.value = value;

  formulaTokens.value = parseFormulaToTokens(value);
};

const handleSave = () => {
  if (!local.value.name) {
    toast.error('項目名稱為必填');
    return;
  }

  const formulaError = validateFormula(formulaInput.value);
  if (formulaError !== true) {
    toast.error(formulaError);
    return;
  }

  local.value.formula = formulaTokens.value.map(t => t.value).join('');
  emit('save', JSON.parse(JSON.stringify(local.value)));
};
</script>

<style scoped>
.item-editor-card {
  height: 100%;
}

.item-editor-header {
  background: rgba(46, 125, 50, 0.08);
  color: #1B5E20;
}
</style>
