
const listener: Function[] = [];

export function addConfigChangeListener(fn: Function) {
  listener.push(fn);
}

export function removeConfigChangeListener(fn: Function) {
  const idx = listener.indexOf(fn);
  if (idx >= 0) {
    listener.splice(idx, 1);
  }
}

export async function notifyConfigChange() {
  for (const fn of listener) {
    await fn();
  }
}
