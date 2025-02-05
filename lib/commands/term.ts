import type {Arguments, CommandBuilder, CommandModule} from 'yargs';
import * as readline from "readline";
import {selectSerialPort, serialWrite} from "../serial/serial";
import {parseInput} from "../serial/parser";
import {ReadlineParser} from "serialport";
import {State} from "../serial/state";
import {ITermArguments} from "../utils/Interfaces";
import {startOnCallChecker} from "../utils/onCallCheck";

const termBuilder: CommandBuilder = (yargs) =>
  yargs.options({
    manual: {alias: 'm', type: 'boolean', default: false},
    text: {alias: 't', type: 'boolean', default: true, description: "Text input (as opposed to space-delimited hexadecimal)"},
    debug: {alias: 'D', type: 'boolean', default: false, description: "Debugging on/off"},
  })

const termCommand: CommandModule = {
  handler: async (argv: Arguments<ITermArguments>) => {
    const serialPort = await selectSerialPort(argv.manual, argv.debug)
    const serial = new State(serialPort);

    startOnCallChecker(argv, serial);

    const parser = serial.port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

    parser.on('data', (data: string) => {
      if(argv.debug) {
        console.log(`RX: ${data}`);
      }
      if(data == "Initialized!") {
        serial.setReady = true;
      } else if (data == "exit") {
        terminalRead.close();
        serialPort.close()
        process.exit(0);
      }
    });

    const terminalRead = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    terminalRead.on('line', (input: string) => {
      const txData = parseInput(input, argv.text, argv.debug);
      serialWrite(serialPort, txData);
    });
  },
  describe: 'A simple serial terminal',
  builder: termBuilder,
  command: 'term'
}

export = termCommand;
