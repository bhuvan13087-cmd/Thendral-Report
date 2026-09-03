/**
 * Camera & Digital Signature Manager
 * Enables real-time device camera capture for up-tower technicians and digital touchscreen signatures
 */

const CameraManager = {
  activeStream: null,
  currentSlotId: null,

  // Initialize and open device camera modal
  async openCameraModal(slotId, slotLabel) {
    this.currentSlotId = slotId;
    const modal = document.getElementById('camera-modal');
    const titleEl = document.getElementById('camera-modal-title');
    const video = document.getElementById('camera-video');

    if (titleEl) {
      titleEl.innerText = `Capture Real-Time Photo: ${slotLabel || 'Inspection Point'}`;
    }

    if (modal) {
      modal.classList.add('active');
    }

    try {
      // Request rear camera on mobile / webcam on laptop
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };

      this.activeStream = await navigator.mediaDevices.getUserMedia(constraints);
      if (video) {
        video.srcObject = this.activeStream;
        await video.play();
      }
    } catch (err) {
      console.error('Camera access error:', err);
      alert('Unable to access device camera. Please check camera permissions or upload an image file instead.');
      this.closeCameraModal();
    }
  },

  // Snap photo from video feed
  capturePhoto() {
    const video = document.getElementById('camera-video');
    if (!video || !this.activeStream) return null;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get compressed JPEG Data URL
    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.88);
    const slotId = this.currentSlotId;

    this.closeCameraModal();

    return {
      slotId: slotId,
      url: photoDataUrl,
      timestamp: this.getFormattedTimestamp()
    };
  },

  // Close camera feed and modal
  closeCameraModal() {
    if (this.activeStream) {
      this.activeStream.getTracks().forEach(track => track.stop());
      this.activeStream = null;
    }
    const modal = document.getElementById('camera-modal');
    if (modal) {
      modal.classList.remove('active');
    }
    this.currentSlotId = null;
  },

  // Format current timestamp
  getFormattedTimestamp() {
    const now = new Date();
    return `${now.getFullYear()}/${String(now.getMonth()+1).padStart(2,'0')}/${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  }
};

/**
 * Signature Pad Manager for Field Engineers & Reviewers
 */
class SignaturePad {
  constructor(canvasId, clearBtnId = null, onSaveCallback = null) {
    this.canvas = document.getElementById(canvasId);
    this.clearBtn = clearBtnId ? document.getElementById(clearBtnId) : null;
    this.onSaveCallback = onSaveCallback;
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.isDrawing = false;
    this.hasSignature = false;

    this.initCanvas();
    this.setupListeners();
  }

  initCanvas() {
    if (!this.canvas || !this.canvas.parentElement) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width || 320;
    this.canvas.height = rect.height || 110;
    this.ctx.strokeStyle = '#0f172a';
    this.ctx.lineWidth = 2.5;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }

  setupListeners() {
    const start = (e) => {
      this.isDrawing = true;
      this.hasSignature = true;
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      this.ctx.beginPath();
      this.ctx.moveTo(clientX - rect.left, clientY - rect.top);
    };

    const draw = (e) => {
      if (!this.isDrawing) return;
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      this.ctx.lineTo(clientX - rect.left, clientY - rect.top);
      this.ctx.stroke();
    };

    const stop = () => {
      if (this.isDrawing) {
        this.isDrawing = false;
        if (typeof this.onSaveCallback === 'function') {
          this.onSaveCallback(this.getImageDataUrl());
        }
        if (window.app) window.app.debouncedSaveAndRender();
      }
    };

    this.canvas.addEventListener('mousedown', start);
    this.canvas.addEventListener('mousemove', draw);
    this.canvas.addEventListener('mouseup', stop);
    this.canvas.addEventListener('mouseleave', stop);

    this.canvas.addEventListener('touchstart', start, { passive: false });
    this.canvas.addEventListener('touchmove', draw, { passive: false });
    this.canvas.addEventListener('touchend', stop);

    if (this.clearBtn) {
      this.clearBtn.addEventListener('click', () => this.clear());
    }
  }

  clear(suppressCallback = false) {
    if (!this.ctx || !this.canvas) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.hasSignature = false;
    if (!suppressCallback) {
      if (typeof this.onSaveCallback === 'function') {
        this.onSaveCallback('');
      }
      if (window.app) window.app.debouncedSaveAndRender();
    }
  }

  getImageDataUrl() {
    return this.hasSignature ? this.canvas.toDataURL('image/png') : null;
  }
}

if (typeof window !== 'undefined') window.SignaturePad = SignaturePad;
if (typeof module !== 'undefined') module.exports = { CameraManager, SignaturePad };
