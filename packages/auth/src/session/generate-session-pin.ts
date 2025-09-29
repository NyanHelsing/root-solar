import { getRandomBytes } from "../random.ts";
import { ACCEPT_BOUND, MAX_PIN, PIN_LENGTH } from "./constants.ts";

export const generateSessionPin = (): string => {
  let value = ACCEPT_BOUND;
  while (value >= ACCEPT_BOUND) {
    const random = getRandomBytes(2);
    value = (random[0] << 8) | random[1];
  }
  const pin = value % MAX_PIN;
  return pin.toString().padStart(PIN_LENGTH, "0");
};

export default generateSessionPin;
