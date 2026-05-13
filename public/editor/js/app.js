/**
 * VidEdit — Main application controller.
 *
 * Wires together: MediaLibrary, Timeline, PreviewPlayer, ExportFlow.
 * Loads FFmpeg.wasm on startup then removes the loading overlay.
 */

/* global VideoProcessor, Timeline */

// ── Utility ────────────────────────────────────────────────────────────────

function formatTime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function uuid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function getVideoDuration(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = url;
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Impossible de lire la vidéo'));
    };
  });
}

// ── App ────────────────────────────────────────────────────────────────────

class App {
  constructor() {
    this.mediaItems = [];   // { id, file, name, duration, type, thumbnail, objectUrl }
    this.timeline = null;
    this.previewVideo = null;
    this.previewCanvas = null;
    this.previewCtx = null;
    this.isPlaying = false;
    this.playbackRaf = null;
    this.selectedClip = null;
    this.history = [];
    this.historyIndex = -1;

    this._init();
  }

  async _init() {
    this._bindElements();
    this._initTimeline();
    this._bindEvents();

    // Load FFmpeg in background
    try {
      const loadMsg = document.getElementById('loading-msg');
      await window.processor.load(msg => { if (loadMsg) loadMsg.textContent = msg; });
    } catch (err) {
      document.getElementById('loading-msg').textContent = 'FFmpeg indisponible — export désactivé';
    } finally {
      setTimeout(() => {
        document.getElementById('loading-overlay').style.display = 'none';
      }, 600);
    }
  }

  _bindElements() {
    this.previewVideo = document.getElementById('preview-video');
    this.previewCanvas = document.getElementById('preview-canvas');
    this.previewCtx = this.previewCanvas.getContext('2d');
    this.mediaList = document.getElementById('media-list');
    this.timeCurrent = document.getElementById('time-current');
    this.timeTotal = document.getElementById('time-total');
    this.projectDuration = document.getElementById('project-duration');
    this.btnPlay = document.getElementById('btn-play');
    this.previewPlaceholder = document.getElementById('preview-placeholder');
    this.clipPropsForm = document.getElementById('clip-props-form');
    this.clipPropertiesEmpty = document.getElementById('clip-properties');
  }

  _initTimeline() {
    const canvas = document.getElementById('timeline-canvas');
    const scrollWrap = document.getElementById('timeline-scroll-wrap');
    this.timeline = new Timeline(canvas, scrollWrap);

    this.timeline.onSelect(clip => this._onClipSelected(clip));
    this.timeline.onTimeChange(sec => this._seekTo(sec));
    this.timeline._resize();
    this.timeline.render();
  }

  _bindEvents() {
    // Import
    document.getElementById('btn-import').addEventListener('click', () =>
      document.getElementById('file-input').click());
    document.getElementById('media-drop-zone').addEventListener('click', () =>
      document.getElementById('file-input').click());
    document.getElementById('file-input').addEventListener('change', e =>
      this._importFiles(e.target.files));

    // Drag & drop
    const dropZone = document.getElementById('media-drop-zone');
    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', e => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      this._importFiles(e.dataTransfer.files);
    });

    // Playback
    this.btnPlay.addEventListener('click', () => this._togglePlay());
    document.getElementById('btn-rewind').addEventListener('click', () => this._seekTo(0));
    document.getElementById('btn-forward').addEventListener('click', () =>
      this._seekTo(this.timeline.currentTime + 5));
    document.getElementById('volume-slider').addEventListener('input', e => {
      this.previewVideo.volume = parseFloat(e.target.value);
    });

    // Toolbar
    document.getElementById('btn-split').addEventListener('click', () => this._splitAtPlayhead());
    document.getElementById('btn-delete-clip').addEventListener('click', () => this._deleteSelected());
    document.getElementById('btn-add-text').addEventListener('click', () => this._openTextModal());
    document.getElementById('btn-zoom-in').addEventListener('click', () =>
      this.timeline.setZoom(this.timeline.pxPerSec * 1.25));
    document.getElementById('btn-zoom-out').addEventListener('click', () =>
      this.timeline.setZoom(this.timeline.pxPerSec * 0.8));

    // Export
    document.getElementById('btn-open-export').addEventListener('click', () =>
      document.getElementById('export-modal').classList.remove('hidden'));
    document.getElementById('btn-export-cancel').addEventListener('click', () =>
      document.getElementById('export-modal').classList.add('hidden'));
    document.getElementById('btn-export-start').addEventListener('click', () => this._runExport());

    // CRF label
    const crf = document.getElementById('export-crf');
    crf.addEventListener('input', () =>
      document.getElementById('crf-value').textContent = crf.value);

    // Text modal
    document.getElementById('btn-text-cancel').addEventListener('click', () =>
      document.getElementById('text-modal').classList.add('hidden'));
    document.getElementById('btn-text-add').addEventListener('click', () => this._addTextClip());

    // Clip properties
    document.getElementById('prop-speed').addEventListener('input', e => {
      if (!this.selectedClip) return;
      this.selectedClip.speed = parseFloat(e.target.value);
      document.getElementById('prop-speed-val').textContent = `${e.target.value}×`;
      this.timeline._recalcDuration();
      this.timeline.render();
    });
    document.getElementById('prop-volume').addEventListener('input', e => {
      if (!this.selectedClip) return;
      this.selectedClip.volume = parseFloat(e.target.value);
      document.getElementById('prop-volume-val').textContent =
        `${Math.round(parseFloat(e.target.value) * 100)}%`;
    });
    document.getElementById('prop-opacity').addEventListener('input', e => {
      if (!this.selectedClip) return;
      this.selectedClip.opacity = parseFloat(e.target.value);
      document.getElementById('prop-opacity-val').textContent =
        `${Math.round(parseFloat(e.target.value) * 100)}%`;
    });
    document.getElementById('prop-btn-split').addEventListener('click', () => this._splitAtPlayhead());
    document.getElementById('prop-btn-delete').addEventListener('click', () => this._deleteSelected());

    // Keyboard shortcuts
    document.addEventListener('keydown', e => this._onKeyDown(e));

    // Undo/Redo buttons
    document.getElementById('btn-undo').addEventListener('click', () => this._undo());
    document.getElementById('btn-redo').addEventListener('click', () => this._redo());

    // Sync timeline duration → header
    setInterval(() => this._updateDurationDisplay(), 500);
  }

  // ── Media import ──────────────────────────────────────────────────────────

  async _importFiles(files) {
    for (const file of files) {
      if (!file.type.startsWith('video/') && !file.type.startsWith('audio/') &&
          !file.type.startsWith('image/')) continue;

      const id = uuid();
      const type = file.type.startsWith('video/') ? 'video'
        : file.type.startsWith('audio/') ? 'audio' : 'image';
      const objectUrl = URL.createObjectURL(file);
      let duration = 0;

      try {
        if (type !== 'image') duration = await getVideoDuration(file);
        else duration = 5; // images default to 5s
      } catch (_) { duration = 0; }

      const item = { id, file, name: file.name, duration, type, objectUrl, thumbnail: null };
      this.mediaItems.push(item);
      this._renderMediaItem(item);

      // Generate thumbnail async
      if (type === 'video' && window.processor.loaded) {
        window.processor.generateThumbnail(file, Math.min(1, duration / 2))
          .then(url => {
            item.thumbnail = url;
            this._updateMediaThumb(id, url);
          }).catch(() => {});
      }
    }
  }

  _renderMediaItem(item) {
    const el = document.createElement('div');
    el.className = 'media-item';
    el.dataset.id = item.id;

    const icon = item.type === 'video' ? '🎥' : item.type === 'audio' ? '🔊' : '🖼';
    el.innerHTML = `
      <div class="media-thumb-placeholder">${icon}</div>
      <div class="media-info">
        <div class="media-name" title="${item.name}">${item.name}</div>
        <div class="media-duration">${formatTime(item.duration)}</div>
      </div>`;

    el.addEventListener('click', () => this._selectMediaItem(item.id));
    el.addEventListener('dblclick', () => this._addMediaToTimeline(item.id));
    this.mediaList.appendChild(el);
  }

  _updateMediaThumb(id, url) {
    const el = this.mediaList.querySelector(`[data-id="${id}"]`);
    if (!el) return;
    const ph = el.querySelector('.media-thumb-placeholder');
    if (ph) {
      const img = document.createElement('img');
      img.className = 'media-thumb';
      img.src = url;
      ph.replaceWith(img);
    }
  }

  _selectMediaItem(id) {
    this.mediaList.querySelectorAll('.media-item').forEach(el =>
      el.classList.toggle('active', el.dataset.id === id));
  }

  _addMediaToTimeline(id) {
    const item = this.mediaItems.find(m => m.id === id);
    if (!item || item.duration === 0) return;

    const trackIndex = item.type === 'audio' ? 1 : 0;
    const clip = {
      id: uuid(),
      trackIndex,
      file: item.file,
      name: item.name,
      duration: item.duration,
      trimStart: 0,
      trimEnd: item.duration,
      speed: 1,
      volume: 1,
      opacity: 1,
      type: item.type,
      objectUrl: item.objectUrl,
    };
    this.timeline.addClip(clip);
    this.timeline._resize();

    // Show first clip in preview
    if (!this.previewVideo.src && item.type === 'video') {
      this._setPreviewSource(item.objectUrl);
    }
  }

  // ── Playback ──────────────────────────────────────────────────────────────

  _togglePlay() {
    if (this.isPlaying) this._pause();
    else this._play();
  }

  _play() {
    if (this.timeline.clips.length === 0) return;
    this.isPlaying = true;
    this.timeline.playing = true;
    this.btnPlay.textContent = '⏸';
    this.previewVideo.play().catch(() => {});
    this._schedulePlaybackTick();
  }

  _pause() {
    this.isPlaying = false;
    this.timeline.playing = false;
    this.btnPlay.textContent = '▶';
    this.previewVideo.pause();
    cancelAnimationFrame(this.playbackRaf);
  }

  _schedulePlaybackTick() {
    const tick = () => {
      if (!this.isPlaying) return;
      const t = this.timeline.currentTime + (1 / 60);
      if (t >= this.timeline.totalDuration) {
        this._seekTo(0);
        this._pause();
        return;
      }
      this.timeline.currentTime = t;
      this._updateTimeDisplay();
      this.timeline._scrollToPlayhead();
      this.playbackRaf = requestAnimationFrame(tick);
    };
    this.playbackRaf = requestAnimationFrame(tick);
  }

  _seekTo(sec) {
    this.timeline.setCurrentTime(sec);
    this._updateTimeDisplay();
    if (this.previewVideo.src) {
      const clip = this._getActiveClip(sec);
      if (clip) {
        const offset = sec - clip.startTime + clip.trimStart;
        this.previewVideo.currentTime = Math.max(0, offset);
      }
    }
  }

  _getActiveClip(time) {
    return this.timeline.clips
      .filter(c => c.type === 'video')
      .find(c => {
        const end = c.startTime + (c.trimEnd - c.trimStart) / (c.speed || 1);
        return time >= c.startTime && time < end;
      }) || null;
  }

  _setPreviewSource(url) {
    this.previewVideo.src = url;
    this.previewPlaceholder.style.display = 'none';
  }

  // ── Timeline actions ──────────────────────────────────────────────────────

  _splitAtPlayhead() {
    if (!this.selectedClip) return;
    this.timeline.splitClipAtTime(this.selectedClip.id, this.timeline.currentTime);
  }

  _deleteSelected() {
    if (!this.selectedClip) return;
    this.timeline.removeClip(this.selectedClip.id);
    this.selectedClip = null;
  }

  _onClipSelected(clip) {
    this.selectedClip = clip;
    if (!clip) {
      this.clipPropsForm.classList.add('hidden');
      this.clipPropertiesEmpty.style.display = '';
      return;
    }
    this.clipPropertiesEmpty.style.display = 'none';
    this.clipPropsForm.classList.remove('hidden');
    document.getElementById('prop-speed').value = clip.speed || 1;
    document.getElementById('prop-speed-val').textContent = `${clip.speed || 1}×`;
    document.getElementById('prop-volume').value = clip.volume ?? 1;
    document.getElementById('prop-volume-val').textContent =
      `${Math.round((clip.volume ?? 1) * 100)}%`;
    document.getElementById('prop-opacity').value = clip.opacity ?? 1;
    document.getElementById('prop-opacity-val').textContent =
      `${Math.round((clip.opacity ?? 1) * 100)}%`;

    if (clip.objectUrl) this._setPreviewSource(clip.objectUrl);
  }

  // ── Text overlays ─────────────────────────────────────────────────────────

  _openTextModal() {
    document.getElementById('text-modal').classList.remove('hidden');
    document.getElementById('text-input').focus();
  }

  _addTextClip() {
    const text = document.getElementById('text-input').value.trim();
    if (!text) return;

    const duration = parseFloat(document.getElementById('text-duration').value) || 3;
    const clip = {
      id: uuid(),
      trackIndex: 2,
      file: null,
      name: `"${text.slice(0, 20)}"`,
      duration,
      trimStart: 0,
      trimEnd: duration,
      speed: 1,
      volume: 1,
      opacity: 1,
      type: 'text',
      textContent: text,
      textSize: parseInt(document.getElementById('text-size').value, 10),
      textColor: document.getElementById('text-color').value,
      textPosition: document.getElementById('text-position').value,
    };
    this.timeline.addClip(clip);
    this.timeline._resize();
    document.getElementById('text-modal').classList.add('hidden');
    document.getElementById('text-input').value = '';
  }

  // ── Export ────────────────────────────────────────────────────────────────

  async _runExport() {
    if (!window.processor.loaded) {
      alert('FFmpeg n\'est pas chargé. Réessaie dans quelques secondes.');
      return;
    }

    const clips = [...this.timeline.clips].sort((a, b) => a.startTime - b.startTime);
    if (clips.filter(c => c.type !== 'text').length === 0) {
      alert('Ajoute au moins un clip vidéo à la timeline.');
      return;
    }

    const progressWrap = document.getElementById('export-progress-wrap');
    const progressBar = document.getElementById('export-progress-bar');
    const statusEl = document.getElementById('export-status');
    const startBtn = document.getElementById('btn-export-start');

    progressWrap.classList.remove('hidden');
    startBtn.disabled = true;
    startBtn.textContent = 'Export en cours…';

    const options = {
      resolution: document.getElementById('export-resolution').value,
      format: document.getElementById('export-format').value,
      crf: document.getElementById('export-crf').value,
    };

    try {
      const blob = await window.processor.export(clips, options, (ratio) => {
        const pct = Math.round(ratio * 100);
        progressBar.style.width = `${pct}%`;
        statusEl.textContent = `Encodage… ${pct}%`;
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `videdit_export.${options.format}`;
      a.click();
      URL.revokeObjectURL(url);

      statusEl.textContent = '✅ Export terminé !';
    } catch (err) {
      statusEl.textContent = `❌ Erreur: ${err.message}`;
      console.error(err);
    } finally {
      startBtn.disabled = false;
      startBtn.textContent = '▶ Exporter';
    }
  }

  // ── Keyboard shortcuts ────────────────────────────────────────────────────

  _onKeyDown(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    switch (e.key) {
      case ' ':
        e.preventDefault();
        this._togglePlay();
        break;
      case 's': case 'S':
        this._splitAtPlayhead();
        break;
      case 'Delete': case 'Backspace':
        this._deleteSelected();
        break;
      case 'z': case 'Z':
        if (e.ctrlKey || e.metaKey) { e.shiftKey ? this._redo() : this._undo(); }
        break;
      case 'y': case 'Y':
        if (e.ctrlKey || e.metaKey) this._redo();
        break;
      case 'ArrowLeft':
        this._seekTo(this.timeline.currentTime - (e.shiftKey ? 10 : 1));
        break;
      case 'ArrowRight':
        this._seekTo(this.timeline.currentTime + (e.shiftKey ? 10 : 1));
        break;
    }
  }

  // ── Undo/Redo (stub — save/restore clips array snapshot) ─────────────────

  _saveHistory() {
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(JSON.parse(JSON.stringify(
      this.timeline.clips.map(c => ({ ...c, file: null }))
    )));
    this.historyIndex++;
  }

  _undo() { /* stub */ }
  _redo() { /* stub */ }

  // ── Display ───────────────────────────────────────────────────────────────

  _updateTimeDisplay() {
    this.timeCurrent.textContent = formatTime(this.timeline.currentTime);
    this.timeTotal.textContent = formatTime(this.timeline.totalDuration);
  }

  _updateDurationDisplay() {
    this.projectDuration.textContent = formatTime(this.timeline.totalDuration);
    this._updateTimeDisplay();
  }
}

// ── Boot ───────────────────────────────────────────────────────────────────

// Wait for FFmpeg.wasm CDN script to load
window.addEventListener('load', () => {
  if (typeof FFmpeg === 'undefined') {
    // Load FFmpeg UMD bundle dynamically
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@ffmpeg/ffmpeg@0.11.6/dist/ffmpeg.min.js';
    script.onload = () => { window._app = new App(); };
    script.onerror = () => {
      document.getElementById('loading-msg').textContent =
        'FFmpeg CDN indisponible — montage uniquement, export désactivé.';
      setTimeout(() => {
        document.getElementById('loading-overlay').style.display = 'none';
      }, 2000);
      window._app = new App();
    };
    document.head.appendChild(script);
  } else {
    window._app = new App();
  }
});
