import { atom } from "jotai";

export type Being = {
  id: number;
  name: string;
  role: "superuser" | "participant";
};

export const beingAtom = atom<Being>({
  id: 1,
  name: "Superuser",
  role: "superuser",
});
