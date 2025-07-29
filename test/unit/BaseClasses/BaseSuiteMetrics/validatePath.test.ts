import { assert } from 'chai';
import { BaseSuiteMetrics } from "suite-metrics";
import { allInputTypes, valueToHumanReadableString } from "../../../helpers/data.ts";

suite("[BaseSuiteMetrics] validatePath", function() {

    function assertThrows(fn: () => void, expectedMessage: string): void {
        assert.throws(fn, expectedMessage);
    }

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

            test("Accept one element array for suite", function() {
                assertDoesNotThrow(createValidatePathTest(["Suite"], false));
            });

            test("Accept emojis", function() {
                assertDoesNotThrow(createValidatePathTest(["Suite 🚀", "Test ✅"], false));
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
        });
    });

    suite("Valid Path Cases", function() {

        test("Accept strings with leading/trailing spaces (but not whitespace-only)", function() {
            assertDoesNotThrow(createValidatePathTest(["  Suite  ", "  TestName  "], true));
        });

        test("Accept strings with numbers as content", function() {
            assertDoesNotThrow(createValidatePathTest(["Suite123", "Test456"], true));
        });

        test("Accept strings with special characters", function() {
            assertDoesNotThrow(createValidatePathTest(["Suite-Name_1", "Test@Name#2"], true));
        });

        test("Accept strings with unicode characters", function() {
            assertDoesNotThrow(createValidatePathTest(["Suite🚀", "Test✅"], true));
        });
    });

    suite("Edge Cases and Boundary Conditions", function() {
        test("Accept very long path", function() {
            const longPath = Array(100_000).fill(0).map((_, i) => `Level${i}`);
            assertDoesNotThrow(createValidatePathTest(longPath, false));
        });

        test("Accept very long test path", function() {
            const longPath = Array(100_000).fill(0).map((_, i) => `Level${i}`);
            assertDoesNotThrow(createValidatePathTest(longPath, true));
        });

        test("Reject exactly one character empty string", function() {
            assertThrows(
                createValidatePathTest(["Suite", ""], false),
                "Suite path element at index 1 cannot be empty"
            );
        });

        test("Accept exactly one character valid string", function() {
            assertDoesNotThrow(createValidatePathTest(["S", "T"], true));
        });

        test("Test with exactly minimum required elements for test", function() {
            assertDoesNotThrow(createValidatePathTest(["S", "T"], true));
        });

        test("Mixed valid and invalid scenarios - first element invalid", function() {
            assertThrows(
                // @ts-ignore - Testing runtime validation
                createValidatePathTest([123, "ValidSuite"], false),
                "Suite path element at index 0 must be a 'string', got 'number'"
            );
        });

        test("Mixed valid and invalid scenarios - last element invalid", function() {
            assertThrows(
                // @ts-ignore - Testing runtime validation
                createValidatePathTest(["ValidSuite", "AnotherValid", 456], false),
                "Suite path element at index 2 must be a 'string', got 'number'"
            );
        });

        test("Multiple invalid elements - should report first one", function() {
            assertThrows(
                // @ts-ignore - Testing runtime validation
                createValidatePathTest([123, 456, 789], false),
                "Suite path element at index 0 must be a 'string', got 'number'"
            );
        });
    });

    suite("isTest Flag Behavior", function() {
        test("Same path validates differently based on isTest flag", function() {
            const singleElementPath = ["OnlySuite"];

            assertDoesNotThrow(createValidatePathTest(singleElementPath, false));

            assertThrows(
                createValidatePathTest(singleElementPath, true),
                'A test must be inside a suite. E.g. ["Suite 1", "Test 2"] (at least two array elements)'
            );
        });

        test("Empty path validates differently based on isTest flag", function() {
            const emptyPath: string[] = [];

            assertDoesNotThrow(createValidatePathTest(emptyPath, false));

            assertThrows(
                createValidatePathTest(emptyPath, true),
                'A test must be inside a suite. E.g. ["Suite 1", "Test 2"] (at least two array elements)'
            );
        });

        test("Two element path should be valid for both flags", function() {
            const twoElementPath = ["Suite", "Item"];

            assertDoesNotThrow(createValidatePathTest(twoElementPath, false));

            assertDoesNotThrow(createValidatePathTest(twoElementPath, true));
        });
    });

    suite("Error Message Accuracy", function() {
        test("Error messages include correct index for type validation", function() {
            const testCases = [
                { path: [123], expectedIndex: 0 },
                { path: ["Valid", 456], expectedIndex: 1 },
                { path: ["Valid", "Also Valid", 789], expectedIndex: 2 },
                { path: ["A", "B", "C", "D", true], expectedIndex: 4 }
            ];

            testCases.forEach(({ path, expectedIndex }) => {
                assertThrows(
                    // @ts-ignore - Testing runtime validation
                    createValidatePathTest(path, false),
                    `Suite path element at index ${expectedIndex} must be a 'string', got '${typeof path[expectedIndex]}'`
                );
            });
        });

        test("Error messages include correct index for empty string validation", function() {
            const testCases = [
                { path: [""], expectedIndex: 0 },
                { path: ["Valid", ""], expectedIndex: 1 },
                { path: ["Valid", "Also Valid", ""], expectedIndex: 2 }
            ];

            testCases.forEach(({ path, expectedIndex }) => {
                assertThrows(
                    createValidatePathTest(path, false),
                    `Suite path element at index ${expectedIndex} cannot be empty`
                );
            });
        });

        test("Error messages include correct index for whitespace validation", function() {
            const testCases = [
                { path: [" "], expectedIndex: 0 },
                { path: ["Valid", "\t"], expectedIndex: 1 },
                { path: ["Valid", "Also Valid", "\n"], expectedIndex: 2 }
            ];

            testCases.forEach(({ path, expectedIndex }) => {
                assertThrows(
                    createValidatePathTest(path, false),
                    `Suite path element at index ${expectedIndex} cannot be whitespace-only`
                );
            });
        });
    });
});
