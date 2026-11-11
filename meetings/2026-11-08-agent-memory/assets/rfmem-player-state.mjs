// DOM-independent playback state; callers own the diagram and focus.
export function createPlayer({count, interval = 4000, reduced = false, onChange = () => {}, schedule = setTimeout, cancel = clearTimeout}) {
  if (!Number.isInteger(count) || count < 1) throw new Error('count must be positive');
  let index = 0, playing = false, pending = null, delay = interval;
  const state = () => ({index, playing, interval: delay, count});
  const clear = () => { if (pending !== null) cancel(pending); pending = null; };
  const emit = () => onChange(state());
  function arm() {
    clear();
    if (!playing) return;
    pending = schedule(() => {
      pending = null;
      index = Math.min(count - 1, index + 1);
      if (index === count - 1) playing = false;
      emit();
      arm();
    }, delay);
  }
  const player = {
    state,
    go(value) {
      if (!Number.isFinite(value)) return;
      clear(); playing = false;
      index = Math.max(0, Math.min(count - 1, Math.trunc(value)));
      emit();
    },
    stop() { clear(); playing = false; emit(); },
    play() {
      if (reduced || count === 1 || playing) return;
      if (index === count - 1) index = 0;
      playing = true; emit(); arm();
    },
    toggle() { if (playing) player.stop(); else player.play(); },
    speed(value) {
      if (!Number.isFinite(value) || value < 1000 || value > 15000) return;
      delay = value; emit(); arm();
    },
    reduced(value) { reduced = value; if (value) player.stop(); }
  };
  return player;
}
