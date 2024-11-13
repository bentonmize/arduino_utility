import type {Arguments, CommandBuilder, CommandModule} from 'yargs';
import * as readline from "readline";
import {selectSerialPort, serialWrite} from "../serial/serial";
import {parseInput} from "../serial/parser";

interface ITermArguments extends Arguments {
  manual?: boolean
  text?: boolean
  debug?: boolean
}

const termBuilder: CommandBuilder = (yargs) =>
  yargs.options({
    manual: {alias: 'm', type: 'boolean', default: false},
    text: {alias: 't', type: 'boolean', default: true, description: "Text input (as opposed to space-delimited hexadecimal)"},
    debug: {alias: 'D', type: 'boolean', default: false, description: "Debugging on/off"},
  })

const termCommand: CommandModule = {
  handler: async (argv: Arguments<ITermArguments>) => {
    const serialPort = await selectSerialPort(argv.manual, argv.debug)

    const readinput = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    const gatherInput = () => {
      readinput.question("", async (input) => {
        if(argv.debug) {
          console.log("Input: " + input);
        }

        if (input === "exit") {
          readinput.close();
          process.exit(0)
        } else {
          // Send data over serial
          const txData = parseInput(input, argv.text, argv.debug);
          serialWrite(serialPort, txData);
          gatherInput();
        }
      })
    }

    gatherInput();
  },
  describe: 'A simple serial terminal',
  builder: termBuilder,
  command: 'term'
}

export = termCommand;
