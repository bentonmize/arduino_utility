import {spawn} from "node:child_process";
import {serialWrite} from "../serial/serial";
import {parseInput} from "../serial/parser";
import {Arguments} from "yargs";
import {State} from "../serial/state";
import {ITermArguments} from "./Interfaces";

export const startOnCallChecker = (
  argv: Arguments<ITermArguments>,
  serial: State,
) => {
  if(argv.debug) {
    console.log("Starting on-call checker");
  }
  let onCall = false;
  const camCheckScript = spawn('bash', ['check_camera.sh']);

  camCheckScript.stdout.on('data', (data: Buffer) => {
    const logEntry = data.toString();

    if(logEntry.includes("AppleH13CamIn")) {
      if(logEntry.includes("power_on_hardware")) {
        if(argv.debug) {
          console.log("Camera is powered on");
        }

        if(serial.isReady && !onCall) {
          serialWrite(serial.port, parseInput("onair-red", argv.text, argv.debug));
        }
        onCall = true;
      }
      if (logEntry.includes("power_off_hardware")) {
        if (argv.debug) {
          console.log("Camera is powered off");
        }

        if(serial.isReady && onCall) {
          serialWrite(serial.port, parseInput("onair-green", argv.text, argv.debug));
        }
        onCall = false;
      }
    }
  });

  camCheckScript.stderr.on('data', (data: Buffer) => {
    console.error(`Error: ${data.toString()}`);
  });

  camCheckScript.on('close', (code: number) => {
    console.log(`Bash script exited with code ${code}`);
  });
}
