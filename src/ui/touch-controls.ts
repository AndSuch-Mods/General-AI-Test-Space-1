export interface TouchControls { stop(): void; destroy(): void }

/** A floating stick on the left, a release-to-interact gesture on the right. */
export function mountTouchControls(surface: HTMLElement, move: (dx: number, dy: number) => void,
  interact: () => void, blocked: () => boolean): TouchControls {
  const stick = surface.querySelector<HTMLElement>('#thumbstick')!;
  const knob = surface.querySelector<HTMLElement>('#thumbstick-knob')!;
  const abort = new AbortController();
  let movement: { id: number; x: number; y: number } | undefined;
  let action: { id: number; x: number; y: number; started: number } | undefined;
  let direction = { x: 0, y: 0 };
  let timer: ReturnType<typeof setInterval> | undefined;
  const release = (id: number) => { if (surface.hasPointerCapture(id)) surface.releasePointerCapture(id); };
  const stop = () => {
    const ids = [movement?.id, action?.id]; movement = undefined; action = undefined;
    direction = { x: 0, y: 0 }; clearInterval(timer); timer = undefined; stick.hidden = true;
    ids.forEach(id => { if (id !== undefined) release(id); });
  };
  const tick = () => { if (blocked()) { stop(); return; } if (direction.x || direction.y) move(direction.x, direction.y); };
  const update = (event: PointerEvent) => {
    if (!movement || event.pointerId !== movement.id) return;
    const dx = event.clientX - movement.x, dy = event.clientY - movement.y;
    const length = Math.hypot(dx, dy), radius = 35;
    const scale = Math.min(1, radius / Math.max(1, length));
    knob.style.transform = `translate(${Math.round(dx * scale)}px, ${Math.round(dy * scale)}px)`;
    direction = length < 8 ? { x: 0, y: 0 } : { x: dx / length, y: dy / length };
  };
  surface.addEventListener('pointerdown', event => {
    if (blocked() || event.button !== 0) return;
    event.preventDefault(); const bounds = surface.getBoundingClientRect();
    if (event.clientX < bounds.left + bounds.width * .5) {
      if (movement) return;
      movement = { id: event.pointerId, x: event.clientX, y: event.clientY };
      stick.style.left = `${event.clientX - bounds.left}px`; stick.style.top = `${event.clientY - bounds.top}px`;
      knob.style.transform = 'translate(0, 0)'; stick.hidden = false;
      timer = setInterval(tick, 110);
    } else {
      if (action) return;
      action = { id: event.pointerId, x: event.clientX, y: event.clientY, started: performance.now() };
    }
    surface.setPointerCapture(event.pointerId);
  }, { signal: abort.signal });
  surface.addEventListener('pointermove', update, { signal: abort.signal });
  surface.addEventListener('pointerup', event => {
    if (movement?.id === event.pointerId) {
      movement = undefined; direction = { x: 0, y: 0 }; clearInterval(timer); timer = undefined; stick.hidden = true;
    }
    const tap = action;
    if (tap?.id === event.pointerId) {
      action = undefined;
      if (!blocked() && performance.now() - tap.started < 500 && Math.hypot(event.clientX - tap.x, event.clientY - tap.y) < 18) interact();
    }
    release(event.pointerId);
  }, { signal: abort.signal });
  for (const type of ['pointercancel', 'lostpointercapture']) surface.addEventListener(type, event => {
    const id = (event as PointerEvent).pointerId;
    if (movement?.id === id || action?.id === id) stop();
  }, { signal: abort.signal });
  for (const type of ['blur', 'pagehide', 'resize']) window.addEventListener(type, stop, { signal: abort.signal });
  document.addEventListener('visibilitychange', stop, { signal: abort.signal });
  return { stop, destroy() { stop(); abort.abort(); } };
}
