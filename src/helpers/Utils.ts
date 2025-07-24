import { Test } from "../types/structures.ts";

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
}

export default Utils;
