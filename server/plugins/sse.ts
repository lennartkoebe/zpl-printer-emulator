import { randomUUID } from "node:crypto";
import type { ServerResponse } from "node:http";

type Client = {
  id: string;
  res: ServerResponse;
};

const MAX_CLIENTS = 100;

export const clients = new Map<string, Client>();

let onConnectCallback: undefined | ((client: Client) => void);

export function setOnConnectCallback(callback: (client: Client) => void) {
  onConnectCallback = callback;
}

export function sendSSEMessageToAll(type: string, data: any) {
  clients.forEach((client) => sendSSEMessageToClient(client, type, data));
}

export function sendSSEMessageToClient(
  client: Client,
  type: string,
  data: any
) {
  client.res.write(`id: ${Date.now()}\n`);
  client.res.write(`event: ${type}\n`);
  client.res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export default defineNitroPlugin(async (nitroApp) => {
  nitroApp.router.get(
    "/sse",
    eventHandler(async (event) => {
      if (clients.size >= MAX_CLIENTS) {
        return sendNoContent(event, 503);
      }

      setHeader(event, "Content-Type", "text/event-stream");
      setHeader(event, "Cache-Control", "no-cache");
      setHeader(event, "Connection", "keep-alive");
      setResponseStatus(event, 200);

      const clientId = randomUUID();

      const client: Client = {
        id: clientId,
        res: event.node.res,
      };

      clients.set(clientId, client);

      sendSSEMessageToAll("init", "connected");

      onConnectCallback?.(client);

      event.node.req.on("close", () => {
        clients.delete(clientId);
      });

      // setTimeout(() => {
      //   // event.node.req.destroy();
      //   event.node.res.end();
      // }, 2000);

      if (import.meta.dev) {
        useNitroApp().hooks.hookOnce("close", () => {
          event.node.res.end();
        });
      }

      await new Promise(() => {});
    })
  );

  nitroApp.router.post(
    "/events",
    eventHandler(async (event) => {
      // const { type = "message", payload = {} } = await readBody(event);

      // sendMesage(type, payload);
      sendSSEMessageToAll("test", { test: 123 });

      return sendNoContent(event, 200);
    })
  );
});
