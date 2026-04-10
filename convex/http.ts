import { httpRouter } from "convex/server";
import { chatStream, chatOptions } from "./aiChat";

const http = httpRouter();

http.route({
  path: "/api/chat",
  method: "POST",
  handler: chatStream,
});

http.route({
  path: "/api/chat",
  method: "OPTIONS",
  handler: chatOptions,
});

export default http;
