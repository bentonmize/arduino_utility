import {Arguments} from "yargs";
import {ITermArguments} from "./Interfaces";
import {State} from "../serial/state";
import {spawn} from "node:child_process";
import {BucketStatus, GitState} from "./GitState";
import {serialWrite} from "../serial/serial";
import {parseInput} from "../serial/parser";

interface CheckStatus {
  bucket: string;
  event: string;
  name : string;
}

export const startGithubPrChecker = (
  argv: Arguments<ITermArguments>,
  serial: State,
  gitState: GitState
) => {
  const prCheckScript = spawn('bash',
    ['gh_pr_checks.sh', gitState.prNumber, gitState.repo]
  );
  let color = "blue";

  prCheckScript.stdout.on('data', (data: Buffer) => {
    const output: [CheckStatus] = JSON.parse(data.toString())
    let setColor = false
    console.log(output);

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
      serialWrite(serial.port, parseInput(`ring-${color}`, argv.text, argv.debug));
    }
  });

  prCheckScript.stderr.on('data', (data: Buffer) => {
    console.error(`Error: ${data.toString()}`);
  });

  prCheckScript.on('close', (code: number) => {
    console.log(`Bash script exited with code ${code}`);
  });
}
