import { RESIDENT_DISPLAY_HEIGHT, RESIDENT_DISPLAY_WIDTH, type ResidentFacing } from '../game/art/resident-atlas';
import { residentFrame } from '../game/art/resident-animation';
import { residentCanvas, residentTextureKey, type ResidentAppearance } from '../game/art/resident-appearance';
import { DEFAULT_LOOK, type CharacterLook } from '../game/art/character-look';

export type ResidentPreview = { setAppearance(value: ResidentAppearance): void; setLook(value: CharacterLook): void; destroy(): void };
/** Paints the same garment-colored frames used in the room, with a quiet turning walk. */
export async function mountResidentPreview(canvas: HTMLCanvasElement, initialAppearance: ResidentAppearance, initialLook: CharacterLook = DEFAULT_LOOK): Promise<ResidentPreview> {
  canvas.width = RESIDENT_DISPLAY_WIDTH; canvas.height = RESIDENT_DISPLAY_HEIGHT;
  canvas.style.imageRendering = 'pixelated';
  canvas.setAttribute('role', 'img');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not draw the resident preview.');
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  let appearance = initialAppearance, destroyed = false, request = 0, lastFrame = '';
  let look = { ...initialLook };
  const started = performance.now();
  const facings: readonly ResidentFacing[] = ['down', 'right', 'up', 'left'];
  const draw = (now: number) => {
    if (destroyed) return;
    const reduced = media.matches || document.documentElement.classList.contains('reduced-motion');
    // The first rAF timestamp can predate the synchronous mount within the same frame.
    const elapsed = reduced ? 0 : Math.max(0, now - started);
    const facing = facings[Math.floor(elapsed / 3600) % facings.length];
    const walkingTime = Math.max(0, elapsed % 3600 - 1800);
    const pose = residentFrame(facing, walkingTime / 125 * 12, walkingTime > 0);
    const stamp = `${residentTextureKey(appearance, look)}:${pose.frame}:${pose.flipX}`;
    if (stamp !== lastFrame) {
      context.imageSmoothingEnabled = false;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.save();
      if (pose.flipX) { context.translate(canvas.width, 0); context.scale(-1, 1); }
      context.drawImage(residentCanvas(null, pose.frame, appearance, look), 0, 0, canvas.width, canvas.height);
      context.restore();
      canvas.dataset.appearance = appearance; canvas.dataset.frame = pose.frame; canvas.dataset.flipX = String(pose.flipX);
      canvas.dataset.characterLook = JSON.stringify(look);
      canvas.setAttribute('aria-label', `${look.body === 'female' ? 'Female' : 'Male'} resident, ${look.skinTone} skin, ${look.hairStyle} ${look.hairColor} hair, wearing ${appearance} ${look.outfit}`);
      lastFrame = stamp;
    }
    if (!reduced) request = requestAnimationFrame(draw);
  };
  const redraw = () => { cancelAnimationFrame(request); lastFrame = ''; draw(performance.now()); };
  media.addEventListener('change', redraw);
  const motionSetting = new MutationObserver(redraw);
  motionSetting.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  draw(started);
  return {
    setAppearance(value) { if (!destroyed) { appearance = value; redraw(); } },
    setLook(value) { if (!destroyed) { look = { ...value }; redraw(); } },
    destroy() { destroyed = true; cancelAnimationFrame(request); media.removeEventListener('change', redraw); motionSetting.disconnect(); },
  };
}
