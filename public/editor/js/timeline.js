/**
 * Timeline — Canvas-based multi-track timeline editor.
 *
 * Tracks: 0 = video, 1 = audio, 2 = text overlays.
 * Clips are rendered as coloured rectangles with drag-to-move and
 * edge-drag-to-trim handles. Playhead scrubs preview video.
 */

const COLORS = {
  ruler: '#1a1a1a',
  rulerTick: '#444',
  rulerText: '#888',
  trackBg: ['#1c2033', '#1a2a1a', '#221a2a'],
  trackBorder: '#2e2e2e',
  clipVideo: '#2563eb',
  clipAudio: '#16a34a',
  clipText: '#9333ea',
  clipSelected: '#ef4444',
  clipHandle: 'rgba(255,255,255,0.4)',
  playhead: '#ef4444',
  playheadShadow: 'rgba(239,68,68,0.3)',
};

const TRACK_H = 48;
const RULER_H = 28;
const HEADER_W = 80;
const HANDLE_W = 8;
const MIN_CLIP_W = 4; // px

class Timeline {
  constructor(canvasEl, scrollWrap) {
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext('2d');
    this.scrollWrap = scrollWrap;

    this.clips = [];          // { id, trackIndex, startTime, trimStart, trimEnd,
                              //   file, name, duration, type, speed, volume, opacity }
    this.selectedId = null;
    this.currentTime = 0;     // seconds
    this.totalDuration = 0;   // seconds
    this.pxPerSec = 100;      // zoom: pixels per second
    this.playing = false;

    this._drag = null;        // active drag state
    this._onSelect = null;    // callback(clip|null)
    this._onTimeChange = null;// callback(seconds)
    this._raf = null;

    this._bindEvents();
    this._startRenderLoop();
  }

  // ── Public API ─────────────────────────────────────────────────────────

  get trackCount() { return 3; }

  addClip(clip) {
    // Auto-place: find first free slot at the end of the track
    const trackClips = this.clips.filter(c => c.trackIndex === clip.trackIndex);
    if (clip.startTime === undefined) {
      const last = trackClips.reduce((max, c) => {
        const end = c.startTime + (c.trimEnd - c.trimStart) / (c.speed || 1);
        return end > max ? end : max;
      }, 0);
      clip.startTime = last;
    }
    this.clips.push(clip);
    this._recalcDuration();
    this.render();
  }

  removeClip(id) {
    this.clips = this.clips.filter(c => c.id !== id);
    if (this.selectedId === id) {
      this.selectedId = null;
      if (this._onSelect) this._onSelect(null);
    }
    this._recalcDuration();
    this.render();
  }

  splitClipAtTime(id, time) {
    const clip = this.clips.find(c => c.id === id);
    if (!clip) return null;
    const clipEnd = clip.startTime + (clip.trimEnd - clip.trimStart) / (clip.speed || 1);
    if (time <= clip.startTime || time >= clipEnd) return null;

    const splitOffset = (time - clip.startTime) * (clip.speed || 1);
    const rightClip = {
      ...clip,
      id: `${clip.id}_r_${Date.now()}`,
      startTime: time,
      trimStart: clip.trimStart + splitOffset,
    };
    clip.trimEnd = clip.trimStart + splitOffset;
    this.clips.push(rightClip);
    this._recalcDuration();
    this.render();
    return rightClip;
  }

  selectClip(id) {
    this.selectedId = id;
    if (this._onSelect) {
      this._onSelect(this.clips.find(c => c.id === id) || null);
    }
    this.render();
  }

  setCurrentTime(sec) {
    this.currentTime = Math.max(0, Math.min(sec, this.totalDuration));
    this._scrollToPlayhead();
    this.render();
  }

  setZoom(pxPerSec) {
    this.pxPerSec = Math.max(20, Math.min(500, pxPerSec));
    this._resize();
    this.render();
  }

  onSelect(cb) { this._onSelect = cb; }
  onTimeChange(cb) { this._onTimeChange = cb; }

  // ── Rendering ──────────────────────────────────────────────────────────

  render() {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;
    ctx.clearRect(0, 0, W, H);

    this._drawRuler();
    for (let t = 0; t < this.trackCount; t++) this._drawTrack(t);
    for (const clip of this.clips) this._drawClip(clip);
    this._drawPlayhead();
  }

  _drawRuler() {
    const ctx = this.ctx;
    const W = this.canvas.width;
    ctx.fillStyle = COLORS.ruler;
    ctx.fillRect(0, 0, W, RULER_H);

    const step = this._rulerStep();
    const start = 0;
    const end = W / this.pxPerSec;

    ctx.strokeStyle = COLORS.rulerTick;
    ctx.fillStyle = COLORS.rulerText;
    ctx.font = '10px monospace';
    ctx.lineWidth = 1;

    for (let t = 0; t <= end + step; t += step) {
      const x = HEADER_W + t * this.pxPerSec;
      if (x < HEADER_W || x > W) continue;

      const isMain = Math.abs(t % (step * 5)) < 0.001 || t === 0;
      const tickH = isMain ? 12 : 6;
      ctx.beginPath();
      ctx.moveTo(x, RULER_H - tickH);
      ctx.lineTo(x, RULER_H);
      ctx.stroke();

      if (isMain) {
        ctx.fillText(this._formatTime(t), x + 3, RULER_H - 14);
      }
    }
  }

  _drawTrack(trackIndex) {
    const ctx = this.ctx;
    const y = RULER_H + trackIndex * TRACK_H;
    const W = this.canvas.width;
    ctx.fillStyle = COLORS.trackBg[trackIndex] || '#1a1a1a';
    ctx.fillRect(HEADER_W, y, W - HEADER_W, TRACK_H);
    ctx.strokeStyle = COLORS.trackBorder;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(HEADER_W, y + TRACK_H);
    ctx.lineTo(W, y + TRACK_H);
    ctx.stroke();
  }

  _drawClip(clip) {
    const ctx = this.ctx;
    const selected = clip.id === this.selectedId;
    const clipDuration = (clip.trimEnd - clip.trimStart) / (clip.speed || 1);
    const x = HEADER_W + clip.startTime * this.pxPerSec;
    const w = Math.max(MIN_CLIP_W, clipDuration * this.pxPerSec);
    const y = RULER_H + clip.trackIndex * TRACK_H + 4;
    const h = TRACK_H - 8;
    const r = 4;

    // Clip background
    const baseColor = clip.trackIndex === 0 ? COLORS.clipVideo
      : clip.trackIndex === 1 ? COLORS.clipAudio
      : COLORS.clipText;
    ctx.fillStyle = selected ? COLORS.clipSelected : baseColor;

    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();

    // Clip name
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = 'bold 11px sans-serif';
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.clip();
    ctx.fillText(clip.name, x + 6, y + h / 2 + 4);
    ctx.restore();

    // Duration label
    if (w > 60) {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '10px monospace';
      ctx.fillText(this._formatTime(clipDuration), x + w - 44, y + h / 2 + 4);
    }

    // Selection border
    if (selected) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      ctx.stroke();
    }

    // Trim handles (only for selected)
    if (selected && w > 20) {
      ctx.fillStyle = COLORS.clipHandle;
      ctx.fillRect(x, y, HANDLE_W, h);
      ctx.fillRect(x + w - HANDLE_W, y, HANDLE_W, h);
    }
  }

  _drawPlayhead() {
    const ctx = this.ctx;
    const x = HEADER_W + this.currentTime * this.pxPerSec;
    const H = this.canvas.height;

    ctx.strokeStyle = COLORS.playhead;
    ctx.lineWidth = 2;
    ctx.shadowColor = COLORS.playheadShadow;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Diamond head
    ctx.fillStyle = COLORS.playhead;
    ctx.beginPath();
    ctx.moveTo(x - 6, 0);
    ctx.lineTo(x + 6, 0);
    ctx.lineTo(x + 6, 10);
    ctx.lineTo(x, 18);
    ctx.lineTo(x - 6, 10);
    ctx.closePath();
    ctx.fill();
  }

  // ── Event handling ─────────────────────────────────────────────────────

  _bindEvents() {
    const canvas = this.canvas;
    canvas.addEventListener('mousedown', e => this._onMouseDown(e));
    canvas.addEventListener('mousemove', e => this._onMouseMove(e));
    canvas.addEventListener('mouseup', e => this._onMouseUp(e));
    canvas.addEventListener('mouseleave', () => this._onMouseUp(null));
    canvas.addEventListener('dblclick', e => this._onDblClick(e));
    canvas.addEventListener('wheel', e => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        // Zoom
        const factor = e.deltaY < 0 ? 1.15 : 0.87;
        this.setZoom(this.pxPerSec * factor);
      } else {
        this.scrollWrap.scrollLeft += e.deltaX || e.deltaY;
      }
    }, { passive: false });
  }

  _mousePos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scrollX = this.scrollWrap.scrollLeft;
    return {
      x: e.clientX - rect.left + scrollX,
      y: e.clientY - rect.top,
    };
  }

  _hitTest(mx, my) {
    for (const clip of [...this.clips].reverse()) {
      const clipDuration = (clip.trimEnd - clip.trimStart) / (clip.speed || 1);
      const cx = HEADER_W + clip.startTime * this.pxPerSec;
      const cw = Math.max(MIN_CLIP_W, clipDuration * this.pxPerSec);
      const cy = RULER_H + clip.trackIndex * TRACK_H + 4;
      const ch = TRACK_H - 8;

      if (my < cy || my > cy + ch) continue;
      if (mx < cx || mx > cx + cw) continue;

      if (mx < cx + HANDLE_W && cw > 20) return { clip, zone: 'trim-left' };
      if (mx > cx + cw - HANDLE_W && cw > 20) return { clip, zone: 'trim-right' };
      return { clip, zone: 'move' };
    }
    return null;
  }

  _onMouseDown(e) {
    const { x, y } = this._mousePos(e);

    // Click on ruler → seek
    if (y < RULER_H) {
      const time = (x - HEADER_W) / this.pxPerSec;
      if (time >= 0) {
        this.currentTime = Math.min(time, this.totalDuration);
        if (this._onTimeChange) this._onTimeChange(this.currentTime);
        this.render();
      }
      return;
    }

    const hit = this._hitTest(x, y);
    if (!hit) {
      this.selectedId = null;
      if (this._onSelect) this._onSelect(null);
      this.render();
      return;
    }

    this.selectClip(hit.clip.id);
    const clipDuration = (hit.clip.trimEnd - hit.clip.trimStart) / (hit.clip.speed || 1);

    this._drag = {
      zone: hit.zone,
      clip: hit.clip,
      startX: x,
      origStart: hit.clip.startTime,
      origTrimStart: hit.clip.trimStart,
      origTrimEnd: hit.clip.trimEnd,
      origDuration: clipDuration,
    };
  }

  _onMouseMove(e) {
    if (!this._drag) return;
    const { x } = this._mousePos(e);
    const dx = x - this._drag.startX;
    const dt = dx / this.pxPerSec;
    const d = this._drag;
    const clip = d.clip;

    if (d.zone === 'move') {
      clip.startTime = Math.max(0, d.origStart + dt);
    } else if (d.zone === 'trim-left') {
      const newTrimStart = d.origTrimStart + dt * (clip.speed || 1);
      if (newTrimStart >= 0 && newTrimStart < d.origTrimEnd - 0.1) {
        clip.trimStart = newTrimStart;
        clip.startTime = Math.max(0, d.origStart + dt);
      }
    } else if (d.zone === 'trim-right') {
      const newTrimEnd = d.origTrimEnd + dt * (clip.speed || 1);
      if (newTrimEnd > d.origTrimStart + 0.1 && newTrimEnd <= clip.duration) {
        clip.trimEnd = newTrimEnd;
      }
    }

    this._recalcDuration();
    this.render();
  }

  _onMouseUp(_e) {
    this._drag = null;
  }

  _onDblClick(e) {
    const { x, y } = this._mousePos(e);
    // Double-click ruler → seek
    if (y < RULER_H) {
      const time = (x - HEADER_W) / this.pxPerSec;
      if (time >= 0) {
        this.currentTime = Math.min(time, this.totalDuration);
        if (this._onTimeChange) this._onTimeChange(this.currentTime);
      }
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────

  _recalcDuration() {
    this.totalDuration = this.clips.reduce((max, c) => {
      const end = c.startTime + (c.trimEnd - c.trimStart) / (c.speed || 1);
      return end > max ? end : max;
    }, 0);
  }

  _rulerStep() {
    if (this.pxPerSec >= 200) return 0.5;
    if (this.pxPerSec >= 80) return 1;
    if (this.pxPerSec >= 30) return 5;
    if (this.pxPerSec >= 10) return 10;
    return 30;
  }

  _formatTime(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }

  _scrollToPlayhead() {
    const px = HEADER_W + this.currentTime * this.pxPerSec;
    const wrap = this.scrollWrap;
    const right = wrap.scrollLeft + wrap.clientWidth;
    if (px > right - 60) wrap.scrollLeft = px - wrap.clientWidth / 2;
    if (px < wrap.scrollLeft + 60) wrap.scrollLeft = Math.max(0, px - 60);
  }

  _resize() {
    const wrap = this.scrollWrap;
    const W = Math.max(wrap.clientWidth, HEADER_W + (this.totalDuration + 10) * this.pxPerSec);
    const H = RULER_H + this.trackCount * TRACK_H;
    this.canvas.width = W;
    this.canvas.height = H;
  }

  _startRenderLoop() {
    const loop = () => {
      this._raf = requestAnimationFrame(loop);
      if (this.playing) this.render();
    };
    this._raf = requestAnimationFrame(loop);
  }
}

window.Timeline = Timeline;
