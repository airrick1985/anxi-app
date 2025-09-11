<template>
  <v-card>
    <v-card-title class="bg-primary text-white">
      <span class="text-h5">{{ isEditing ? '編輯' : '新增' }}銷售人員</span>
    </v-card-title>
    
    <v-card-text class="pt-4">
      <v-form ref="form">
        <v-combobox
          v-model="editableData.positions"
          :items="positionOptions"
          label="職位"
          multiple
          chips
          closable-chips
          variant="outlined"
          density="compact"
          :rules="[v => v && v.length > 0 || '職位為必填欄位']"
          hint="可選擇或手動輸入後按 Enter 新增"
          persistent-hint
          class="mb-4"
        ></v-combobox>

        <v-text-field
          v-model="editableData.name"
          label="姓名"
          variant="outlined"
          density="compact"
          :rules="[v => !!v || '姓名為必填欄位']"
          required
          class="mb-4"
        ></v-text-field>

        <v-text-field
          v-model="editableData.phone"
          label="電話"
          variant="outlined"
          density="compact"
          :rules="[v => !!v || '電話為必填欄位']"
          required
          class="mb-4"
        ></v-text-field>

        <v-text-field
          v-model="editableData.email"
          label="Email"
          type="email"
          variant="outlined"
          density="compact"
        ></v-text-field>
      </v-form>
    </v-card-text>
    
    <v-divider></v-divider>

    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn color="grey" variant="text" @click="$emit('cancel')">取消</v-btn>
      <v-btn color="primary" variant="flat" @click="handleSave" :loading="loading">儲存</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue';

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      positions: [],
      name: '',
      phone: '',
      email: ''
    })
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'save', 'cancel']);

const form = ref(null);
const positionOptions = ref(['銷售', '專案', '副專', '助理', '業主']);

const isEditing = computed(() => !!props.modelValue.id);

const editableData = computed({
  get: () => props.modelValue,
  set: (newValue) => emit('update:modelValue', newValue)
});

const handleSave = async () => {
  const { valid } = await form.value.validate();
  if (valid) {
    emit('save', editableData.value);
  }
};
</script>