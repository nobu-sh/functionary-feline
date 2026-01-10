export class CircularBuffer<T extends any[]> {
  private _index: number = 0;

  public constructor(
    private readonly _items: T,
  ) {}

  public get index(): number {
    return this._index;
  }

  public get current(): T[number] {
    return this._items[this._index];
  }

  // Calling next first run will result in the second item being served.
  // This can be adjusted if needed. For current use case this is acceptable.
  public next(): T[number] {
    this._index = (this._index + 1) % this._items.length;
    return this.current;
  }
}
