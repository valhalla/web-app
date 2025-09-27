type HandleType = 'w' | 'n' | 'nw' | 'w, n, nw';

interface ResizableOptions {
  handles?: HandleType;
  minWidth?: number;
  minHeight?: number; // Minimum height in pixels
  applyInlineSize?: boolean;
  onResize?: (size: { width: number; height: number }) => void;
  onStop?: () => void;
}

interface ResizeState {
  resizing: boolean;
  activeHandle: HandleType | null;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
}

export default function makeResizable(
  target: HTMLElement,
  options: ResizableOptions = {}
) {
  if (!target) {
    throw new Error('makeResizable: target element is required');
  }

  const handles = parseHandles(options.handles || 'w, n, nw');
  const minWidth = options.minWidth || 0;
  const minHeight = options.minHeight || 0;
  const applyInlineSize = options.applyInlineSize !== false;
  const onResize =
    typeof options.onResize === 'function' ? options.onResize : null;
  const onStop = typeof options.onStop === 'function' ? options.onStop : null;

  const state: ResizeState = {
    resizing: false,
    activeHandle: null,
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
  };

  const handleElements: HTMLElement[] = [];
  const boundDownHandlers: ((e: MouseEvent) => void)[] = [];
  const boundTouchStartHandlers: ((e: TouchEvent) => void)[] = [];

  const computedStyle = window.getComputedStyle(target);
  if (computedStyle.position === 'static') {
    target.style.position = 'relative';
  }

  handles.forEach((h: HandleType) => {
    const el = document.createElement('div');
    el.className = `resizable-handle resizable-handle-${h}`;
    Object.assign(el.style, baseHandleStyle, handlePositionStyle(h));
    const md = onMouseDown(h);
    const ts = onTouchStart(h);
    el.addEventListener('mousedown', md);
    el.addEventListener('touchstart', ts, { passive: false });
    target.appendChild(el);
    handleElements.push(el);
    boundDownHandlers.push(md);
    boundTouchStartHandlers.push(ts);
  });

  function onMouseDown(handle: HandleType) {
    return function (e: MouseEvent) {
      e.preventDefault();
      startResize(handle, e.clientX, e.clientY);
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    };
  }

  function onTouchStart(handle: HandleType) {
    return function (e: TouchEvent) {
      if (e.touches && e.touches.length > 0) {
        e.preventDefault();
        const t = e.touches[0];
        if (t) {
          startResize(handle, t.clientX, t.clientY);
        }
        window.addEventListener('touchmove', onTouchMove, { passive: false });
        window.addEventListener('touchend', onTouchEnd);
      }
    };
  }

  function startResize(handle: HandleType, clientX: number, clientY: number) {
    state.resizing = true;
    state.activeHandle = handle;
    state.startX = clientX;
    state.startY = clientY;
    state.startWidth = getElementPixelWidth(target);
    state.startHeight = getElementPixelHeight(target);
    target.classList.add('resizing');
  }

  function onMouseMove(e: MouseEvent) {
    e.preventDefault();
    performResize(e.clientX, e.clientY);
  }

  function onTouchMove(e: TouchEvent) {
    if (e.touches && e.touches.length > 0) {
      e.preventDefault();
      const t = e.touches[0];
      if (t) {
        performResize(t.clientX, t.clientY);
      }
    }
  }

  function performResize(clientX: number, clientY: number) {
    if (!state.resizing) {
      return;
    }
    const dx = clientX - state.startX;
    const dy = clientY - state.startY;

    let newWidth = state.startWidth;
    let newHeight = state.startHeight;

    if (state.activeHandle && state.activeHandle.includes('w')) {
      newWidth = Math.max(minWidth, state.startWidth - dx);
    }
    if (state.activeHandle && state.activeHandle.includes('n')) {
      newHeight = Math.max(minHeight, state.startHeight - dy);
    }

    if (applyInlineSize) {
      target.style.width = `${newWidth}px`;
      target.style.height = `${newHeight}px`;
    }

    if (onResize) {
      onResize({ width: newWidth, height: newHeight });
    }
  }

  function onMouseUp() {
    stopResize();
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  }

  function onTouchEnd() {
    stopResize();
    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('touchend', onTouchEnd);
  }

  function stopResize() {
    if (!state.resizing) {
      return;
    }
    state.resizing = false;
    target.classList.remove('resizing');
    if (applyInlineSize) {
      // Remove explicit left/top to stick to bottom-right if consumer adjusts positioning
      target.style.left = '';
      target.style.top = '';
    }
    if (onStop) {
      onStop();
    }
  }

  function destroy() {
    handleElements.forEach((el, idx) => {
      const mouseHandler = boundDownHandlers[idx];
      const touchHandler = boundTouchStartHandlers[idx];
      if (mouseHandler) {
        el.removeEventListener('mousedown', mouseHandler);
      }
      if (touchHandler) {
        el.removeEventListener('touchstart', touchHandler);
      }
      if (el.parentNode === target) {
        target.removeChild(el);
      }
    });
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('touchend', onTouchEnd);
  }

  return { destroy };
}

function parseHandles(handles: string): HandleType[] {
  return handles
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean) as HandleType[];
}

function getElementPixelWidth(el: HTMLElement): number {
  // Prefer attribute 'width' if present (leaflet.heightgraph uses an SVG width attr)
  const attr = el.getAttribute('width');
  if (attr && !isNaN(Number(attr))) {
    return Number(attr);
  }
  const rect = el.getBoundingClientRect();
  return Math.max(0, Math.round(rect.width));
}

function getElementPixelHeight(el: HTMLElement): number {
  const attr = el.getAttribute('height');
  if (attr && !isNaN(Number(attr))) {
    return Number(attr);
  }
  const rect = el.getBoundingClientRect();
  return Math.max(0, Math.round(rect.height));
}

const baseHandleStyle = {
  position: 'absolute',
  width: '12px',
  height: '7px',
  zIndex: '10',
  cursor: 'default',
};

function handlePositionStyle(h: HandleType): Partial<CSSStyleDeclaration> {
  switch (h) {
    case 'w':
      return {
        left: '-4px',
        top: '50%',
        transform: 'translateY(-50%)',
        cursor: 'ew-resize',
        height: '100%',
      };
    case 'n':
      return {
        top: '-4px',
        left: '50%',
        transform: 'translateX(-50%)',
        cursor: 'ns-resize',
        width: '100%',
      };
    case 'nw':
      return { top: '-4px', left: '-4px', cursor: 'nwse-resize' };
    default:
      return {};
  }
}
