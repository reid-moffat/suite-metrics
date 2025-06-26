import { expect } from 'chai';
import SuiteMetrics from "../src/index.ts";
import {
    RecursiveSuiteDataValidate,
    SuiteDataValidate,
    validateRecursiveSuiteData,
    validateSuiteData
} from "./validators.ts";

suite("Basic test suite", function() {

    let metrics: SuiteMetrics;

    setup(function() {
        metrics = new SuiteMetrics();
    });

    test("Simple test", function() {

        metrics.startTest(["Basic test suite", "Simple test"]);
        expect(true).to.equal(true);
        metrics.stopTest();

        expect(metrics.suiteExists(["Basic test suite"])).to.equal(true);
        expect(metrics.testExists(["Basic test suite", "Simple test"])).to.equal(true);

        const suiteData = metrics.getSuiteMetrics(["Basic test suite"]);

        const expected: SuiteDataValidate = {
            name: "Basic test suite",
            parentSuites: null,
            childSuites: null,
            testMetrics: {
                numTests: 1
            }
        };
        validateSuiteData(suiteData, expected);


        const recursiveSuiteData = metrics.getSuiteMetricsRecursive(["Basic test suite"]);

        const expected2: RecursiveSuiteDataValidate = {
            name: "Basic test suite",
            parentSuites: null,
            childSuites: null,
            directTestMetrics: { numTests: 1 },
            subTestMetrics: { numTests: 0 },
            totalTestMetrics: { numTests: 1 }
        };
        validateRecursiveSuiteData(recursiveSuiteData, expected2);

        const metricsStringTL = metrics.printAllSuiteMetrics(true);
        console.log("\nMetrics string (with top-level suite):\n" + metricsStringTL);
        expect(metricsStringTL).to.be.a("string");

        const metricsString = metrics.printAllSuiteMetrics(false);
        console.log("\nMetrics string:\n" + metricsString);
        expect(metricsString).to.be.a("string");


        console.log(JSON.stringify(metrics.getSuiteMetricsRecursive([]), null, 4));
    });

    suite("Sub-suite", () => {
        test("Sub-suite test", () => {
            metrics.startTest(["Basic test suite", "Sub-suite", "Sub-suite test"]);
            expect(false).to.equal(false);
            metrics.stopTest();

            expect(metrics.suiteExists(["Basic test suite", "Sub-suite"])).to.equal(true);
            expect(metrics.testExists(["Basic test suite", "Sub-suite", "Sub-suite test"])).to.equal(true);

            const topLevelSuiteData = metrics.getSuiteMetricsRecursive(["Basic test suite"]);

            const expected: RecursiveSuiteDataValidate = {
                name: "Basic test suite",
                parentSuites: null,
                childSuites: ["Sub-suite"],
                directTestMetrics: { numTests: 0 },
                subTestMetrics: { numTests: 1 },
                totalTestMetrics: { numTests: 1 }
            };
            validateRecursiveSuiteData(topLevelSuiteData, expected);

            const suiteData = metrics.getSuiteMetrics(["Basic test suite", "Sub-suite"]);

            const expected2: SuiteDataValidate = {
                name: "Sub-suite",
                parentSuites: ["Basic test suite"],
                childSuites: null,
                testMetrics: {
                    numTests: 1
                }
            };
            validateSuiteData(suiteData, expected2);


            const recursiveSuiteData = metrics.getSuiteMetricsRecursive(["Basic test suite", "Sub-suite"]);

            const expected3: RecursiveSuiteDataValidate = {
                name: "Sub-suite",
                parentSuites: ["Basic test suite"],
                childSuites: null,
                directTestMetrics: { numTests: 1 },
                subTestMetrics: { numTests: 0 },
                totalTestMetrics: { numTests: 1 }
            };
            validateRecursiveSuiteData(recursiveSuiteData, expected3);

            const metricsStringTL = metrics.printAllSuiteMetrics(true);
            console.log("\nMetrics string (with top-level suite):\n" + metricsStringTL);
            expect(metricsStringTL).to.be.a("string");

            const metricsString = metrics.printAllSuiteMetrics(false);
            console.log("\nMetrics string:\n" + metricsString);
            expect(metricsString).to.be.a("string");
        });
    });
});
