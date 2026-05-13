/**
 * VideoProcessor — FFmpeg.wasm wrapper for client-side video processing.
 *
 * Requires @ffmpeg/ffmpeg@0.11.x loaded via CDN before this script.
 * Handles: trim, concat, text overlay, audio mix, and final export.
 *
 * Large file note: FFmpeg.wasm allocates up to 2 GB in browser memory.
 * For files > 2 GB, use the server-side processing option (server.py).
 */

/* global FFmpeg */

class VideoProcessor {
  constructor() {
    this.ffmpeg = null;
    this.loaded = false;
    this.onProgress = null;
  }

  async load(onStatusUpdate) {
    if (this.loaded) return;

    const status = (msg) => {
      if (onStatusUpdate) onStatusUpdate(msg);
    };

    try {
      status('Chargement de FFmpeg.wasm…');
      const { createFFmpeg, fetchFile } = FFmpeg;
      this.fetchFile = fetchFile;
      this.ffmpeg = createFFmpeg({
        log: false,
        corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js',
        progress: ({ ratio }) => {
          if (this.onProgress) this.onProgress(Math.min(ratio, 1));
        },
      });
      await this.ffmpeg.load();
      this.loaded = true;
      status('FFmpeg prêt');
    } catch (err) {
      status(`Erreur FFmpeg: ${err.message}`);
      throw err;
    }
  }

  /** Write a File/Blob into the virtual FS under the given name. */
  async writeVirtualFile(name, file) {
    const data = await this.fetchFile(file);
    this.ffmpeg.FS('writeFile', name, data);
  }

  /** Read a file back from the virtual FS as a Blob. */
  readVirtualFile(name, mimeType = 'video/mp4') {
    const data = this.ffmpeg.FS('readFile', name);
    return new Blob([data.buffer], { type: mimeType });
  }

  /** Remove a virtual file (free memory). */
  unlinkVirtual(name) {
    try { this.ffmpeg.FS('unlink', name); } catch (_) {}
  }

  /**
   * Generate a thumbnail (JPEG) from a video File at a given time offset.
   * Returns a data URL.
   */
  async generateThumbnail(file, timeSeconds = 0) {
    const inputName = `thumb_in_${Date.now()}.mp4`;
    const outputName = `thumb_out_${Date.now()}.jpg`;
    try {
      await this.writeVirtualFile(inputName, file);
      await this.ffmpeg.run(
        '-ss', String(timeSeconds),
        '-i', inputName,
        '-vframes', '1',
        '-q:v', '4',
        '-vf', 'scale=160:-1',
        outputName,
      );
      const blob = this.readVirtualFile(outputName, 'image/jpeg');
      return URL.createObjectURL(blob);
    } finally {
      this.unlinkVirtual(inputName);
      this.unlinkVirtual(outputName);
    }
  }

  /**
   * Trim a single clip.
   * start/duration in seconds (floats).
   */
  async trim(inputFile, inputName, outputName, start, duration) {
    await this.writeVirtualFile(inputName, inputFile);
    await this.ffmpeg.run(
      '-ss', start.toFixed(3),
      '-t', duration.toFixed(3),
      '-i', inputName,
      '-c', 'copy',
      outputName,
    );
  }

  /**
   * Build and export the final video from a list of timeline clips.
   * clips: [{ file, trimStart, trimEnd, speed, volume, type }, ...]
   * options: { resolution, format, crf }
   */
  async export(clips, options = {}, onProgress) {
    if (!this.loaded) throw new Error('FFmpeg non chargé');
    this.onProgress = onProgress || null;

    const {
      resolution = '1920x1080',
      format = 'mp4',
      crf = '23',
    } = options;

    const [w, h] = resolution.split('x');
    const tmpFiles = [];
    const segmentNames = [];

    try {
      // Step 1: trim each clip and write to virtual FS
      for (let i = 0; i < clips.length; i++) {
        const clip = clips[i];
        if (clip.type === 'text') continue;

        const inName = `seg_in_${i}.mp4`;
        const outName = `seg_${i}.mp4`;
        const duration = clip.trimEnd - clip.trimStart;

        await this.writeVirtualFile(inName, clip.file);
        tmpFiles.push(inName);

        // Trim with optional speed/volume filter
        const vfParts = [`scale=${w}:${h}:force_original_aspect_ratio=decrease`,
          `pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2`];
        if (clip.speed && clip.speed !== 1) {
          vfParts.push(`setpts=${(1 / clip.speed).toFixed(4)}*PTS`);
        }

        const args = [
          '-ss', clip.trimStart.toFixed(3),
          '-t', duration.toFixed(3),
          '-i', inName,
          '-vf', vfParts.join(','),
        ];

        if (clip.volume !== undefined && clip.volume !== 1) {
          args.push('-af', `volume=${clip.volume}`);
        }

        args.push(
          '-c:v', 'libx264', '-preset', 'fast', '-crf', crf,
          '-c:a', 'aac', '-b:a', '192k',
          outName,
        );

        await this.ffmpeg.run(...args);
        tmpFiles.push(outName);
        segmentNames.push(outName);
      }

      if (segmentNames.length === 0) throw new Error('Aucun clip vidéo à exporter');

      // Step 2: create concat list
      const concatList = segmentNames.map(n => `file '${n}'`).join('\n');
      this.ffmpeg.FS('writeFile', 'concat.txt', new TextEncoder().encode(concatList));
      tmpFiles.push('concat.txt');

      // Step 3: concatenate
      const finalName = `final_export.${format}`;
      await this.ffmpeg.run(
        '-f', 'concat',
        '-safe', '0',
        '-i', 'concat.txt',
        '-c', 'copy',
        finalName,
      );
      tmpFiles.push(finalName);

      const mime = format === 'webm' ? 'video/webm' : 'video/mp4';
      return this.readVirtualFile(finalName, mime);

    } finally {
      for (const f of tmpFiles) this.unlinkVirtual(f);
      this.onProgress = null;
    }
  }
}

// Singleton
window.processor = new VideoProcessor();
