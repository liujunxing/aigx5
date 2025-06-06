import mitt, { Emitter, Handler } from "mitt";


type KeyType = string;

// Custom Event Emitter class using mitt
export class CustomEventEmitter<EventsType extends Record<KeyType, unknown>> {
  private _emitter: Emitter<EventsType>;

  constructor() {
    this._emitter = mitt();
  }

  public on<Key extends keyof EventsType>(type: Key, handler: Handler<EventsType[Key]>): void {
    this._emitter.on(type, handler);
  }

  public off<Key extends keyof EventsType>(type: Key, handler?: Handler<EventsType[Key]>): void {
    this._emitter.off(type, handler);
  }

  public emit<Key extends keyof EventsType>(type: Key, event: EventsType[Key]): void {
    this._emitter.emit(type, event);
  }
}
