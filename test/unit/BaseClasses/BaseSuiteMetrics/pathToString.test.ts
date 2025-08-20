import { BaseSuiteMetrics } from "suite-metrics";
import { assert } from "chai";

suite("[BaseSuiteMetrics] pathToString", function() {

    test("Single suite", function() {
        const result: string = BaseSuiteMetrics.pathToString(["Suite name"]);

        assert.equal(result, "[Suite name]");
    });

    test("Two suites", function() {
        const result: string = BaseSuiteMetrics.pathToString(["Suite 1", "sub-suite"]);

        assert.equal(result, "[Suite 1, sub-suite]");
    });

    test("Simple test", function() {
        const result: string = BaseSuiteMetrics.pathToString(["Regression", "v2.3.7"]);

        assert.equal(result, "[Regression, v2.3.7]");
    });

    test("Detailed test", function() {
        const result: string = BaseSuiteMetrics.pathToString(["Unit", "getAllResults()", "valid", "n=30"]);

        assert.equal(result, "[Unit, getAllResults(), valid, n=30]");
    });
});
