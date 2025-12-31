import { SendMessageInput, SendMarkdownMessageInput } from "./types";

export class SendMessageCommand {
  public readonly input: SendMessageInput;

  constructor(input: SendMessageInput) {
    this.input = input;
  }
}

export class SendMarkdownMessageCommand {
  public readonly input: SendMarkdownMessageInput;

  constructor(input: SendMarkdownMessageInput) {
    this.input = input;
  }
}
