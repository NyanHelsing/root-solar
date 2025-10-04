const startsWithVowel = (value: string) => /[aeiou]/i.test(value[0] ?? "u");

export const indefiniteArticle = (value: string): string => (startsWithVowel(value) ? "an" : "a");

export default indefiniteArticle;
