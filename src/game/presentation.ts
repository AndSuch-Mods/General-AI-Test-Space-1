/** UI waits for the rendered pose, not an assumed animation duration. */
export class RoomPresentation {
  private states = new Map<string, number>();
  private listeners = new Set<() => void>();
  update(id: string, amount: number) { this.states.set(id, amount); for (const listener of this.listeners) listener(); }
  clear() { this.states.clear(); }
  wait(id: string, open: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => { this.listeners.delete(check); reject(Error('The room animation paused. Try the action again.')); }, 5000);
      const check = () => {
        const value = this.states.get(id);
        if (value !== undefined && (open ? value >= .999 : value <= .001)) {
          clearTimeout(timeout); this.listeners.delete(check); resolve();
        }
      };
      this.listeners.add(check); check();
    });
  }
}
