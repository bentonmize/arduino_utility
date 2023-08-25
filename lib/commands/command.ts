import type {Arguments, CommandBuilder, CommandModule} from 'yargs';
import {SerialPort} from 'serialport';

interface ICommandArguments extends Arguments {
  arg: string
}

const commandBuilder: CommandBuilder<ICommandArguments, ICommandArguments> = (yargs) =>
  yargs.positional(
    'arg', {
      type: 'string',
      demandOption: true
  })


const commandCommand: CommandModule<ICommandArguments, ICommandArguments> = {
  handler: async (argv: Arguments<ICommandArguments>) => {
    console.log(argv)

    const ports = await SerialPort.list();

    console.log(ports);
  },
  describe: 'A simple command',
  builder: commandBuilder,
  command: 'command <arg>'
}

export = commandCommand;
