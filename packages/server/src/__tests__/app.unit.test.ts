import assert from "node:assert/strict";
import http from "node:http";
import { once } from "node:events";
import { describe, it } from "node:test";
import { Duplex } from "node:stream";
import type { Socket } from "node:net";
import type { Application, RequestHandler } from "express";

import { createBaseApp } from "../app.ts";

class MockSocket extends Duplex {
    private readonly chunks: Buffer[] = [];

    override _write(
        chunk: Buffer,
        _encoding: BufferEncoding,
        callback: (error?: Error | null) => void
    ) {
        this.chunks.push(Buffer.from(chunk));
        callback();
    }

    override _read(): void {}

    readBody() {
        return Buffer.concat(this.chunks).toString("utf8");
    }
}

const performRequest = async (app: Application, method: string, path: string) => {
    const socket = new MockSocket();
    const request = new http.IncomingMessage(socket as unknown as Socket);
    request.method = method;
    request.url = path;
    request.headers = {};

    const response = new http.ServerResponse(request);
    // @ts-expect-error internal Node API used for testing
    response.assignSocket?.(socket);

    const finish = once(response, "finish");
    app(request, response);
    await finish;

    const raw = socket.readBody();
    const [, body = ""] = raw.split("\r\n\r\n");

    socket.destroy();

    return {
        status: response.statusCode,
        body
    } as const;
};

describe("packages/server/app", () => {
    it("responds with a 200 OK on the health endpoint", async () => {
        const app = createBaseApp();
        const response = await performRequest(app, "GET", "/health");
        assert.equal(response.status, 200);
        assert.equal(response.body.trim(), "ok");
    });

    it("mounts the TRPC middleware under the /api route", async () => {
        const calls: Array<{ path: string; method: string }> = [];
        const handler: RequestHandler = (req, res) => {
            calls.push({ path: req.path, method: req.method });
            res.status(204).end();
        };

        const app = createBaseApp({ apiHandler: handler });
        const response = await performRequest(app, "POST", "/api/ping");
        assert.equal(response.status, 204);
        assert.deepEqual(calls, [{ path: "/ping", method: "POST" }]);
    });
});
