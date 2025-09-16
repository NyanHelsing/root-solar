//import { EntitySchema } from "@mikro-orm/core";
import { RecordId } from "surrealdb";

import type { Context } from "../../../context.ts";
import { getDb } from "../../db.ts";

interface BeingConstructorProps {
  id: number;
  name: string;
}

type BeingRecord = Record<string, unknown> & {
  id: number;
  name: string;
};

type Contextualized<T> = T & { ctx: Context };

export class Being {
  _ctx?: Context;
  id: number;
  name: string;

  static get ctx(): Context {
    throw new Error(
      "Contextualize class before using methods that require context",
    );
  }

  static contextualize(ctx: any): Contextualized<typeof Being> {
    if (typeof ctx === "undefined") {
      return (this.ctx, this) as Contextualized<typeof Being>;
    }
    return new Proxy(Being, {
      get(target, prop, receiver) {
        if (prop === "ctx") return ctx;
        const value = Reflect.get(target, prop, receiver);
        return value instanceof Function ? value.bind(receiver) : value;
      },
    }) as Contextualized<typeof Being>;
  }

  static async create(data: BeingConstructorProps, ctx?: Context) {
    return new (this.contextualize(ctx))(data).create();
  }

  static async update(
    id: number,
    data: Partial<BeingConstructorProps extends BeingRecord>,
    ctx?: Context,
  ) {
    return new (this.contextualize(ctx))(data).update(id, data)
  }

  constructor(props: BeingConstructorProps extends BeingRecord, ctx?: Context) {
    if (typeof ctx !== "undefined") this._ctx = ctx
    Object.assign(this, props);

  }

  get ctx() {
    if (typeof this._ctx !== "undefined") return this._ctx;
    return (this.constructor as Contextualized<typeof Being>).ctx; // May throw
  }

  async create(ctx?: Context) {
    this.record = await (this.ctx).db.create<BeingRecord>(
      new RecordId("Being", this.id),
      this.record,
    );
    return this;
  }

  async update(
    id: number,
    data: Partial<BeingConstructorProps> extends BeingRecord,
    ctx?: Context,
  ) {
    await (this.ctx).db.update<BeingRecord>(
      new RecordId("Being", id),
      Object.assign(this.record, data)
    );
  }

  async save() {
    await (
      this.constructor as Contextualized<typeof Being>
    ).ctx.db.update<BeingRecord>(new RecordId("Being", this.id), this.data);
  }

  set record(value: BeingRecord) {
    Object.assign(this, value);
  }

  get record() {
    return {
      id: this.id,
      name: this.name,
    };
  }
}

/*
export const schema = new EntitySchema<Being>({
  class: Being,
  properties: {
    id: { type: "number", primary: true },
    name: { type: "string" },
  },
});
*/
