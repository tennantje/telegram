# [beta] @tennantje/telegram

A TypeScript Telegram Bot API client with AWS SDK-style architecture.

## Overview

This is a **bare-bones** Telegram Bot API client designed to meet the specific needs of the package author. It currently supports only the `sendMessage` method but provides a solid foundation for extension.

**Contributions are welcome!** If you need additional Telegram Bot API methods, please feel free to submit a pull request.

## Features

- 🏗️ AWS SDK-style client/command pattern
- 📝 Optional structured logging (compatible with `@tennantje/logger`)
- 📊 Optional metrics collection (CloudWatch-compatible)
- 🎛️ Granular metric control with allowlist
- ⚡ Configurable request timeout (5s default)
- 🛡️ Comprehensive error handling with Telegram-specific error types
- 📘 Full TypeScript support

## Installation

```bash
npm install @tennantje/telegram
```

## Basic Usage

```typescript
import { TelegramClient, SendMessageCommand } from "@tennantje/telegram";

const client = new TelegramClient({
  botToken: "your-bot-token",
});

const result = await client.send(
  new SendMessageCommand({
    chatId: "123456789",
    text: "Hello, World!",
  }),
);

console.log(`Message sent with ID: ${result.messageId}`);
```

## AWS-centric example

Here's a more opinionated example using AWS.

```typescript
import {
  TelegramClient,
  SendMessageCommand,
  TelegramError,
} from "@tennantje/telegram";
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import {
  CloudWatchClient,
  PutMetricDataCommand,
} from "@aws-sdk/client-cloudwatch";
import { logger } from "@tennantje/logger";

// Get bot configuration from SSM Parameter Store
const getTelegramConfig = async () => {
  const ssm = new SSMClient({});

  const response = await ssm.send(
    new GetParameterCommand({
      Name: "/myapp/telegram/config",
      WithDecryption: true,
    }),
  );

  // { "botToken": "123456:ABC-DEF...", "chatId": "987654321" }
  return JSON.parse(response.Parameter!.Value!);
};

// Get Telegram Config
const telegramConfig = await getTelegramConfig();

// Setup CloudWatch metrics
const cloudwatch = new CloudWatchClient({});

const putMetricFunction = async ({ name, value, unit = "Count" }) => {
  await cloudwatch.send(
    new PutMetricDataCommand({
      Namespace: "MyApp/Telegram",
      MetricData: [
        {
          MetricName: name,
          Value: value,
          Unit: unit,
        },
      ],
    }),
  );
};

const client = new TelegramClient({
  botToken: telegramConfig.botToken,
  loggerFunction: logger,
  putMetricFunction,
  enabledMetrics: ["TelegramSuccess", "TelegramFailure"], // Only track success/failure, not duration
  timeoutMs: 10000, // 10 second timeout
});

// Send message with full error handling
try {
  const result = await client.send(
    new SendMessageCommand({
      chatId: telegramConfig.chatId,
      text: "Deployment completed successfully! 🚀",
    }),
  );

  logger({
    level: "info",
    message: "Notification sent",
    meta: { messageId: result.messageId },
  });
} catch (error) {
  if (error instanceof TelegramError) {
    if (error.retryAfter) {
      logger({
        level: "warn",
        message: `Rate limited. Retry after ${error.retryAfter} seconds`,
      });
    } else if (error.migrateToChatId) {
      logger({
        level: "info",
        message: `Chat migrated to: ${error.migrateToChatId}`,
      });
    } else {
      logger({
        level: "error",
        message: `Telegram API error: ${error.message}`,
        meta: { errorCode: error.errorCode },
      });
    }
  } else {
    logger({
      level: "error",
      message: "Network or other error",
      meta: { error: String(error) },
    });
  }
}
```

## Configuration Options

```typescript
interface TelegramClientConfig {
  botToken: string; // Required: Your bot token from @BotFather
  loggerFunction?: LoggerFunction; // Optional: Structured logger function
  putMetricFunction?: PutMetricFunction; // Optional: Metrics collection function
  enabledMetrics?: SupportedTelegramMetric[]; // Optional: Metric allowlist (['*'] for all)
  timeoutMs?: number; // Optional: Request timeout (default: 5000ms)
}
```

## Available Metrics

- `TelegramSuccess` - Successful API calls (Count)
- `TelegramFailure` - Failed API calls (Count)
- `TelegramDuration` - Request duration (Milliseconds)

Use `enabledMetrics: ['*']` to enable all metrics, or specify individual metrics to control costs.

## Error Handling

The client throws `TelegramError` for API-specific errors:

```typescript
try {
  await client.send(command);
} catch (error) {
  if (error instanceof TelegramError) {
    console.log("Error code:", error.errorCode);
    console.log("Retry after:", error.retryAfter); // Rate limiting
    console.log("Migrate to chat ID:", error.migrateToChatId); // Group migrations
  }
}
```

## Current Limitations

This library currently only supports:

- ✅ `sendMessage` method
- ❌ File uploads
- ❌ Inline keyboards
- ❌ Webhooks
- ❌ Other Bot API methods

**Want more features?** Contributions are welcome! The architecture is designed to make adding new commands straightforward.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add your command following the existing `SendMessageCommand` pattern
4. Update types and exports
5. Add tests if possible
6. Submit a pull request

## License

MIT

## Author

Built by [@tennantje](https://github.com/tennantje) for personal projects, but shared for the community.
