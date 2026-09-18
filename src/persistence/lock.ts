/** Keep one browser tab in charge of a world. Releasing/closing it permits another tab. */
export async function acquireWorldLock(worldId: string): Promise<() => void> {
  if (!navigator.locks) throw Error('This browser cannot safely own a world. Update Safari or use a current browser.');
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  return new Promise((resolve, reject) => {
    void navigator.locks.request(`twilight-world-${worldId}`, { ifAvailable: true }, async lock => {
      if (!lock) { reject(Error('This world is already open in another tab. Close it there first.')); return; }
      resolve(release);
      await held;
    }).catch(reject);
  });
}
