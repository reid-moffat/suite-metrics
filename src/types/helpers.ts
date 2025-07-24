import { Test } from "./structures.ts";

/**
 * Serializable version of Suite
 *
 * Uses objects instead of maps for tests and suites, as Map objects don't have iterators and thus can't be natively
 * serialized
 */
type SerializableSuite = {
    readonly name: string;
    readonly tests: Record<string, Test>;
    readonly subSuites: Record<string, SerializableSuite>;
    readonly aggregateData: {
        readonly numTests: number;
        readonly totalTestTime: number;
    };
};

export type { SerializableSuite };
