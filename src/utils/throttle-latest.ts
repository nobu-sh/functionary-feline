export function throttleLatest<T extends (...args: any[]) => void>(
  func: T,
  wait: number,
): T {
  let lastExec = 0;
  let timeout: NodeJS.Timeout | null = null;
  let latestArgs: Parameters<T> | null = null;

  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now();
    latestArgs = args;

    const remaining = wait - (now - lastExec);

    if (remaining <= 0) {
      // Enough time passed — execute immediately
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }

      lastExec = now;
      func.apply(this, latestArgs);
      latestArgs = null;
    }
    else if (!timeout) {
      // Schedule trailing execution
      timeout = setTimeout(() => {
        lastExec = Date.now();
        timeout = null;

        if (latestArgs) {
          func.apply(this, latestArgs);
          latestArgs = null;
        }
      }, remaining);
    }
  } as T;
}
