import type {Arguments} from "yargs";

export interface ITermArguments extends Arguments {
  manual?: boolean
  text?: boolean
  debug?: boolean
}
