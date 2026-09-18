import QRCode from 'qrcode';
import jsQR from 'jsqr';

// Rotating short frames remain readable on a phone. Never encode a huge SDP into one dense QR.
export function showPairingQR(canvas: HTMLCanvasElement, label: HTMLElement, code: string) {
  const size = 500;
  const total = Math.ceil(code.length / size);
  const key = crypto.randomUUID().slice(0, 8);
  let index = 0;
  const draw = async () => {
    const frame = `TQ1|${key}|${index}|${total}|${code.slice(index * size, (index + 1) * size)}`;
    await QRCode.toCanvas(canvas, frame, { width: 256, margin: 2, errorCorrectionLevel: 'M' });
    label.textContent = `Pairing QR · frame ${index + 1} of ${total}. Keep the camera pointed here.`;
    index = (index + 1) % total;
  };
  void draw();
  const timer = setInterval(() => { void draw(); }, 1100);
  return () => clearInterval(timer);
}
export class QRAssembler {
  private key = '';
  private total = 0;
  private frames = new Map<number, string>();
  get progress() { return `${this.frames.size}/${this.total || '?'}`; }
  add(data: string) {
    const match = /^TQ1\|([a-f0-9-]{8})\|(\d+)\|(\d+)\|([\s\S]*)$/.exec(data);
    if (!match) return;
    const [, key, rawIndex, rawTotal, content] = match;
    const total = Number(rawTotal), index = Number(rawIndex);
    if (total < 1 || total > 60 || index >= total || content.length > 500) return;
    if (this.key !== key) { this.key = key; this.frames.clear(); this.total = total; }
    if (total !== this.total) return;
    this.frames.set(index, content);
    if (this.frames.size === total) return Array.from({ length: total }, (_, n) => this.frames.get(n)).join('');
  }
}
export async function scanPairing(video: HTMLVideoElement, progress: HTMLElement, complete: (code: string) => void) {
  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 } }, audio: false });
  video.srcObject = stream;
  video.muted = true; video.playsInline = true;
  await video.play();
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true })!;
  const frames = new QRAssembler();
  const stop = () => { clearInterval(timer); stream.getTracks().forEach(track => track.stop()); video.srcObject = null; };
  const timer = setInterval(() => {
    if (!video.videoWidth) return;
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    const data = context.getImageData(0, 0, canvas.width, canvas.height);
    const result = jsQR(data.data, data.width, data.height);
    if (result) {
      const code = frames.add(result.data);
      progress.textContent = `Reading pairing QR · ${frames.progress} frames`;
      if (code) { stop(); complete(code); }
    }
  }, 180);
  return stop;
}
