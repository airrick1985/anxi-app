import { ref } from 'vue';

export function useSnackbar() {
  const snackbar = ref({
    show: false,
    text: '',
    color: 'info', // Default color
  });

  const showSnackbar = (text, color = 'info', timeout = 3000) => {
    snackbar.value.text = text;
    snackbar.value.color = color;
    // Note: Vuetify's v-snackbar handles the timeout itself,
    // but you could potentially add logic here if needed.
    snackbar.value.show = true;
  };

  return {
    snackbar,
    showSnackbar,
  };
}
