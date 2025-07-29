import { assert } from 'chai';
import { BaseSuiteMetrics } from "suite-metrics";
import { allInputTypes, valueToHumanReadableString } from "../../../helpers/data.ts";

suite("[BaseSuiteMetrics] validatePath", function() {

    function assertThrows(fn: () => void, expectedMessage: string): void {
        assert.throws(fn, expectedMessage);
    }

    function assertDoesNotThrow(fn: () => void, description: string): void {
        assert.doesNotThrow(fn, description);
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
            test("Empty array", function() {
                assertThrows(
                    createValidatePathTest([], true),
                    'A test must be inside a suite. E.g. ["Suite 1", "Test 2"] (at least two array elements)'
                );
            });

            test("Single element array", function() {
                assertThrows(
                    createValidatePathTest(["OnlyOneSuite"], true),
                    'A test must be inside a suite. E.g. ["Suite 1", "Test 2"] (at least two array elements)'
                );
            });
        });
    });

    suite("Valid inputs - suite", function() {
        test("Accept empty array for suite (top-level suite)", function() {
            assertDoesNotThrow(
                createValidatePathTest([], false),
                "Should accept empty array (top-level suite) when isTest=false"
            );
        });

        test("Accept one element array for suite", function() {
            assertDoesNotThrow(
                createValidatePathTest(["Suite"], false),
                "Should accept one element array when isTest=false"
            );
        });

        test("Accept multi-element suite", function () {
            assertDoesNotThrow(
                createValidatePathTest(["Suite 1", "Suite 2", "Suite 3", "Suite 4"], false),
                "Should accept multi-one element array when isTest=false"
            );
        });

        test("Accept long suite", function () {
            const suite: string[] = [];
            const length = 100;
            for (let i = 0; i < length; ++i) {
                suite.push(`Suite ${i}`);
            }

            assertDoesNotThrow(
                createValidatePathTest(suite, false),
                "Should accept long array when isTest=false"
            );
        });

        test("Accept VERY long suite", function () {
            const suite: string[] = [];
            const length = 100_000;
            for (let i = 0; i < length; ++i) {
                suite.push(`Suite ${i}`);
            }

            assertDoesNotThrow(
                createValidatePathTest(suite, false),
                "Should accept very long array when isTest=false"
            );
        });
    });

    suite("Valid inputs - test", function (){
        test("Accept two element array for test", function() {
            assertDoesNotThrow(
                createValidatePathTest(["Suite", "Test"], true),
                "Should accept two element array when isTest=true"
            );
        });

        test("Accept multi-element array for test", function() {
            assertDoesNotThrow(
                createValidatePathTest(["Suite", "SubSuite", "SubSubSuite", "Test"], true),
                "Should accept multi-element array when isTest=true"
            );
        });

        test("Accept long suite", function () {
            const test: string[] = [];
            const length = 100;
            for (let i = 0; i < length; ++i) {
                test.push(`Suite ${i}`);
            }
            test.push("Test name");

            assertDoesNotThrow(
                createValidatePathTest(test, true),
                "Should accept long array when isTest=true"
            );
        });

        test("Accept VERY long suite", function () {
            const test: string[] = [];
            const length = 100_000;
            for (let i = 0; i < length; ++i) {
                test.push(`Suite ${i}`);
            }
            test.push("Test name");

            assertDoesNotThrow(
                createValidatePathTest(test, true),
                "Should accept very long array when isTest=true"
            );
        });
    });

    suite("Element Type Validation", function() {
        test("Reject number element at index 0", function() {
            assertThrows(
                // @ts-ignore - Testing runtime validation
                createValidatePathTest([123], false),
                "Suite path element at index 0 must be a 'string', got 'number'"
            );
        });

        test("Reject number element at index 1", function() {
            assertThrows(
                // @ts-ignore - Testing runtime validation
                createValidatePathTest(["Suite", 456], false),
                "Suite path element at index 1 must be a 'string', got 'number'"
            );
        });

        test("Reject number element in middle of path", function() {
            assertThrows(
                // @ts-ignore - Testing runtime validation
                createValidatePathTest(["Suite", "SubSuite", 789, "Test"], true),
                "Test path element at index 2 must be a 'string', got 'number'"
            );
        });

        test("Reject boolean element", function() {
            assertThrows(
                // @ts-ignore - Testing runtime validation
                createValidatePathTest(["Suite", true], false),
                "Suite path element at index 1 must be a 'string', got 'boolean'"
            );
        });

        test("Reject null element", function() {
            assertThrows(
                // @ts-ignore - Testing runtime validation
                createValidatePathTest(["Suite", null], false),
                "Suite path element at index 1 must be a 'string', got 'object'"
            );
        });

        test("Reject undefined element", function() {
            assertThrows(
                // @ts-ignore - Testing runtime validation
                createValidatePathTest(["Suite", undefined], false),
                "Suite path element at index 1 must be a 'string', got 'undefined'"
            );
        });

        test("Reject object element", function() {
            assertThrows(
                // @ts-ignore - Testing runtime validation
                createValidatePathTest(["Suite", { name: "test" }], false),
                "Suite path element at index 1 must be a 'string', got 'object'"
            );
        });

        test("Reject array element", function() {
            assertThrows(
                // @ts-ignore - Testing runtime validation
                createValidatePathTest(["Suite", ["SubArray"]], false),
                "Suite path element at index 1 must be a 'string', got 'object'"
            );
        });

        test("Reject function element", function() {
            assertThrows(
                // @ts-ignore - Testing runtime validation
                createValidatePathTest(["Suite", () => "test"], false),
                "Suite path element at index 1 must be a 'string', got 'function'"
            );
        });
    });

    suite("Element Content Validation - Empty Strings", function() {
        test("Reject empty string at index 0", function() {
            assertThrows(
                createValidatePathTest([""], false),
                "Suite path element at index 0 cannot be empty"
            );
        });

        test("Reject empty string at index 1", function() {
            assertThrows(
                createValidatePathTest(["Suite", ""], false),
                "Suite path element at index 1 cannot be empty"
            );
        });

        test("Reject empty string in middle of path", function() {
            assertThrows(
                createValidatePathTest(["Suite", "SubSuite", "", "Test"], true),
                "Test path element at index 2 cannot be empty"
            );
        });

        test("Reject empty string at end of path", function() {
            assertThrows(
                createValidatePathTest(["Suite", "SubSuite", ""], false),
                "Suite path element at index 2 cannot be empty"
            );
        });
    });

    suite("Element Content Validation - Whitespace Strings", function() {
        test("Reject single space at index 0", function() {
            assertThrows(
                createValidatePathTest([" "], false),
                "Suite path element at index 0 cannot be whitespace-only"
            );
        });

        test("Reject multiple spaces", function() {
            assertThrows(
                createValidatePathTest(["Suite", "   "], false),
                "Suite path element at index 1 cannot be whitespace-only"
            );
        });

        test("Reject tab character", function() {
            assertThrows(
                createValidatePathTest(["Suite", "\t"], false),
                "Suite path element at index 1 cannot be whitespace-only"
            );
        });

        test("Reject newline character", function() {
            assertThrows(
                createValidatePathTest(["Suite", "\n"], false),
                "Suite path element at index 1 cannot be whitespace-only"
            );
        });

        test("Reject carriage return", function() {
            assertThrows(
                createValidatePathTest(["Suite", "\r"], false),
                "Suite path element at index 1 cannot be whitespace-only"
            );
        });

        test("Reject mixed whitespace", function() {
            assertThrows(
                createValidatePathTest(["Suite", " \t\n\r "], false),
                "Suite path element at index 1 cannot be whitespace-only"
            );
        });

        test("Reject whitespace in middle of long path", function() {
            assertThrows(
                createValidatePathTest(["A", "B", "C", " \t ", "E"], false),
                "Suite path element at index 3 cannot be whitespace-only"
            );
        });
    });

    suite("Valid Path Cases", function() {
        test("Accept valid single suite", function() {
            assertDoesNotThrow(
                createValidatePathTest(["ValidSuite"], false),
                "Should accept valid single suite name"
            );
        });

        test("Accept valid nested suite path", function() {
            assertDoesNotThrow(
                createValidatePathTest(["Suite", "SubSuite", "SubSubSuite"], false),
                "Should accept valid nested suite path"
            );
        });

        test("Accept valid test path", function() {
            assertDoesNotThrow(
                createValidatePathTest(["Suite", "TestName"], true),
                "Should accept valid test path"
            );
        });

        test("Accept valid deeply nested test path", function() {
            assertDoesNotThrow(
                createValidatePathTest(["Suite", "SubSuite", "SubSubSuite", "TestName"], true),
                "Should accept valid deeply nested test path"
            );
        });

        test("Accept strings with leading/trailing spaces (but not whitespace-only)", function() {
            assertDoesNotThrow(
                createValidatePathTest(["  Suite  ", "  TestName  "], true),
                "Should accept strings with leading/trailing spaces"
            );
        });

        test("Accept strings with numbers as content", function() {
            assertDoesNotThrow(
                createValidatePathTest(["Suite123", "Test456"], true),
                "Should accept strings containing numbers"
            );
        });

        test("Accept strings with special characters", function() {
            assertDoesNotThrow(
                createValidatePathTest(["Suite-Name_1", "Test@Name#2"], true),
                "Should accept strings with special characters"
            );
        });

        test("Accept strings with unicode characters", function() {
            assertDoesNotThrow(
                createValidatePathTest(["Suite🚀", "Test✅"], true),
                "Should accept strings with unicode characters"
            );
        });
    });

    suite("Edge Cases and Boundary Conditions", function() {
        test("Accept very long path", function() {
            const longPath = Array(100_000).fill(0).map((_, i) => `Level${i}`);
            assertDoesNotThrow(
                createValidatePathTest(longPath, false),
                "Should accept very long valid path"
            );
        });

        test("Accept very long test path", function() {
            const longPath = Array(100_000).fill(0).map((_, i) => `Level${i}`);
            assertDoesNotThrow(
                createValidatePathTest(longPath, true),
                "Should accept very long valid test path"
            );
        });

        test("Reject exactly one character empty string", function() {
            assertThrows(
                createValidatePathTest(["Suite", ""], false),
                "Suite path element at index 1 cannot be empty"
            );
        });

        test("Accept exactly one character valid string", function() {
            assertDoesNotThrow(
                createValidatePathTest(["S", "T"], true),
                "Should accept single character strings"
            );
        });

        test("Test with exactly minimum required elements for test", function() {
            assertDoesNotThrow(
                createValidatePathTest(["S", "T"], true),
                "Should accept exactly two elements for test"
            );
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

            assertDoesNotThrow(
                createValidatePathTest(singleElementPath, false),
                "Should accept single element as suite"
            );

            assertThrows(
                createValidatePathTest(singleElementPath, true),
                'A test must be inside a suite. E.g. ["Suite 1", "Test 2"] (at least two array elements)'
            );
        });

        test("Empty path validates differently based on isTest flag", function() {
            const emptyPath: string[] = [];

            assertDoesNotThrow(
                createValidatePathTest(emptyPath, false),
                "Should accept empty path as suite (top-level)"
            );

            assertThrows(
                createValidatePathTest(emptyPath, true),
                'A test must be inside a suite. E.g. ["Suite 1", "Test 2"] (at least two array elements)'
            );
        });

        test("Two element path should be valid for both flags", function() {
            const twoElementPath = ["Suite", "Item"];

            assertDoesNotThrow(
                createValidatePathTest(twoElementPath, false),
                "Should accept two elements as suite path"
            );

            assertDoesNotThrow(
                createValidatePathTest(twoElementPath, true),
                "Should accept two elements as test path"
            );
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
