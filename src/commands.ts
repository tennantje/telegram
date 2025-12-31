import { SendMessageInput, SendMarkdownMessageInput } from "./types";

export class SendMessageCommand {
  public readonly input: SendMessageInput;

  constructor(input: SendMessageInput) {
    this.input = input;
  }

  public getPayload() {
    return {
      chat_id: this.input.chatId,
      text: this.input.text,
    };
  }
}

export class SendMarkdownMessageCommand {
  public readonly input: SendMarkdownMessageInput;

  constructor(input: SendMarkdownMessageInput) {
    this.input = input;
  }

  public getPayload() {
    return {
      chat_id: this.input.chatId,
      text: this.input.text,
      parse_mode: "MarkdownV2" as const,
    };
  }
}
