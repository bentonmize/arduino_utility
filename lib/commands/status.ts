import type {Arguments, CommandBuilder, CommandModule} from 'yargs';
import {SerialPort} from 'serialport';
import * as readline from "readline";
import {serialOpen, serialWrite} from "../serial/serial";
import {AmplifyClient, GetJobCommand, JobStatus, ListJobsCommand, ListJobsCommandOutput} from "@aws-sdk/client-amplify";

interface IStatusArguments extends Arguments {
  appId: string
  branchName: string
  debug?: boolean
}

const statusBuilder: CommandBuilder = (yargs) =>
  yargs.options({
    debug: {alias: 'D', type: 'boolean', default: false, description: "Debugging on/off"},
  })

function delay(ms: number) {
  return new Promise( resolve => setTimeout(resolve, ms));
}

const statusCommand: CommandModule = {
  handler: async (argv: Arguments<IStatusArguments>) => {
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

    let breakLoop = false;

    process.on('SIGINT', () => {
      console.log("Closing!");
      breakLoop = true;
      readinput.close();
      process.exit(0);
    })

    readinput.question("Please select a port: ", async (port) => {
      if(/^-?\d+$/.test(port) && parseInt(port) > 0 && parseInt(port) < ports.length) {
        console.log(`You selected port ${ports[port].path}`)

        const serialPort = serialOpen(ports, parseInt(port), argv.debug);
        const client = new AmplifyClient({region: "us-east-1"});
        const input: any = {
          appId: argv.appId,
          branchName: argv.branchName
        }

        let currentStatus = "";
        let lastStatus = "NONE";
        let color = "white";
        let response: ListJobsCommandOutput;
        let count = 20;

        while(!breakLoop) {
          if(count >= 30) {
            response = await client.send(new ListJobsCommand(input));
            currentStatus = response.jobSummaries[0].status;
            input["jobId"] = response.jobSummaries[0].jobId;
            let jobResponse = await client.send(new GetJobCommand(input));

            let steps = jobResponse.job.steps;
            let newestStep = steps[0];

            switch (currentStatus) {
              default:
              case JobStatus.PENDING:
                color = "white"
                break;
              case JobStatus.PROVISIONING:
                color = "yellow"
                break;
              case JobStatus.CANCELLED:
              case JobStatus.CANCELLING:
              case JobStatus.FAILED:
                color = "red"
                break;
              case JobStatus.RUNNING:
                let testState = false;
                if("logUrl" in newestStep) {
                  const response = await fetch(newestStep.logUrl);
                  const data = await response.text();
                  if(data.includes("Starting phase: preTest")) {
                    if(argv.debug) {
                      console.log("Found test phase started...")
                    }
                    testState = true;
                  }
                }

                color = "blue"
                if(testState) {
                  color = "purple"
                }
                break;
              case JobStatus.SUCCEED:
                color = "green"
                break;
            }

            if(lastStatus != currentStatus) {
              lastStatus = currentStatus;
              if(currentStatus === JobStatus.SUCCEED || color == "red") {
                serialWrite(serialPort, "pulse-" + color, true);
              } else {
                serialWrite(serialPort, "progress-" + color, true);
              }
            }
            count = 0;
          }

          await delay(1000);
          count++;
        }

        readinput.close();
      } else {
        console.log("You did not enter a valid selection!")
        readinput.close();
      }
    })
  },
  describe: 'Amplify build status checker',
  builder: statusBuilder,
  command: 'status <appId> <branchName>',
}

export = statusCommand;
