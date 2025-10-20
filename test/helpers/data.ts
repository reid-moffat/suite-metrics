import TestInputs from "test-inputs";

/**
 * List of all input types for testing
 */
const allInputTypes: any[] = TestInputs.getRawInputs({ include: { levels: "simple" } });

/**
 * Turns any value into a human-readable string
 */
const valueToHumanReadableString = (value: any): string => {
    if (value === null) {
        return "null";
    }
    if (typeof value === 'undefined') {
        return "undefined";
    }
    if (typeof value === 'string') {
        return `"${value}"`;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }
    if (typeof value === 'bigint') { // Handle BigInt explicitly
        return String(value) + 'n'; // Add 'n' suffix for clarity
    }
    // For arrays and objects, use JSON.stringify for a structured representation
    if (typeof value === 'object') {
        try {
            return JSON.stringify(value);
        } catch (e) {
            // Fallback for objects that cannot be stringified (e.g., circular references, WeakMap/Set)
            // For testing, a generic representation is fine
            if (value && value.constructor && value.constructor.name) {
                return `[${value.constructor.name}]`;
            }
            return `[object ${typeof value}]`;
        }
    }
    // For functions and Symbols, convert to string
    if (typeof value === 'function') {
        return `[Function]`;
    }
    if (typeof value === 'symbol') {
        return `Symbol(${String(value.description || '')})`;
    }

    return String(value); // Fallback for any other unexpected types
}

export { allInputTypes, valueToHumanReadableString };
