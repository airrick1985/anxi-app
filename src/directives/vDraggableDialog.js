// src/directives/vDraggableDialog.js

export const vDraggableDialog = {
  mounted: (el) => {
    el.style.cursor = 'move';
    const dialog = el.closest('.v-dialog');
    if (!dialog) return;

    const sensitivity = 2.2;
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;
    let latestMouseX, latestMouseY;
    let animationFrameId = null;

    const onMouseDown = (e) => {
      if (e.button !== 0) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      latestMouseX = e.clientX;
      latestMouseY = e.clientY;
      const style = window.getComputedStyle(dialog);
      initialLeft = parseFloat(style.left);
      initialTop = parseFloat(style.top);

      document.body.classList.add('is-dragging');
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);

      animationFrameId = requestAnimationFrame(updatePosition);
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      latestMouseX = e.clientX;
      latestMouseY = e.clientY;
    };

    const updatePosition = () => {
      if (!isDragging) return;

      const dx = (latestMouseX - startX) * sensitivity;
      const dy = (latestMouseY - startY) * sensitivity;

      dialog.style.left = `${initialLeft + dx}px`;
      dialog.style.top = `${initialTop + dy}px`;

      animationFrameId = requestAnimationFrame(updatePosition);
    };

    const onMouseUp = () => {
      isDragging = false;
      document.body.classList.remove('is-dragging');
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      cancelAnimationFrame(animationFrameId);
    };

    el.addEventListener('mousedown', onMouseDown);
  }
};