import { SendMessageInput } from "./types";

export class SendMessageCommand {
  public readonly input: SendMessageInput;

  constructor(input: SendMessageInput) {
    this.input = input;
  }
}
