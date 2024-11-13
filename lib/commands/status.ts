import type {Arguments, CommandBuilder, CommandModule} from 'yargs';
import {SerialPort} from 'serialport';
import * as readline from "readline";
import {selectSerialPort, serialOpen, serialWrite} from "../serial/serial";
import {AmplifyClient, GetJobCommand, JobStatus, ListJobsCommand, ListJobsCommandOutput} from "@aws-sdk/client-amplify";

interface IStatusArguments extends Arguments {
  appId: string
  branchName: string
  manual?: boolean
  debug?: boolean
}

const statusBuilder: CommandBuilder = (yargs) =>
  yargs.options({
    manual: {alias: 'm', type: 'boolean', default: false},
    debug: {alias: 'D', type: 'boolean', default: false, description: "Debugging on/off"},
  })

const statusCommand: CommandModule = {
  handler: async (argv: Arguments<IStatusArguments>) => {
    const serialPort = await selectSerialPort(argv.manual, argv.debug)
    await processBuild(serialPort, argv.appId, argv.branchName, argv.debug);
  },
  describe: 'Amplify build status checker',
  builder: statusBuilder,
  command: 'status <appId> <branchName>',
}

const delay = (ms: number) => {
  return new Promise( resolve => setTimeout(resolve, ms));
}

const processBuild = async (serialPort: SerialPort, appId: string, branch: string, debug: boolean) => {
  const client = new AmplifyClient({region: "us-east-1"});
  const input: any = {
    appId: appId,
    branchName: branch
  }

  let breakLoop = false;

  process.on('SIGINT', () => {
    console.log("Closing!");
    breakLoop = true;
    process.exit(0);
  })

  let currentStatus = "";
  let lastStatus = "NONE";
  let color = "white";
  let response: ListJobsCommandOutput;
  let count = 20;

  while(!breakLoop) {
    if(count >= 30) {
      count = 0;

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
              if(debug) {
                console.log("Found test phase started...")
              }
              testState = true;
            }
          }

          color = "blue";
          if(testState) {
            currentStatus = "TESTING";
            color = "purple";
          }
          break;
        case JobStatus.SUCCEED:
          color = "green"
          break;
      }

      if(lastStatus != currentStatus) {
        if(debug) {
          console.log("Status change: "+currentStatus);
        }
        lastStatus = currentStatus;
        if(currentStatus === JobStatus.SUCCEED || color == "red") {
          serialWrite(serialPort, "pulse-" + color, debug);
        } else {
          serialWrite(serialPort, "progress-" + color, debug);
        }
      }
    }

    await delay(1000);
    count++;
  }
}

export = statusCommand;
