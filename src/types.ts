export type SupportedMetricUnit = "Count" | "Seconds" | "Milliseconds";

export interface Logger {
  (params: {
    level: "error" | "warn" | "info" | "debug";
    message: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    meta?: Record<string, any>;
  }): void;
}

export interface MetricsCollector {
  putMetric(params: {
    name: string;
    value: number;
    unit?: SupportedMetricUnit;
  }): Promise<void>;
}

export type SupportedTelegramMetric =
  | "TelegramSuccess"
  | "TelegramFailure"
  | "TelegramDuration"
  | "*";

export interface PutMetricInput {
  name: SupportedTelegramMetric;
  value: number;
  unit?: SupportedMetricUnit;
}

export interface TelegramClientConfig {
  botToken: string;
  logger?: Logger;
  metrics?: MetricsCollector;
  enabledMetrics?: SupportedTelegramMetric[];
  timeoutMs?: number;
}

export interface SendMessageInput {
  chatId: string;
  text: string;
}

export interface SendMessageOutput {
  messageId: number;
  date: number;
}

export interface TelegramApiResponse<T> {
  ok: boolean;
  result?: T;
  description?: string;
  error_code?: number;
  parameters?: {
    migrate_to_chat_id?: number;
    retry_after?: number;
  };
}
