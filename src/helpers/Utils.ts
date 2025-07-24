import { Suite, Test } from "../types/structures.ts";

/**
 * Miscellaneous helper methods
 */
class Utils {

    /**
     * Creates a deep copy of a Test object to prevent external modifications
     */
    public static deepCopyTest(test: Test): Test {
        return {
            ...test,
            path: [...test.path]
        };
    }

    /**
     * Creates a deep copy of an array of Test objects to prevent external modifications
     */
    public static deepCopyTests(tests: Test[]): Test[] {
        return tests.map((test: Test): Test => this.deepCopyTest(test));
    }

    /**
     * Creates a deep copy of a Suite object to prevent external modifications
     */
    public static deepCopySuite(suite: Suite): Suite {
        // Deep copy the tests Map
        const copiedTests = new Map<string, Test>();
        for (const [testName, test] of suite.tests) {
            copiedTests.set(testName, Utils.deepCopyTest(test));
        }

        // Deep copy the subSuites Map (recursive)
        const copiedSubSuites = new Map<string, Suite>();
        for (const [suiteName, subSuite] of suite.subSuites) {
            copiedSubSuites.set(suiteName, this.deepCopySuite(subSuite));
        }

        return {
            name: suite.name,
            tests: copiedTests,
            subSuites: copiedSubSuites,
            aggregateData: {
                numTests: suite.aggregateData.numTests,
                totalTestTime: suite.aggregateData.totalTestTime
            }
        };
    }
}

export default Utils;
