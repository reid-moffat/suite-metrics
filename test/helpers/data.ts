/**
 * List of all input types for testing
 */
const allInputTypes: any[] = [
    null,
    undefined,
    true,
    false,
    "",
    " ",
    " ".repeat(10_000),
    "not an array",
    "\n",
    "\r",
    "\t",
    -1,
    0,
    1,
    123,
    Number.MIN_VALUE,
    Number.MAX_VALUE,
    Number.MIN_SAFE_INTEGER,
    Number.MAX_SAFE_INTEGER,
    Number.EPSILON,
    Number.NaN,
    Number.NEGATIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    BigInt(0),
    BigInt("-1"),
    new Date(),
    new RegExp("suite"),
    /regex/,
    new Map(),
    new Set(),
    new WeakMap(),
    new WeakSet(),
    Promise.resolve(1),
    new Error("test error"),
    new TypeError("type error"),
    new Proxy({}, {}),
    {},
    { a: 1 },
    { a: 1, b: 2 },
    { suite1: "suite 1" },
    { suite: "suite", test: "test" },
    { path: ["suite"] },
    () => {},
    () => 123,
    () => ["suite 1"],
    () => ["suite 1", "test 1"],
    Symbol(),
    Symbol(""),
    Symbol("Suite 1"),
    Symbol("Suite 1, Test 1"),
    [],
    [123],
    [-1],
    [Number.MIN_VALUE, Number.MAX_VALUE],
    [null],
    [undefined],
    [null, undefined],
    [""],
    [" "],
    ["", "", ""],
    [true],
    [false],
    [true, false],
    ["hello", "world"],
    [{}],
    [{}, {}],
    [{ a: 1 }, { a: 1, b: 2 }],
    [new Map()],
    [Symbol("Suite")]
];

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
