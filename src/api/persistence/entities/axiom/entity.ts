import { EntitySchema } from "@mikro-orm/core";

interface AxiomConstructorParameters {
  id: number;
  title: string;
  details: string;
}
export class Axiom {
  id!: number;
  title = "";
  details = "";

  static find(em, query) {
    return em.find(this, query);
  }

  constructor({ id, title, details }: AxiomConstructorParameters) {
    this.id = id;
    this.title = title;
    this.details = details;
  }
}

export const schema = new EntitySchema<Axiom>({
  class: Axiom,
  properties: {
    id: { type: "number", primary: true },
    title: { type: "string" },
    details: { type: "string" },
  },
});

export const seed = async (orm) => {
  const em = orm.em.fork();

  const testAxiom = new Axiom({
    id: 0,
    title: "Test Axiom",
    details: "an axiom for testing",
  });

  await em.persist(testAxiom).flush();
};
