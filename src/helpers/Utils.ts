import { Suite } from "../types/structures.ts";

/**
 * Miscellaneous helper methods
 */
class Utils {

    /**
     * Creates a deep copy of a Suite object to prevent external modifications
     */
    public static deepCopySuite(suite: Suite): Suite {

        // Deep copy the subSuites Map (recursive)
        const copiedSubSuites = new Map<string, Suite>();
        for (const [suiteName, subSuite] of suite.subSuites) {
            copiedSubSuites.set(suiteName, this.deepCopySuite(subSuite));
        }

        return {
            name: suite.name,
            tests: suite.tests,
            subSuites: copiedSubSuites,
            aggregateData: {
                numTests: suite.aggregateData.numTests,
                totalTestTime: suite.aggregateData.totalTestTime
            }
        };
    }
}

export default Utils;
