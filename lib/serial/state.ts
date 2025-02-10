import {SerialPort} from "serialport";

export class State {
  private _ready: boolean
  private _port: SerialPort

  constructor(serialPort: SerialPort) {
      this._ready = false;
      this._port = serialPort
  }

  get isReady() {
      return this._ready
  }

  set setReady(value: boolean) {
      this._ready = value
  }

  get port() {
      return this._port
  }
}
