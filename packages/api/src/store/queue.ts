import * as amqp from "amqp-connection-manager";
import { ChannelWrapper, AmqpConnectionManager } from "amqp-connection-manager";
import { Channel, ConsumeMessage } from "amqplib";
import messages from "./messages";
import { EventKey } from "./webhook-table";

const EXCHANGES = {
  webhooks: "webhook_default_exchange",
  task: "lp_tasks",
  delayed_old: "webhook_delayed_exchange",
} as const;
const QUEUES = {
  events: "webhook_events_queue_v1",
  webhooks: "webhook_cannon_single_url_v1",
  task: "task_results_queue",
  delayed_old: "webhook_delayed_queue",
} as const;
const delayedWebhookQueue = (delayMs: number) => `delayed_webhook_${delayMs}ms`;

type QueueName = keyof typeof QUEUES;
type ExchangeName = keyof typeof EXCHANGES;
export type RoutingKey =
  | `events.${EventKey}`
  | `webhooks.${string}`
  | `task.trigger.${string}.${string}`;

export default interface Queue {
  publish(
    exchange: ExchangeName,
    key: RoutingKey,
    msg: messages.Any
  ): Promise<void>;
  publishWebhook(key: RoutingKey, msg: messages.Webhooks): Promise<void>;
  delayedPublishWebhook(
    key: RoutingKey,
    msg: messages.Any,
    delay: number
  ): Promise<void>;

  consume(name: QueueName, func: (msg: ConsumeMessage) => void): Promise<void>;
  ack(data: any): void;
  nack(data: any): void;

  close(): Promise<void>;
}

export class NoopQueue implements Queue {
  async publish(
    exchange: ExchangeName,
    key: RoutingKey,
    msg: messages.Webhooks
  ) {
    console.warn(
      `WARN: Publish to exchange=${exchange} on noop queue. key=${key} message=`,
      msg
    );
  }

  async publishWebhook(key: RoutingKey, msg: messages.Webhooks) {
    this.publish("webhooks", key, msg);
  }

  async delayedPublishWebhook(
    key: RoutingKey,
    msg: messages.Any,
    delay: number
  ) {
    console.warn(
      `WARN: Delayed publish event to noop queue. key=${key} delay=${delay} message=`,
      msg
    );
  }

  async consume(_: QueueName, __: (_: ConsumeMessage) => void) {}
  ack(_: any) {}
  nack(_: any) {}

  async close() {}
}

export class RabbitQueue implements Queue {
  private channel: ChannelWrapper;
  private connection: AmqpConnectionManager;

  public static async connect(url: string): Promise<RabbitQueue> {
    const queue = new RabbitQueue();
    await queue.init(url);
    return queue;
  }

  private constructor() {}

  private init(url: string): Promise<void> {
    // Create a new connection manager
    this.connection = amqp.connect([url]);
    this.channel = this.connection.createChannel({
      json: true,
      publishTimeout: 10_000, // 10s
      setup: async (channel: Channel) => {
        await Promise.all([
          channel.assertQueue(QUEUES.events, {
            arguments: { "x-queue-type": "quorum" },
          }),
          channel.assertQueue(QUEUES.webhooks, {
            arguments: { "x-queue-type": "quorum" },
          }),
          channel.assertQueue(QUEUES.task, {
            arguments: { "x-queue-type": "quorum" },
          }),
          channel.assertExchange(EXCHANGES.webhooks, "topic", {
            durable: true,
          }),
          channel.assertExchange(EXCHANGES.task, "topic", {
            durable: true,
          }),
        ]);
        await Promise.all([
          channel.bindQueue(QUEUES.events, EXCHANGES.webhooks, "events.#"),
          channel.bindQueue(QUEUES.webhooks, EXCHANGES.webhooks, "webhooks.#"),
          channel.bindQueue(QUEUES.task, EXCHANGES.task, "task.result.#"),
          channel.prefetch(2),
        ]);
        // TODO: Remove this once all old queues have been deleted.
        await Promise.all([
          channel.unbindQueue(QUEUES.delayed_old, EXCHANGES.delayed_old, "#"),
          channel.deleteQueue(QUEUES.delayed_old, {
            ifUnused: true,
            ifEmpty: true,
          }),
          channel.deleteExchange(EXCHANGES.delayed_old, {
            ifUnused: true,
          }),
        ]);
      },
    });
    return new Promise<void>((resolve, reject) => {
      let resolveOnce = (err?: Error) => {
        if (!resolve) return;
        err ? reject(err) : resolve();
        resolve = null;
      };
      this.connection.on("connect", () => {
        console.log("AMQP Connected!");
        resolveOnce();
      });
      this.connection.on("disconnect", ({ err }: { err: Error }) => {
        console.log("AMQP Disconnected.", err);
        resolveOnce(
          new Error(`Error connecting to RabbitMQ. ${err.name}: ${err.message}`)
        );
      });
    });
  }

  public async close(): Promise<void> {
    await this.channel.close();
    await this.connection.close();
  }

  public ack(data: any): void {
    this.channel.ack(data);
  }

  public nack(data: any): void {
    this.channel.nack(data);
  }

  public async consume(
    queueName: QueueName,
    func: (msg: ConsumeMessage) => void
  ): Promise<void> {
    if (!func) {
      throw new Error("RabbitMQ | consume | func is undefined");
    }
    console.log("adding consumer");
    await this.channel.addSetup((channel: Channel) => {
      return channel.consume(QUEUES[queueName], func);
    });
  }

  public handleMessage(data: any) {
    var message = JSON.parse(data.content.toString());
    console.log("subscriber: got message", message);
    this.ack(data);
  }

  public async publishWebhook(
    route: RoutingKey,
    msg: messages.Any
  ): Promise<void> {
    await this.publish("webhooks", route, msg);
  }

  public async publish(
    exchangeName: ExchangeName,
    route: RoutingKey,
    msg: messages.Any
  ): Promise<void> {
    console.log(
      `publishing message to ${route} on exchange ${exchangeName} : ${JSON.stringify(
        msg
      )}`
    );
    await this._channelPublish(EXCHANGES[exchangeName], route, msg, {
      persistent: true,
    });
  }

  // This function publishes a message to an alternate exchange/queue used only
  // for delayed messages. Messages are published with an expiration equal to
  // the desired `delay` parameter, and after they expire are sent to the main
  // exchange through the delayed queue deadletterExchange configuration.
  public delayedPublishWebhook(
    routingKey: RoutingKey,
    msg: messages.Any,
    delay: number
  ): Promise<void> {
    delay = Math.round(delay);
    const delayedQueueName = delayedWebhookQueue(delay);
    // TODO: Find a way to reimplement this without on-demand queues.
    return this._withSetup(
      async (channel: Channel) => {
        await Promise.all([
          channel.assertExchange(delayedQueueName, "topic", {
            durable: true,
            autoDelete: true,
          }),
          channel.assertQueue(delayedQueueName, {
            durable: true,
            messageTtl: delay,
            deadLetterExchange: EXCHANGES.webhooks,
            expires: delay + 15000,
          }),
        ]);
        await channel.bindQueue(delayedQueueName, delayedQueueName, "#");
      },
      () => {
        console.log(
          `emitting delayed message: delay=${delay / 1000}s msg=`,
          msg
        );
        return this._channelPublish(delayedQueueName, routingKey, msg, {
          persistent: true,
        });
      }
    );
  }

  private async _withSetup<T>(
    setup: amqp.SetupFunc,
    action: () => Promise<T>
  ): Promise<T> {
    await this.channel.addSetup(setup);
    try {
      return await action();
    } finally {
      // avoid accumulating duplicate setup funcs on the channel manager
      await this.channel.removeSetup(setup, () => {});
    }
  }

  private async _channelPublish(
    exchange: string,
    routingKey: string,
    msg: any,
    opts: amqp.Options.Publish
  ) {
    try {
      const success = await this.channel.publish(
        exchange,
        routingKey,
        msg,
        opts
      );
      if (!success) {
        throw new Error(
          `Failed to publish message ${routingKey}: publish buffer full`
        );
      }
    } catch (err) {
      console.error(
        `Error publishing message: exchange="${exchange}" routingKey="${routingKey}" err=`,
        err
      );
      if (err?.message?.includes("timeout")) {
        throw new Error(`Timeout publishing message ${routingKey} to queue`);
      }
      throw err;
    }
  }
}
