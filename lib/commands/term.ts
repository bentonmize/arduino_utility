import type {Arguments, CommandBuilder, CommandModule} from 'yargs';
import * as readline from "readline";
import {ReadlineParser} from "serialport";
import {SerialConnection} from "../serial/SerialConnection";
import {ITermArguments} from "../utils/Interfaces";
import {startGithubPrChecker} from "../utils/githubPrChecker";
import {GitState} from "../utils/GitState";
import {selectSerialPort} from "../serial/serial";
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
    const serial = new SerialConnection(serialPort, argv.debug);
    const gitState = new GitState();

    setInterval(() => startGithubPrChecker(argv, serial, gitState), 5000);
    startOnCallChecker(argv, serial);

    const parser = serial.port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

    serial.port.on('data', (data: string) => {
      if(data) {
        if (argv.debug) {
          console.log(`RX: ${data}`);
        }
        // if (strData == "Initialized!") {
        //   console.log("Serial port initialized!");
        //   serial.setReady = true;
        // }
        if(!serial.isReady) {
          console.log("Serial port initialized!");
          serial.setReady = true;
        }
      }
    });

    const terminalRead = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    terminalRead.on('line', (input: string) => {
      if (input == "exit") {
        terminalRead.close();
        serialPort.close()
        process.exit(0);
      }
      serial.write(input);
    });
  },
  describe: 'A simple serial terminal',
  builder: termBuilder,
  command: 'term'
}

export = termCommand;
