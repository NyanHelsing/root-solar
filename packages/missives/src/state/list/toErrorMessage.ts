export const toErrorMessage = (error: unknown): string => {
    if (!error) {
        return "Unknown error";
    }
    if (error instanceof Error) {
        return error.message || "Unknown error";
    }
    return String(error);
};

export default toErrorMessage;
