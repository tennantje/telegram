import axios, { AxiosError } from "axios";
import {
  TelegramClientConfig,
  TelegramApiResponse,
  SendMessageOutput,
  PutMetricInput,
} from "./types";
import { SendMessageCommand } from "./commands";
import { TelegramError } from "./errors";

export class TelegramClient {
  private readonly botToken: string;
  private readonly logger?: TelegramClientConfig["logger"];
  private readonly metrics?: TelegramClientConfig["metrics"];
  private readonly enabledMetrics?: Set<string>;
  private readonly timeoutMs: number;
  private readonly baseUrl: string;

  constructor(config: TelegramClientConfig) {
    this.botToken = config.botToken;
    this.logger = config.logger;
    this.metrics = config.metrics;
    this.enabledMetrics = config.enabledMetrics
      ? new Set(config.enabledMetrics)
      : undefined;
    this.timeoutMs = config.timeoutMs ?? 5000;
    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  private async putMetric({ name, value, unit }: PutMetricInput) {
    if (!this.metrics) return;
    if (
      this.enabledMetrics &&
      !this.enabledMetrics.has("*") &&
      !this.enabledMetrics.has(name)
    )
      return;

    await this.metrics.putMetric({ name, value, unit });
  }

  public async send(command: SendMessageCommand): Promise<SendMessageOutput> {
    const startTime = Date.now();

    try {
      this.logger?.({
        level: "info",
        message: "Sending Telegram message",
        meta: {
          chatId: command.input.chatId,
          textLength: command.input.text.length,
        },
      });

      const response = await axios.post<TelegramApiResponse<SendMessageOutput>>(
        `${this.baseUrl}/sendMessage`,
        {
          chat_id: command.input.chatId,
          text: command.input.text,
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: this.timeoutMs,
        },
      );

      if (!response.data.ok) {
        throw new TelegramError(
          response.data.description || "Unknown Telegram API error",
          response.data.error_code,
          response.data.parameters,
        );
      }

      const duration = Date.now() - startTime;

      this.logger?.({
        level: "info",
        message: "Telegram message sent successfully",
        meta: { messageId: response.data.result!.messageId, duration },
      });

      await this.putMetric({ name: "TelegramSuccess", value: 1 });
      await this.putMetric({
        name: "TelegramDuration",
        value: duration,
        unit: "Milliseconds",
      });

      return response.data.result!;
    } catch (error) {
      const duration = Date.now() - startTime;

      if (error instanceof TelegramError) {
        this.logger?.({
          level: "error",
          message: "Telegram API error",
          meta: {
            errorCode: error.errorCode,
            retryAfter: error.retryAfter,
            migrateToChatId: error.migrateToChatId,
            duration,
          },
        });
      } else if (error instanceof AxiosError) {
        this.logger?.({
          level: "error",
          message: "Network error sending Telegram message",
          meta: {
            status: error.response?.status,
            code: error.code,
            duration,
          },
        });
      } else {
        this.logger?.({
          level: "error",
          message: "Unexpected error sending Telegram message",
          meta: { error: String(error), duration },
        });
      }

      await this.putMetric({ name: "TelegramFailure", value: 1 });

      throw error;
    }
  }
}
