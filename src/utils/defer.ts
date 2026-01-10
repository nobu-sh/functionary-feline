export type DeferredPromiseResolve<T> = (value: T | PromiseLike<T>) => void;
export type DeferredPromiseReject = (reason?: any) => void;

export interface DeferredPromise<T> {
  readonly promise: Promise<T>;
  readonly resolve: DeferredPromiseResolve<T>;
  readonly reject: DeferredPromiseReject;
}

export type DeferredPromiseInit<T> = (resolve: DeferredPromiseResolve<T>, reject: DeferredPromiseReject) => void;
export function defer<T>(): DeferredPromise<T>;
export function defer<T>(init: DeferredPromiseInit<T>): DeferredPromise<T>;
export function defer<T>(init?: DeferredPromiseInit<T>): DeferredPromise<T> {
  let resolve!: DeferredPromiseResolve<T>;
  let reject!: DeferredPromiseReject;
  const promise = new Promise<T>((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });

  init?.(resolve, reject);

  return Object.freeze({ promise, resolve, reject });
}
