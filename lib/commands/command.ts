import type {Arguments, CommandBuilder, CommandModule} from 'yargs';
import {SerialPort} from 'serialport';
import * as readline from "readline";
import {serialOpen, serialWrite} from "../serial/serial";
import {parseInput} from "../serial/parser";

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

        const serialPort = serialOpen(ports, parseInt(port), argv.debug);

        const gatherInput = () => {
          readinput.question("", (input) => {
            if(argv.debug) {
              console.log("Input: " + input);
            }

            if (input === "exit") {
              readinput.close();
              process.exit(0)
            } else {
              const txData = parseInput(input, argv.text, argv.debug);
              serialWrite(serialPort, txData);

              gatherInput();
            }
          })
        }

        gatherInput();
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

export = commandCommand;
