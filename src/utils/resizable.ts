/* eslint-disable id-length */
export default function makeResizable(target, options = {}) {
  if (!target) {
    throw new Error('makeResizable: target element is required')
  }

  const handles = parseHandles(options.handles || 'w, n, nw')
  const minWidth = options.minWidth || 0
  const minHeight = options.minHeight || 0
  const applyInlineSize = options.applyInlineSize !== false
  const onResize =
    typeof options.onResize === 'function' ? options.onResize : null
  const onStop = typeof options.onStop === 'function' ? options.onStop : null

  const state = {
    resizing: false,
    activeHandle: null,
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
  }

  const handleElements = []
  const boundDownHandlers = []
  const boundTouchStartHandlers = []

  const computedStyle = window.getComputedStyle(target)
  if (computedStyle.position === 'static') {
    target.style.position = 'relative'
  }

  handles.forEach((h) => {
    const el = document.createElement('div')
    el.className = `resizable-handle resizable-handle-${h}`
    Object.assign(el.style, baseHandleStyle, handlePositionStyle(h))
    const md = onMouseDown(h)
    const ts = onTouchStart(h)
    el.addEventListener('mousedown', md)
    el.addEventListener('touchstart', ts, { passive: false })
    target.appendChild(el)
    handleElements.push(el)
    boundDownHandlers.push(md)
    boundTouchStartHandlers.push(ts)
  })

  function onMouseDown(handle) {
    return function (e) {
      e.preventDefault()
      startResize(handle, e.clientX, e.clientY)
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
    }
  }

  function onTouchStart(handle) {
    return function (e) {
      if (e.touches && e.touches.length > 0) {
        e.preventDefault()
        const t = e.touches[0]
        startResize(handle, t.clientX, t.clientY)
        window.addEventListener('touchmove', onTouchMove, { passive: false })
        window.addEventListener('touchend', onTouchEnd)
      }
    }
  }

  function startResize(handle, clientX, clientY) {
    state.resizing = true
    state.activeHandle = handle
    state.startX = clientX
    state.startY = clientY
    state.startWidth = getElementPixelWidth(target)
    state.startHeight = getElementPixelHeight(target)
    target.classList.add('resizing')
  }

  function onMouseMove(e) {
    e.preventDefault()
    performResize(e.clientX, e.clientY)
  }

  function onTouchMove(e) {
    if (e.touches && e.touches.length > 0) {
      e.preventDefault()
      const t = e.touches[0]
      performResize(t.clientX, t.clientY)
    }
  }

  function performResize(clientX, clientY) {
    if (!state.resizing) {
      return
    }
    const dx = clientX - state.startX
    const dy = clientY - state.startY

    let newWidth = state.startWidth
    let newHeight = state.startHeight

    if (state.activeHandle.includes('w')) {
      newWidth = Math.max(minWidth, state.startWidth - dx)
    }
    if (state.activeHandle.includes('n')) {
      newHeight = Math.max(minHeight, state.startHeight - dy)
    }

    if (applyInlineSize) {
      target.style.width = `${newWidth}px`
      target.style.height = `${newHeight}px`
    }

    if (onResize) {
      onResize({ width: newWidth, height: newHeight })
    }
  }

  function onMouseUp() {
    stopResize()
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  function onTouchEnd() {
    stopResize()
    window.removeEventListener('touchmove', onTouchMove)
    window.removeEventListener('touchend', onTouchEnd)
  }

  function stopResize() {
    if (!state.resizing) {
      return
    }
    state.resizing = false
    target.classList.remove('resizing')
    if (applyInlineSize) {
      // Remove explicit left/top to stick to bottom-right if consumer adjusts positioning
      target.style.left = ''
      target.style.top = ''
    }
    if (onStop) {
      onStop()
    }
  }

  function destroy() {
    handleElements.forEach((el, idx) => {
      el.removeEventListener('mousedown', boundDownHandlers[idx])
      el.removeEventListener('touchstart', boundTouchStartHandlers[idx])
      if (el.parentNode === target) {
        target.removeChild(el)
      }
    })
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
    window.removeEventListener('touchmove', onTouchMove)
    window.removeEventListener('touchend', onTouchEnd)
  }

  return { destroy }
}

function parseHandles(handles) {
  return handles
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function getElementPixelWidth(el) {
  // Prefer attribute 'width' if present (leaflet.heightgraph uses an SVG width attr)
  const attr = el.getAttribute('width')
  if (attr && !isNaN(Number(attr))) {
    return Number(attr)
  }
  const rect = el.getBoundingClientRect()
  return Math.max(0, Math.round(rect.width))
}

function getElementPixelHeight(el) {
  const attr = el.getAttribute('height')
  if (attr && !isNaN(Number(attr))) {
    return Number(attr)
  }
  const rect = el.getBoundingClientRect()
  return Math.max(0, Math.round(rect.height))
}

const baseHandleStyle = {
  position: 'absolute',
  width: '12px',
  height: '7px',
  zIndex: '10',
  cursor: 'default',
}

function handlePositionStyle(h) {
  switch (h) {
    case 'w':
      return {
        left: '-4px',
        top: '50%',
        transform: 'translateY(-50%)',
        cursor: 'ew-resize',
        height: '100%',
      }
    case 'n':
      return {
        top: '-4px',
        left: '50%',
        transform: 'translateX(-50%)',
        cursor: 'ns-resize',
        width: '100%',
      }
    case 'nw':
      return { top: '-4px', left: '-4px', cursor: 'nwse-resize' }
    default:
      return {}
  }
}
