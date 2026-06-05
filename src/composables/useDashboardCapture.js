import html2canvas from 'html2canvas';
import { Chart } from 'chart.js';

const CAPTURE_PREP_CLASS = 'rf-capture-prep';

const DEFAULT_OPTIONS = {
  useCORS: true,
  scale: 1,
  backgroundColor: '#f1f5f9',
  logging: false,
  imageTimeout: 0,
};

const MAX_WIDTH = 1200;
const JPEG_QUALITY = 0.82;

function waitForPaint() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

/** Copy Chart.js bitmaps into html2canvas's cloned DOM (otherwise charts are blank). */
function copyCanvasesFromSource(clonedRoot, sourceRoot) {
  if (!clonedRoot || !sourceRoot) return;
  const sourceCanvases = sourceRoot.querySelectorAll('canvas');
  const clonedCanvases = clonedRoot.querySelectorAll('canvas');
  sourceCanvases.forEach((sourceCanvas, index) => {
    const clonedCanvas = clonedCanvases[index];
    if (!clonedCanvas || !sourceCanvas.width || !sourceCanvas.height) return;
    clonedCanvas.width = sourceCanvas.width;
    clonedCanvas.height = sourceCanvas.height;
    const ctx = clonedCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(sourceCanvas, 0, 0);
    }
  });
}

function refreshChartsInElement(el) {
  el.querySelectorAll('canvas').forEach((canvas) => {
    const chart = Chart.getChart(canvas);
    if (chart) {
      chart.update('none');
    }
  });
}

/**
 * Move off-screen capture host into the viewport so Chart.js paints before capture.
 */
function prepareElementForCapture(el) {
  const hadPrep = el.classList.contains(CAPTURE_PREP_CLASS);
  el.classList.add(CAPTURE_PREP_CLASS);
  return () => {
    if (!hadPrep) {
      el.classList.remove(CAPTURE_PREP_CLASS);
    }
  };
}

function resizeCanvas(source) {
  if (source.width <= MAX_WIDTH) {
    return source;
  }
  const scale = MAX_WIDTH / source.width;
  const canvas = document.createElement('canvas');
  canvas.width = MAX_WIDTH;
  canvas.height = Math.round(source.height * scale);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function canvasToJpegBase64(canvas) {
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY).split(',')[1];
}

/**
 * Prefer the visible dashboard block when on /dashboard; otherwise the scheduler host.
 */
export function resolveCaptureElementId() {
  const visible = document.getElementById('dashboard-capture');
  if (visible && visible.offsetWidth > 0 && visible.offsetHeight > 0) {
    return 'dashboard-capture';
  }
  return 'dashboard-capture-scheduler';
}

/**
 * Capture a DOM element to JPEG base64 (without data: prefix).
 * @param {string} [elementId] defaults to resolveCaptureElementId()
 * @param {object} options html2canvas options
 */
export async function captureElementToBase64(elementId, options = {}) {
  const id = elementId || resolveCaptureElementId();
  const el = document.getElementById(id);
  if (!el) {
    throw new Error(`Capture element not found: #${id}`);
  }

  const needsViewportPrep =
    id === 'dashboard-capture-scheduler' || el.classList.contains('dashboard-capture-host');

  const restore = needsViewportPrep ? prepareElementForCapture(el) : () => {};

  try {
    refreshChartsInElement(el);
    await waitForPaint();
    await waitForPaint();

    const rawCanvas = await html2canvas(el, {
      ...DEFAULT_OPTIONS,
      ...options,
      onclone: (clonedDoc) => {
        const clonedRoot = clonedDoc.getElementById(id);
        copyCanvasesFromSource(clonedRoot, el);
        if (typeof options.onclone === 'function') {
          options.onclone(clonedDoc);
        }
      },
    });

    const canvas = resizeCanvas(rawCanvas);
    const mimeType = 'image/jpeg';
    const imageBase64 = canvasToJpegBase64(canvas);

    const imageBlob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Failed to encode screenshot'))),
        mimeType,
        JPEG_QUALITY,
      );
    });

    return {
      imageBase64,
      mimeType,
      imageBlob,
    };
  } finally {
    restore();
  }
}

export function defaultReportCaption() {
  const today = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  return `Productivity Report – ${today}`;
}
