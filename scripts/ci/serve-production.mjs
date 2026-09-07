// Local harness for the actual built Vercel fetch handler and configured headers.
import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";
import { Readable } from "node:stream";
import handler from "../../.vercel/output/functions/_render.func/dist/server/entry.mjs";

const root = resolve(".vercel/output/static");
const configuration = JSON.parse(await readFile("vercel.json", "utf8"));
const types = {
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};
// Prevent any route under test from contacting an actual AI/balance provider.
globalThis.fetch = async () => {
  throw new Error("External fetch is forbidden in CI fixtures");
};

const server = createServer(async (incoming, outgoing) => {
  try {
    const url = new URL(incoming.url, `http://127.0.0.1:${process.env.PORT ?? 4321}`);
    const file = resolve(root, `.${decodeURIComponent(url.pathname)}`);
    let response;
    if (
      file.startsWith(root + sep) &&
      (await stat(file)
        .then((value) => value.isFile())
        .catch(() => false))
    ) {
      response = new Response(await readFile(file), {
        headers: { "Content-Type": types[extname(file)] ?? "application/octet-stream" },
      });
    } else {
      response = await handler.fetch(
        new Request(url, {
          method: incoming.method,
          headers: incoming.headers,
          ...(["GET", "HEAD"].includes(incoming.method)
            ? {}
            : { body: Readable.toWeb(incoming), duplex: "half" }),
        })
      );
    }
    outgoing.statusCode = response.status;
    for (const [key, value] of response.headers) outgoing.setHeader(key, value);
    const cookies = response.headers.getSetCookie();
    if (cookies.length) outgoing.setHeader("Set-Cookie", cookies);
    for (const rule of configuration.headers) {
      if (new RegExp(`^${rule.source}$`).test(url.pathname)) {
        for (const header of rule.headers) outgoing.setHeader(header.key, header.value);
      }
    }
    if (response.body) Readable.fromWeb(response.body).pipe(outgoing);
    else outgoing.end();
  } catch (error) {
    console.error(error);
    outgoing.writeHead(500).end("CI production harness failed");
  }
});
server.listen(Number(process.env.PORT ?? 4321), "127.0.0.1", () =>
  console.log("Built Vercel handler ready")
);
