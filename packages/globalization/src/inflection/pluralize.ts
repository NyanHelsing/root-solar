export const pluralize = (value: string): string => {
    if (value.endsWith("s")) {
        return value;
    }
    return `${value}s`;
};

export default pluralize;
