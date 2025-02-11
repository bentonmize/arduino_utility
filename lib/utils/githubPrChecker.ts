import {Arguments} from "yargs";
import {ITermArguments} from "./Interfaces";
import {SerialConnection} from "../serial/SerialConnection";
import {spawn} from "node:child_process";
import {BucketStatus, GitState} from "./GitState";

interface CheckStatus {
  bucket: string;
  event: string;
  name : string;
}

export const startGithubPrChecker = (
  argv: Arguments<ITermArguments>,
  serial: SerialConnection,
  gitState: GitState
) => {
  const prCheckScript = spawn('bash',
    ['gh_pr_checks.sh', gitState.prNumber, gitState.repo]
  );
  let color = "blue";

  prCheckScript.stdout.on('data', (data: Buffer) => {
    const output: [CheckStatus] = JSON.parse(data.toString())
    let setColor = false
    if(argv.debug) {
      console.log(output);
    }

    if(output.some((status) => status.bucket === "fail")) {
      if(gitState.state != BucketStatus.fail) {
        color = "red";
        gitState.state = BucketStatus.fail;
        setColor = true;
      }
      gitState.state = BucketStatus.fail
    } else if(output.some((status) => status.bucket === "pending")) {
      if(gitState.state != BucketStatus.pending) {
        color = "blue";
        gitState.state = BucketStatus.pending;
        setColor = true;
      }
    } else if(output.every((status) => status.bucket === "pass")) {
      if(gitState.state != BucketStatus.pass) {
        color = "green";
        gitState.state = BucketStatus.pass;
        setColor = true;
      }
    } else {
      if(gitState.state != BucketStatus.skipping) {
        color = "yellow";
        gitState.state = BucketStatus.skipping;
        setColor = true;
      }
    }

    if(serial.isReady && setColor) {
      serial.write(`ring-${color}`);
    }
  });

  prCheckScript.stderr.on('data', (data: Buffer) => {
    console.error(`Error: ${data.toString()}`);
  });
}
