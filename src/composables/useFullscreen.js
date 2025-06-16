import { ref, onMounted, onUnmounted } from 'vue';

export function useFullscreen(elementRef) {
  // isFullscreen 是一個 ref，用於追蹤當前的全螢幕狀態
  const isFullscreen = ref(false);

  // 要操作的 DOM 元素，預設為整個文檔
  const element = elementRef || { value: document.documentElement };

  // 嘗試進入全螢幕
  const enter = () => {
    if (element.value.requestFullscreen) {
      element.value.requestFullscreen();
    } else if (element.value.webkitRequestFullscreen) { /* Safari */
      element.value.webkitRequestFullscreen();
    } else if (element.value.msRequestFullscreen) { /* IE11 */
      element.value.msRequestFullscreen();
    }
  };

  // 退出全螢幕
  const exit = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) { /* Safari */
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { /* IE11 */
      document.msExitFullscreen();
    }
  };

  // 切換全螢幕狀態
  const toggleFullscreen = () => {
    if (isFullscreen.value) {
      exit();
    } else {
      enter();
    }
  };

  // 更新 isFullscreen 狀態的函數
  const updateFullscreenStatus = () => {
    isFullscreen.value = !!document.fullscreenElement;
  };

  // 在組件掛載時，添加事件監聽器來監測全螢幕狀態的變化
  onMounted(() => {
    document.addEventListener('fullscreenchange', updateFullscreenStatus);
    document.addEventListener('webkitfullscreenchange', updateFullscreenStatus);
    document.addEventListener('msfullscreenchange', updateFullscreenStatus);
  });

  // 在組件卸載時，移除事件監聽器，避免內存洩漏
  onUnmounted(() => {
    document.removeEventListener('fullscreenchange', updateFullscreenStatus);
    document.removeEventListener('webkitfullscreenchange', updateFullscreenStatus);
    document.removeEventListener('msfullscreenchange', updateFullscreenStatus);
  });

  // 返回狀態和方法，供組件使用
  return {
    isFullscreen,
    enterFullscreen: enter,
    exitFullscreen: exit,
    toggleFullscreen,
  };
}