import type {Arguments, CommandBuilder, CommandModule} from 'yargs';
import {SerialPort} from 'serialport';
import * as readline from "readline";

interface ICommandArguments extends Arguments {
  text?: boolean
  debug?: boolean
}

const commandBuilder: CommandBuilder<ICommandArguments, ICommandArguments> = (yargs) =>
  yargs.options({
    text: {alias: 't', type: 'boolean', default: false, description: "Text input (as opposed to space-delimited hexadecimal)"},
    debug: {alias: 'D', type: 'boolean', default: false, description: "Debugging on/off"},
  })


const commandCommand: CommandModule<ICommandArguments, ICommandArguments> = {
  handler: async (argv: Arguments<ICommandArguments>) => {
    const ports = await SerialPort.list();
    const textEnabled = argv.text;

    // Report available serial ports
    for(let i= 0; i < ports.length; i++) {
      console.log(`${i} - ${ports[i].path}`)
    }

    // Ask the user which serial port is for the Arduino
    const readinput = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    readinput.question("Please select a port: ", (port) => {
      if(/^-?\d+$/.test(port) && parseInt(port) > 0 && parseInt(port) < ports.length) {
        console.log(`You selected port ${ports[port].path}`)
        runSerial(ports, parseInt(port), readinput, argv);
      } else {
        console.log("You did not enter a valid selection!")
        readinput.close();
      }
    })
  },
  describe: 'A simple command',
  builder: commandBuilder,
  command: 'command'
}

const runSerial = (ports: any[], index: number, readinput: readline.Interface, argv: Arguments<ICommandArguments>) => {
  console.log("Opening serial port!");

  const gatherInput = () => {
    readinput.question("", (input) => {
      if(argv.debug) {
        console.log("Input: " + input);
      }

      if (input === "exit") {
        readinput.close();
        process.exit(0)
      } else {
        let buffer: string|any[]
        if(argv.text) {
          buffer = input;
        } else {
          buffer = []
          for (let s of input.split(" ")) {
            if (s.includes("0x")) {
              s = s.replace("0x", "");
              buffer.push(parseInt(s, 16))
            } else {
              buffer.push(parseInt(s))
            }
          }
        }

        if(argv.debug) {
          console.log("TX: " + buffer);
        }
        serialPort.write(buffer, (err) => {
          if(err) {
            return console.error("Error on write: ", err);
          }
        })

        gatherInput();
      }
    })
  }

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
    if(argv.debug) {
      console.log("RX: " + data.toString());
    }
  })

  gatherInput();
}

export = commandCommand;
