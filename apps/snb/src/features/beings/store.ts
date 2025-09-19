import { atom } from "jotai";

export type Being = {
  id: string;
  name: string;
  role: "superuser" | "participant";
};

export const beingAtom = atom<Being>({
  id: "being:1",
  name: "Superuser",
  role: "superuser",
});
