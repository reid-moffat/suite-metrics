import { BaseSuiteMetrics } from "suite-metrics";
import { assert } from 'chai';
import { allInputTypes, valueToHumanReadableString } from "../../../helpers/data.ts";
import { assertThrows } from "../../../helpers/helpers.js";

suite("[BaseSuiteMetrics] validatePath", function() {

    function assertDoesNotThrow(fn: () => void): void {
        assert.doesNotThrow(fn);
    }

    function createValidatePathTest(path: any, isTest: boolean): () => void {
        return () => BaseSuiteMetrics.validatePath(path, isTest);
    }

    suite("Invalid input types", function() {

        suite("Suite", function() {
            allInputTypes.filter((val) => !Array.isArray(val)).forEach((input: any) => {
                const stringified: string = valueToHumanReadableString(input);

                return test(stringified, function() {
                    assertThrows(
                        createValidatePathTest(input, false),
                        "Suite path must be an array"
                    );
                });
            });
        });

        suite("Test", function() {
            allInputTypes.filter((val) => !Array.isArray(val)).forEach((input: any) => {
                const stringified: string = valueToHumanReadableString(input);

                return test(stringified, function() {
                    assertThrows(
                        createValidatePathTest(input, true),
                        "Test path must be an array"
                    );
                });
            });
        });
    });

    suite("Invalid input array", function() {

        suite("Suite", function() {
            const testCases = [
                {
                    input: [123],
                    expectedError: "Suite path element at index 0 must be a 'string', got 'number'"
                },
                {
                    input: [""],
                    expectedError: "Suite path element at index 0 cannot be empty"
                },
                {
                    input: ["", ""],
                    expectedError: "Suite path element at index 0 cannot be empty"
                },
                {
                    input: [" "],
                    expectedError: "Suite path element at index 0 cannot be whitespace-only"
                },
                {
                    input: [" ", " "],
                    expectedError: "Suite path element at index 0 cannot be whitespace-only"
                },
                {
                    input: [" ".repeat(100_000)],
                    expectedError: "Suite path element at index 0 cannot be whitespace-only"
                },
                {
                    input: [" ".repeat(100_000), " ".repeat(100_000)],
                    expectedError: "Suite path element at index 0 cannot be whitespace-only"
                },

                {
                    input: ["Suite 1", true],
                    expectedError: "Suite path element at index 1 must be a 'string', got 'boolean'"
                },
                {
                    input: ["Suite 1", false, "Suite name"],
                    expectedError: "Suite path element at index 1 must be a 'string', got 'boolean'"
                },
                {
                    input: ["Suite 1", null],
                    expectedError: "Suite path element at index 1 must be a 'string', got 'object'"
                },
                {
                    input: ["Suite 1", undefined],
                    expectedError: "Suite path element at index 1 must be a 'string', got 'undefined'"
                },
                {
                    input: [undefined, "Suite 1"],
                    expectedError: "Suite path element at index 0 must be a 'string', got 'undefined'"
                },
                {
                    input: ["Suite 1", [123]],
                    expectedError: "Suite path element at index 1 must be a 'string', got 'object'"
                },
                {
                    input: ["Suite 1", 221],
                    expectedError: "Suite path element at index 1 must be a 'string', got 'number'"
                },
                {
                    input: ["Suite 1", {}],
                    expectedError: "Suite path element at index 1 must be a 'string', got 'object'"
                },
                {
                    input: ["Suite 1", []],
                    expectedError: "Suite path element at index 1 must be a 'string', got 'object'"
                },
                {
                    input: ["Suite", { name: "Suite 1" }],
                    expectedError: "Suite path element at index 1 must be a 'string', got 'object'"
                },
                {
                    input: ["Suite", () => "suite name"],
                    expectedError: "Suite path element at index 1 must be a 'string', got 'function'"
                },
                {
                    input: ["Suite", 12, "suite name #1"],
                    expectedError: "Suite path element at index 1 must be a 'string', got 'number'"
                },
                {
                    input: ["Suite", "\r", "Test name 1"],
                    expectedError: "Suite path element at index 1 cannot be whitespace-only"
                },
                {
                    input: ["Suite", "\t", "Test name 1"],
                    expectedError: "Suite path element at index 1 cannot be whitespace-only"
                },
                {
                    input: ["Suite", "\n", "Test name 1"],
                    expectedError: "Suite path element at index 1 cannot be whitespace-only"
                },
                {
                    input: ["Suite", "\r\n\t", "Test name 1"],
                    expectedError: "Suite path element at index 1 cannot be whitespace-only"
                }
            ];

            testCases.forEach(({ input, expectedError }) => {
                const testName: string = valueToHumanReadableString(input);

                test(testName, function() {
                    assertThrows(
                        createValidatePathTest(input, false),
                        expectedError
                    );
                });
            });
        });

        suite("Test", function() {
            const testCases: { input: any[], expectedError: string }[] = [
                {
                    input: [],
                    expectedError: "A test must be inside a suite. E.g. [\"Suite 1\", \"Test 2\"] (at least two array elements)"
                },
                {
                    input: ["OnlyOneSuite"],
                    expectedError: "A test must be inside a suite. E.g. [\"Suite 1\", \"Test 2\"] (at least two array elements)"
                },

                {
                    input: [123],
                    expectedError: "A test must be inside a suite. E.g. [\"Suite 1\", \"Test 2\"] (at least two array elements)"
                },
                {
                    input: [""],
                    expectedError: "A test must be inside a suite. E.g. [\"Suite 1\", \"Test 2\"] (at least two array elements)"
                },
                {
                    input: ["", ""],
                    expectedError: "Test path element at index 0 cannot be empty"
                },
                {
                    input: [" "],
                    expectedError: "A test must be inside a suite. E.g. [\"Suite 1\", \"Test 2\"] (at least two array elements)"
                },
                {
                    input: [" ", " "],
                    expectedError: "Test path element at index 0 cannot be whitespace-only"
                },
                {
                    input: [" ".repeat(100_000)],
                    expectedError: "A test must be inside a suite. E.g. [\"Suite 1\", \"Test 2\"] (at least two array elements)"
                },
                {
                    input: [" ".repeat(100_000), " ".repeat(100_000)],
                    expectedError: "Test path element at index 0 cannot be whitespace-only"
                },

                {
                    input: ["Suite 1", true],
                    expectedError: "Test path element at index 1 must be a 'string', got 'boolean'"
                },
                {
                    input: ["Suite 1", false, "Test name"],
                    expectedError: "Test path element at index 1 must be a 'string', got 'boolean'"
                },
                {
                    input: ["Suite 1", null],
                    expectedError: "Test path element at index 1 must be a 'string', got 'object'"
                },
                {
                    input: ["Suite 1", undefined],
                    expectedError: "Test path element at index 1 must be a 'string', got 'undefined'"
                },
                {
                    input: [undefined, "Suite 1"],
                    expectedError: "Test path element at index 0 must be a 'string', got 'undefined'"
                },
                {
                    input: ["Suite 1", [123]],
                    expectedError: "Test path element at index 1 must be a 'string', got 'object'"
                },
                {
                    input: ["Suite 1", 221],
                    expectedError: "Test path element at index 1 must be a 'string', got 'number'"
                },
                {
                    input: ["Suite 1", {}],
                    expectedError: "Test path element at index 1 must be a 'string', got 'object'"
                },
                {
                    input: ["Suite 1", []],
                    expectedError: "Test path element at index 1 must be a 'string', got 'object'"
                },
                {
                    input: ["Suite", { name: "test 1" }],
                    expectedError: "Test path element at index 1 must be a 'string', got 'object'"
                },
                {
                    input: ["Suite", () => "test name"],
                    expectedError: "Test path element at index 1 must be a 'string', got 'function'"
                },
                {
                    input: ["Suite", 12, "Test name 1"],
                    expectedError: "Test path element at index 1 must be a 'string', got 'number'"
                },
                {
                    input: ["Suite", "\r", "Test name 1"],
                    expectedError: "Test path element at index 1 cannot be whitespace-only"
                },
                {
                    input: ["Suite", "\t", "Test name 1"],
                    expectedError: "Test path element at index 1 cannot be whitespace-only"
                },
                {
                    input: ["Suite", "\n", "Test name 1"],
                    expectedError: "Test path element at index 1 cannot be whitespace-only"
                },
                {
                    input: ["Suite", "\r\n\t", "Test name 1"],
                    expectedError: "Test path element at index 1 cannot be whitespace-only"
                }
            ];

            testCases.forEach(({ input, expectedError }) => {
                const testName: string = valueToHumanReadableString(input);

                test(testName, function() {
                    assertThrows(
                        createValidatePathTest(input, true),
                        expectedError
                    );
                });
            });
        });
    });

    suite("Valid inputs", function() {

        suite("Suite", function() {
            test("Accept empty array for suite (top-level suite)", function() {
                assertDoesNotThrow(createValidatePathTest([], false));
            });

            test("Accept one element array for suite", function() {
                assertDoesNotThrow(createValidatePathTest(["Suite"], false));
            });

            test("Accept multi-element suite", function () {
                assertDoesNotThrow(createValidatePathTest(["Suite 1", "Suite 2", "Suite 3", "Suite 4"], false));
            });

            test("Accept long suite", function () {
                const suite: string[] = [];
                const length = 100;
                for (let i = 0; i < length; ++i) {
                    suite.push(`Suite ${i}`);
                }

                assertDoesNotThrow(createValidatePathTest(suite, false));
            });

            test("Accept VERY long suite", function () {
                const suite: string[] = [];
                const length = 100_000;
                for (let i = 0; i < length; ++i) {
                    suite.push(`Suite ${i}`);
                }

                assertDoesNotThrow(createValidatePathTest(suite, false));
            });

            test("Accept shortest input", function() {
                assertDoesNotThrow(createValidatePathTest(["S"], false));
            });

            test("Accept whitespaces (but not empty)", function() {
                assertDoesNotThrow(createValidatePathTest(["    Suite    1     ", " Suite       2              "], false));
            });

            test("Accept lots of whitespaces (but not empty)", function() {
                const spaces: string = "".repeat(100_000);
                assertDoesNotThrow(createValidatePathTest([`${spaces}Suite${spaces}4${spaces}`, `${spaces}Suite${spaces}7${spaces}`], false));
            });

            test("Accept escape characters", function() {
                assertDoesNotThrow(createValidatePathTest(["Suite \n 1 \t", "Suite \r\r\r 222 \t\t\n"], false));
            });

            test("Accept special characters", function() {
                assertDoesNotThrow(createValidatePathTest([" S 5uite@s@#%#@^*^% *%*^%*%!!) "], false));
            });

            test("Accept emojis", function() {
                assertDoesNotThrow(createValidatePathTest(["Suite 🚀", "Suite 2 ✅"], false));
            });
        });

        suite("Test", function() {
            test("Accept two element array for test", function() {
                assertDoesNotThrow(createValidatePathTest(["Suite", "Test"], true));
            });

            test("Accept multi-element array for test", function() {
                assertDoesNotThrow(createValidatePathTest(["Suite", "SubSuite", "SubSubSuite", "Test"], true));
            });

            test("Accept long suite", function () {
                const test: string[] = [];
                const length = 100;
                for (let i = 0; i < length; ++i) {
                    test.push(`Suite ${i}`);
                }
                test.push("Test name");

                assertDoesNotThrow(createValidatePathTest(test, true));
            });

            test("Accept VERY long suite", function () {
                const test: string[] = [];
                const length = 100_000;
                for (let i = 0; i < length; ++i) {
                    test.push(`Suite ${i}`);
                }
                test.push("Test name");

                assertDoesNotThrow(createValidatePathTest(test, true));
            });

            test("Accept shortest input", function() {
                assertDoesNotThrow(createValidatePathTest(["S", "T"], true));
            });

            test("Accept whitespaces (but not empty)", function() {
                assertDoesNotThrow(createValidatePathTest(["    Suite    1     ", " test       2              "], true));
            });

            test("Accept lots of whitespaces (but not empty)", function() {
                const spaces: string = "".repeat(100_000);
                assertDoesNotThrow(createValidatePathTest([`${spaces}Suite${spaces}4${spaces}`, `${spaces}test${spaces}7${spaces}`], true));
            });

            test("Accept escape characters", function() {
                assertDoesNotThrow(createValidatePathTest(["Suite \n 1 \t", "test \r\r\r 222 \t\t\n"], true));
            });

            test("Accept special characters", function() {
                assertDoesNotThrow(createValidatePathTest([" S 5uite@s@#%#@^*^% *%*^%*%!!) ", "te%%%#st"], true));
            });

            test("Accept emojis", function() {
                assertDoesNotThrow(createValidatePathTest(["Suite 🚀", "Test ✅"], true));
            });
        });
    });
});
