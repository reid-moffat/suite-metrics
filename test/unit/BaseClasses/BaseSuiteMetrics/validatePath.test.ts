import { assert } from 'chai';
import { BaseSuiteMetrics } from "suite-metrics";
import { allInputTypes, valueToHumanReadableString } from "../../../helpers/data.ts";

suite("[BaseSuiteMetrics] validatePath", function() {

    function assertThrowsWithMessage(fn: () => void, expectedMessage: string, description: string): void {
        assert.throws(fn, expectedMessage, description);
    }

    function assertDoesNotThrow(fn: () => void, description: string): void {
        assert.doesNotThrow(fn, description);
    }

    function createValidatePathTest(path: any, isTest: boolean): () => void {
        return () => BaseSuiteMetrics.validatePath(path, isTest);
    }

    function createPathWithInvalidElement(validPrefix: string[], invalidElement: any, validSuffix: string[] = []): any[] {
        return [...validPrefix, invalidElement, ...validSuffix];
    }

    suite("Invalid input types", function() {

        allInputTypes.filter((val) => !Array.isArray(val)).forEach((input: any) => {
            const stringified: string = valueToHumanReadableString(input);

            return test(stringified, function() {
                assertThrowsWithMessage(
                    createValidatePathTest(input, false),
                    "Suite/test path must be an array",
                    `Should reject '${stringified}' input`
                );
            });
        });
    });

    suite("Invalid path length/elements", function() {
        test("Reject empty array for test", function() {
            assertThrowsWithMessage(
                createValidatePathTest([], true),
                'A test must be inside a suite. E.g. ["Suite 1", "Test 2"] (at least two array elements)',
                "Should reject empty array when isTest=true"
            );
        });

        test("Reject single element array for test", function() {
            assertThrowsWithMessage(
                createValidatePathTest(["OnlyOneSuite"], true),
                'A test must be inside a suite. E.g. ["Suite 1", "Test 2"] (at least two array elements)',
                "Should reject single element array when isTest=true"
            );
        });

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
    });

    suite("Path Length Validation for Suites", function() {
        test("Accept empty array for suite", function() {
            assertDoesNotThrow(
                createValidatePathTest([], false),
                "Should accept empty array when isTest=false (top-level suite)"
            );
        });

        test("Accept single element array for suite", function() {
            assertDoesNotThrow(
                createValidatePathTest(["Suite"], false),
                "Should accept single element array when isTest=false"
            );
        });

        test("Accept multi-element array for suite", function() {
            assertDoesNotThrow(
                createValidatePathTest(["Suite", "SubSuite", "SubSubSuite"], false),
                "Should accept multi-element array when isTest=false"
            );
        });
    });

    suite("Element Type Validation", function() {
        test("Reject number element at index 0", function() {
            assertThrowsWithMessage(
                // @ts-ignore - Testing runtime validation
                createValidatePathTest([123], false),
                "Suite/test path element at index 0 must be a 'string', got 'number'",
                "Should reject number at first position"
            );
        });

        test("Reject number element at index 1", function() {
            assertThrowsWithMessage(
                // @ts-ignore - Testing runtime validation
                createValidatePathTest(["Suite", 456], false),
                "Suite/test path element at index 1 must be a 'string', got 'number'",
                "Should reject number at second position"
            );
        });

        test("Reject number element in middle of path", function() {
            assertThrowsWithMessage(
                // @ts-ignore - Testing runtime validation
                createValidatePathTest(["Suite", "SubSuite", 789, "Test"], true),
                "Suite/test path element at index 2 must be a 'string', got 'number'",
                "Should reject number in middle position"
            );
        });

        test("Reject boolean element", function() {
            assertThrowsWithMessage(
                // @ts-ignore - Testing runtime validation
                createValidatePathTest(["Suite", true], false),
                "Suite/test path element at index 1 must be a 'string', got 'boolean'",
                "Should reject boolean element"
            );
        });

        test("Reject null element", function() {
            assertThrowsWithMessage(
                // @ts-ignore - Testing runtime validation
                createValidatePathTest(["Suite", null], false),
                "Suite/test path element at index 1 must be a 'string', got 'object'",
                "Should reject null element"
            );
        });

        test("Reject undefined element", function() {
            assertThrowsWithMessage(
                // @ts-ignore - Testing runtime validation
                createValidatePathTest(["Suite", undefined], false),
                "Suite/test path element at index 1 must be a 'string', got 'undefined'",
                "Should reject undefined element"
            );
        });

        test("Reject object element", function() {
            assertThrowsWithMessage(
                // @ts-ignore - Testing runtime validation
                createValidatePathTest(["Suite", { name: "test" }], false),
                "Suite/test path element at index 1 must be a 'string', got 'object'",
                "Should reject object element"
            );
        });

        test("Reject array element", function() {
            assertThrowsWithMessage(
                // @ts-ignore - Testing runtime validation
                createValidatePathTest(["Suite", ["SubArray"]], false),
                "Suite/test path element at index 1 must be a 'string', got 'object'",
                "Should reject array element"
            );
        });

        test("Reject function element", function() {
            assertThrowsWithMessage(
                // @ts-ignore - Testing runtime validation
                createValidatePathTest(["Suite", () => "test"], false),
                "Suite/test path element at index 1 must be a 'string', got 'function'",
                "Should reject function element"
            );
        });
    });

    suite("Element Content Validation - Empty Strings", function() {
        test("Reject empty string at index 0", function() {
            assertThrowsWithMessage(
                createValidatePathTest([""], false),
                "Suite/test path element at index 0 cannot be empty",
                "Should reject empty string at first position"
            );
        });

        test("Reject empty string at index 1", function() {
            assertThrowsWithMessage(
                createValidatePathTest(["Suite", ""], false),
                "Suite/test path element at index 1 cannot be empty",
                "Should reject empty string at second position"
            );
        });

        test("Reject empty string in middle of path", function() {
            assertThrowsWithMessage(
                createValidatePathTest(["Suite", "SubSuite", "", "Test"], true),
                "Suite/test path element at index 2 cannot be empty",
                "Should reject empty string in middle position"
            );
        });

        test("Reject empty string at end of path", function() {
            assertThrowsWithMessage(
                createValidatePathTest(["Suite", "SubSuite", ""], false),
                "Suite/test path element at index 2 cannot be empty",
                "Should reject empty string at end of path"
            );
        });
    });

    suite("Element Content Validation - Whitespace Strings", function() {
        test("Reject single space at index 0", function() {
            assertThrowsWithMessage(
                createValidatePathTest([" "], false),
                "Suite/test path element at index 0 cannot be whitespace-only",
                "Should reject single space at first position"
            );
        });

        test("Reject multiple spaces", function() {
            assertThrowsWithMessage(
                createValidatePathTest(["Suite", "   "], false),
                "Suite/test path element at index 1 cannot be whitespace-only",
                "Should reject multiple spaces"
            );
        });

        test("Reject tab character", function() {
            assertThrowsWithMessage(
                createValidatePathTest(["Suite", "\t"], false),
                "Suite/test path element at index 1 cannot be whitespace-only",
                "Should reject tab character"
            );
        });

        test("Reject newline character", function() {
            assertThrowsWithMessage(
                createValidatePathTest(["Suite", "\n"], false),
                "Suite/test path element at index 1 cannot be whitespace-only",
                "Should reject newline character"
            );
        });

        test("Reject carriage return", function() {
            assertThrowsWithMessage(
                createValidatePathTest(["Suite", "\r"], false),
                "Suite/test path element at index 1 cannot be whitespace-only",
                "Should reject carriage return"
            );
        });

        test("Reject mixed whitespace", function() {
            assertThrowsWithMessage(
                createValidatePathTest(["Suite", " \t\n\r "], false),
                "Suite/test path element at index 1 cannot be whitespace-only",
                "Should reject mixed whitespace characters"
            );
        });

        test("Reject whitespace in middle of long path", function() {
            assertThrowsWithMessage(
                createValidatePathTest(["A", "B", "C", " \t ", "E"], false),
                "Suite/test path element at index 3 cannot be whitespace-only",
                "Should reject whitespace in middle of long path"
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
            assertThrowsWithMessage(
                createValidatePathTest(["Suite", ""], false),
                "Suite/test path element at index 1 cannot be empty",
                "Should reject exactly one character empty string"
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
            assertThrowsWithMessage(
                // @ts-ignore - Testing runtime validation
                createValidatePathTest([123, "ValidSuite"], false),
                "Suite/test path element at index 0 must be a 'string', got 'number'",
                "Should report first invalid element"
            );
        });

        test("Mixed valid and invalid scenarios - last element invalid", function() {
            assertThrowsWithMessage(
                // @ts-ignore - Testing runtime validation
                createValidatePathTest(["ValidSuite", "AnotherValid", 456], false),
                "Suite/test path element at index 2 must be a 'string', got 'number'",
                "Should report last invalid element"
            );
        });

        test("Multiple invalid elements - should report first one", function() {
            assertThrowsWithMessage(
                // @ts-ignore - Testing runtime validation
                createValidatePathTest([123, 456, 789], false),
                "Suite/test path element at index 0 must be a 'string', got 'number'",
                "Should report first invalid element when multiple are invalid"
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

            assertThrowsWithMessage(
                createValidatePathTest(singleElementPath, true),
                'A test must be inside a suite. E.g. ["Suite 1", "Test 2"] (at least two array elements)',
                "Should reject single element as test"
            );
        });

        test("Empty path validates differently based on isTest flag", function() {
            const emptyPath: string[] = [];

            assertDoesNotThrow(
                createValidatePathTest(emptyPath, false),
                "Should accept empty path as suite (top-level)"
            );

            assertThrowsWithMessage(
                createValidatePathTest(emptyPath, true),
                'A test must be inside a suite. E.g. ["Suite 1", "Test 2"] (at least two array elements)',
                "Should reject empty path as test"
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
                assertThrowsWithMessage(
                    // @ts-ignore - Testing runtime validation
                    createValidatePathTest(path, false),
                    `Suite/test path element at index ${expectedIndex} must be a 'string', got '${typeof path[expectedIndex]}'`,
                    `Should report correct index ${expectedIndex} for type error`
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
                assertThrowsWithMessage(
                    createValidatePathTest(path, false),
                    `Suite/test path element at index ${expectedIndex} cannot be empty`,
                    `Should report correct index ${expectedIndex} for empty string error`
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
                assertThrowsWithMessage(
                    createValidatePathTest(path, false),
                    `Suite/test path element at index ${expectedIndex} cannot be whitespace-only`,
                    `Should report correct index ${expectedIndex} for whitespace error`
                );
            });
        });
    });
});
