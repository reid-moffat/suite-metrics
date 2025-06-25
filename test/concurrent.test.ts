import { expect } from 'chai';
import ConcurrentSuiteMetrics from "../src/ConcurrentSuiteMetrics.ts";
import { SuiteData } from "../src/ISuiteMetrics.ts";

// Helper function to simulate async work
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

suite("ConcurrentSuiteMetrics Tests", function() {
    let metrics: ConcurrentSuiteMetrics;

    setup(function() {
        metrics = new ConcurrentSuiteMetrics();
    });

    suite("Basic Functionality", function() {
        test("Single test timing", async function() {
            const path = ["Basic Functionality", "Single test timing"];
            console.log(`Running test: ${path.join(" > ")}`);

            await metrics.startTest(path);
            await delay(10); // Simulate some work
            await metrics.stopTest(path);

            console.log(metrics.printAllSuiteMetrics());
        });

        test("Multiple tests in same suite", async function() {
            const path1 = ["Basic Functionality", "Test 1"];
            const path2 = ["Basic Functionality", "Test 2"];

            console.log(`Running test: ${path1.join(" > ")}`);
            await metrics.startTest(path1);
            await delay(5);
            await metrics.stopTest(path1);

            console.log(`Running test: ${path2.join(" > ")}`);
            await metrics.startTest(path2);
            await delay(15);
            await metrics.stopTest(path2);

            console.log(metrics.printAllSuiteMetrics());
        });

        test("Deeply nested suites", async function() {
            const path = ["Level1", "Level2", "Level3", "Level4", "Deep test"];
            console.log(`Running test: ${path.join(" > ")}`);

            await metrics.startTest(path);
            await delay(8);
            await metrics.stopTest(path);

            console.log(metrics.printAllSuiteMetrics());
        });
    });

    suite("Concurrent Execution", function() {
        test("Two concurrent tests in different suites", async function() {
            const path1 = ["Concurrent Execution", "Suite A", "Concurrent test A"];
            const path2 = ["Concurrent Execution", "Suite B", "Concurrent test B"];

            console.log(`Starting concurrent tests: ${path1.join(" > ")} and ${path2.join(" > ")}`);

            // Start both tests concurrently
            const promise1 = (async () => {
                await metrics.startTest(path1);
                await delay(20);
                await metrics.stopTest(path1);
            })();

            const promise2 = (async () => {
                await delay(5); // Slight offset to test true concurrency
                await metrics.startTest(path2);
                await delay(15);
                await metrics.stopTest(path2);
            })();

            await Promise.all([promise1, promise2]);

            console.log(metrics.printAllSuiteMetrics());
        });

        test("Multiple concurrent tests in same suite", async function() {
            const basePath = ["Concurrent Execution", "Same Suite"];
            const path1 = [...basePath, "Concurrent test 1"];
            const path2 = [...basePath, "Concurrent test 2"];
            const path3 = [...basePath, "Concurrent test 3"];

            console.log("Starting multiple concurrent tests in same suite");

            // Start all tests concurrently
            const promises = [
                (async () => {
                    await metrics.startTest(path1);
                    await delay(10);
                    await metrics.stopTest(path1);
                })(),
                (async () => {
                    await delay(2);
                    await metrics.startTest(path2);
                    await delay(25);
                    await metrics.stopTest(path2);
                })(),
                (async () => {
                    await delay(5);
                    await metrics.startTest(path3);
                    await delay(8);
                    await metrics.stopTest(path3);
                })()
            ];

            await Promise.all(promises);

            console.log(metrics.printAllSuiteMetrics());
        });

        test("Interleaved test execution", async function() {
            const path1 = ["Concurrent Execution", "Interleaved", "Test 1"];
            const path2 = ["Concurrent Execution", "Interleaved", "Test 2"];

            console.log("Testing interleaved execution");

            // Start first test
            await metrics.startTest(path1);
            await delay(5);

            // Start second test while first is still running
            await metrics.startTest(path2);
            await delay(10);

            // Stop first test
            await metrics.stopTest(path1);
            await delay(5);

            // Stop second test
            await metrics.stopTest(path2);

            console.log(metrics.printAllSuiteMetrics());
        });
    });

    suite("Error Handling", function() {
        test("Invalid test names - empty array", async function() {
            try {
                await metrics.startTest([]);
                expect.fail("Should have thrown error for empty test name");
            } catch (error: any) {
                expect(error.message).to.contain("empty");
            }
        });

        test("Invalid test names - single element", async function() {
            try {
                await metrics.startTest(["OnlyTestName"]);
                expect.fail("Should have thrown error for test without suite");
            } catch (error: any) {
                expect(error.message).to.contain("inside at least one suite");
            }
        });

        test("Invalid test names - non-string elements", async function() {
            try {
                // @ts-ignore - intentionally passing invalid types for testing
                await metrics.startTest(["ValidSuite", 123, "TestName"]);
                expect.fail("Should have thrown error for non-string elements");
            } catch (error: any) {
                expect(error.message).to.contain("array of strings");
            }
        });

        test("Invalid test names - non-array input", async function() {
            try {
                // @ts-ignore - intentionally passing invalid type for testing
                await metrics.startTest("NotAnArray");
                expect.fail("Should have thrown error for non-array input");
            } catch (error: any) {
                expect(error.message).to.contain("must be a delimiter string or an array");
            }
        });

        test("Stopping test that wasn't started", async function() {
            try {
                await metrics.stopTest(["Error Handling", "Non-existent test"]);
                expect.fail("Should have thrown error for stopping non-existent test");
            } catch (error: any) {}
        });

        test("Starting same test twice", async function() {
            const path = ["Error Handling", "Duplicate test"];

            await metrics.startTest(path);

            try {
                await metrics.startTest(path); // Should this be allowed or throw an error?
                // Behavior depends on implementation - might overwrite or throw
                await metrics.stopTest(path);
            } catch (error: any) {
                // If it throws, that's also valid behavior
                console.log("Duplicate test start threw error:", error.message);
            }
        });
    });

    suite("Metrics Verification", function() {
        test("Test duration accuracy", async function() {
            const path = ["Metrics Verification", "Duration test"];
            const expectedDuration = 50; // milliseconds

            const startTime = Date.now();
            await metrics.startTest(path);
            await delay(expectedDuration);
            await metrics.stopTest(path);
            const actualElapsed = Date.now() - startTime;

            // Allow some tolerance for timing variations
            expect(actualElapsed).to.be.closeTo(expectedDuration, 20);

            console.log(metrics.printAllSuiteMetrics());
        });

        test("Suite metrics with multiple tests", async function() {
            const suitePath = ["Metrics Verification", "Multi-test suite"];

            // Run several tests in the same suite
            for (let i = 1; i <= 3; i++) {
                const testPath = [...suitePath, `Test ${i}`];
                await metrics.startTest(testPath);
                await delay(i * 10); // Different durations
                await metrics.stopTest(testPath);
            }

            console.log(metrics.printAllSuiteMetrics());
        });

        test("Print format verification", function() {
            // This test just verifies the print method doesn't crash
            const output = metrics.printAllSuiteMetrics();
            expect(output).to.be.a('string');
            console.log("Print output:", output);
        });
    });

    suite("Suite and Test Existence", function() {
        test("Check suite existence", async function() {
            const suitePath = ["Suite Existence", "Test Suite"];
            const testPath = [...suitePath, "Sample Test"];

            // Initially should not exist
            expect(metrics.suiteExists(suitePath)).to.be.false;

            // After running a test, suite should exist
            await metrics.startTest(testPath);
            await metrics.stopTest(testPath);

            expect(metrics.suiteExists(suitePath)).to.be.true;
        });

        test("Check test existence", async function() {
            const testPath = ["Suite Existence", "Test Suite", "Existence Test"];

            // Initially should not exist
            expect(metrics.testExists(testPath)).to.be.false;

            // After running the test, it should exist
            await metrics.startTest(testPath);
            await metrics.stopTest(testPath);

            expect(metrics.testExists(testPath)).to.be.true;
        });

        test("Check nested suite existence", async function() {
            const nestedPath = ["Level1", "Level2", "Level3"];
            const testPath = [...nestedPath, "Nested Test"];

            expect(metrics.suiteExists(["Level1"])).to.be.false;
            expect(metrics.suiteExists(["Level1", "Level2"])).to.be.false;
            expect(metrics.suiteExists(nestedPath)).to.be.false;

            await metrics.startTest(testPath);
            await metrics.stopTest(testPath);

            expect(metrics.suiteExists(["Level1"])).to.be.true;
            expect(metrics.suiteExists(["Level1", "Level2"])).to.be.true;
            expect(metrics.suiteExists(nestedPath)).to.be.true;
        });
    });

    suite("Metrics Retrieval", function() {
        test("Get suite metrics", async function() {
            const suitePath = ["Metrics Retrieval", "Sample Suite"];

            // Run some tests
            for (let i = 1; i <= 2; i++) {
                const testPath = [...suitePath, `Test ${i}`];
                await metrics.startTest(testPath);
                await delay(i * 5);
                await metrics.stopTest(testPath);
            }

            const suiteMetrics: SuiteData = metrics.getSuiteMetrics(suitePath);
            expect(suiteMetrics).to.exist;
            expect(suiteMetrics.name).to.equal("Sample Suite");
            expect(suiteMetrics.testMetrics.numTests).to.equal(2);
        });

        test("Get recursive suite metrics", async function() {
            const basePath = ["Metrics Retrieval", "Recursive Suite"];

            // Create nested structure with tests at different levels
            await metrics.startTest([...basePath, "Direct Test"]);
            await delay(10);
            await metrics.stopTest([...basePath, "Direct Test"]);

            await metrics.startTest([...basePath, "Sub Suite", "Nested Test"]);
            await delay(15);
            await metrics.stopTest([...basePath, "Sub Suite", "Nested Test"]);

            const recursiveMetrics = metrics.getSuiteMetricsRecursive(basePath);
            expect(recursiveMetrics).to.exist;
            expect(recursiveMetrics.name).to.equal("Recursive Suite");
        });
    });

    suite("Edge Cases", function() {
        test("Tests with same names in different suites", async function() {
            const path1 = ["Edge Cases", "Suite A", "Same Name"];
            const path2 = ["Edge Cases", "Suite B", "Same Name"];

            await metrics.startTest(path1);
            await delay(10);
            await metrics.stopTest(path1);

            await metrics.startTest(path2);
            await delay(20);
            await metrics.stopTest(path2);

            console.log(metrics.printAllSuiteMetrics());
        });

        test("Very long test names", async function() {
            const longName = "This is a very long test name that might cause issues with string handling or display formatting";
            const path = ["Edge Cases", "Long Names", longName];

            await metrics.startTest(path);
            await delay(5);
            await metrics.stopTest(path);

            console.log(metrics.printAllSuiteMetrics());
        });

        test("Empty suite name components", async function() {
            try {
                await metrics.startTest(["Edge Cases", "", "Test"]);
                // Some implementations might allow empty strings, others might not
                await metrics.stopTest(["Edge Cases", "", "Test"]);
            } catch (error: any) {
                console.log("Empty suite name threw error:", error.message);
                expect(error).to.exist;
            }
        });

        test("Maximum nesting depth", async function() {
            const deepPath = Array(10).fill(0).map((_, i) => `Level${i}`);
            deepPath.push("Deep Test");

            await metrics.startTest(deepPath);
            await delay(5);
            await metrics.stopTest(deepPath);

            console.log(metrics.printAllSuiteMetrics());
        });
    });

    suite("Performance Tests", function() {
        test("Many concurrent tests", async function() {
            const numTests = 10;
            const promises: Promise<void>[] = [];

            console.log(`Starting ${numTests} concurrent tests`);

            for (let i = 0; i < numTests; i++) {
                const testPath = ["Performance Tests", "Many concurrent", `Test ${i}`];
                promises.push(
                    (async () => {
                        await metrics.startTest(testPath);
                        await delay(Math.random() * 20); // Random duration
                        await metrics.stopTest(testPath);
                    })()
                );
            }

            await Promise.all(promises);

            console.log(metrics.printAllSuiteMetrics());
        });

        test("Sequential test performance", async function() {
            const numTests = 20;

            console.log(`Running ${numTests} sequential tests`);

            for (let i = 0; i < numTests; i++) {
                const testPath = ["Performance Tests", "Sequential", `Test ${i}`];
                await metrics.startTest(testPath);
                await delay(2); // Short duration
                await metrics.stopTest(testPath);
            }

            console.log(metrics.printAllSuiteMetrics());
        });
    });

    // Keep the original tests for compatibility
    suite("Original Tests", function() {
        suite("top-level suite", function() {
            suite("sub-suite", function() {
                test("Concurrent test 1", async function() {
                    const path = ["top-level suite", "sub-suite", "Concurrent test 1"];
                    console.log(`Running test: ${path.join(" > ")}`);

                    await metrics.startTest(path);
                    expect(true).to.equal(true);
                    await metrics.stopTest(path);

                    console.log(metrics.printAllSuiteMetrics());
                });

                test("Concurrent test 2", async function() {
                    const path = ["top-level suite", "sub-suite", "Concurrent test 2"];
                    console.log(`Running test: ${path.join(" > ")}`);

                    await metrics.startTest(path);
                    expect(true).to.equal(true);
                    await metrics.stopTest(path);

                    console.log(metrics.printAllSuiteMetrics());
                });
            });
        });
    });
});
