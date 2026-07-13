// HiveMQ's free public broker. WebSocket over TLS is what a browser can speak —
// a browser cannot open the raw TCP socket that mqtt:// on port 1883 requires.
export const BROKER_WS =
  process.env.NEXT_PUBLIC_MQTT_BROKER_WS ?? "wss://broker.hivemq.com:8884/mqtt";

// Plain TCP endpoint, used by the Node device simulator.
export const BROKER_TCP =
  process.env.MQTT_BROKER_TCP ?? "mqtt://broker.hivemq.com:1883";

// The broker is public and shared, so the topics are namespaced. Override the
// prefix to get a private-ish channel for your own demo.
export const TOPIC_PREFIX =
  process.env.NEXT_PUBLIC_MQTT_TOPIC_PREFIX ?? "northwind/plant-1";

export const telemetryTopic = (machineId: string) =>
  `${TOPIC_PREFIX}/${machineId}/telemetry`;

// Wildcard subscription: `+` matches exactly one level, so this picks up every
// machine's telemetry without listing them.
export const TELEMETRY_WILDCARD = `${TOPIC_PREFIX}/+/telemetry`;

// QoS 0 (at most once) is the right trade-off for high-frequency telemetry:
// a dropped sample is replaced by the next one 2 seconds later, and it avoids
// the acknowledgement round-trips of QoS 1/2.
export const QOS = 0 as const;
