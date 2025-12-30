export class TelegramError extends Error {
  public readonly errorCode?: number;
  public readonly retryAfter?: number;
  public readonly migrateToChatId?: number;

  constructor(
    message: string,
    errorCode?: number,
    parameters?: { retry_after?: number; migrate_to_chat_id?: number },
  ) {
    super(message);
    this.name = "TelegramError";
    this.errorCode = errorCode;
    this.retryAfter = parameters?.retry_after;
    this.migrateToChatId = parameters?.migrate_to_chat_id;
  }
}
