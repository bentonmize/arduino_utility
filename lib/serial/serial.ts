import {SerialPort} from "serialport";

export const serialOpen = (ports: any[], index: number, debug:boolean) => {
  console.log("Opening serial port!");

  const serialPort = new SerialPort({
    path: ports[index].path,
    baudRate: 115200,
    autoOpen: false
  })

  serialPort.open((err) => {
    if(err) {
      return console.error("Error opening port: ", err.message);
    }
  })

  serialPort.on('data', (data) => {
    if(debug) {
      console.log("RX: " + data.toString());
    }
  })

  return serialPort;
}

export const serialWrite = (port: SerialPort, data: string|any[], debug = false) => {
  if(debug) {
    console.log("TX: " + data.toString());
  }
  port.write(data, (err) => {
    if(err) {
      return console.error("Error on write: ", err);
    }
  })
}
