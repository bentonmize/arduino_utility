import {SerialPort} from "serialport";
import readline from "readline";

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

export const selectSerialPort = async (manual: boolean, debug: boolean): Promise<SerialPort> => {
  const ports = await SerialPort.list();

  let serialPort = null;
  if(manual) {
    // Report available serial ports
    for(let i= 0; i < ports.length; i++) {
      console.log(`${i} - ${ports[i].path}`)
    }

    // Ask the user which serial port is for the Arduino
    const readinput = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    readinput.question("Please select a port: ", async (port) => {
      if(/^-?\d+$/.test(port) && parseInt(port) > 0 && parseInt(port) < ports.length) {
        console.log(`You selected port ${ports[port].path}`)

        const serialPort = serialOpen(ports, parseInt(port), debug);

        readinput.close();
        return serialPort
      } else {
        console.log("You did not enter a valid selection!")
        readinput.close();
        throw Error("Invalid port!");
      }
    })
  } else {
    let selectedIndex = -1;
    for (let p of ports) {
      if (p.path.includes("usbmodem")) {
        selectedIndex = ports.indexOf(p);
      }
    }
    serialPort = serialOpen(ports, selectedIndex, debug);
    return serialPort;
  }
}
