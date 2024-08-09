import { expect } from 'chai';
import SuiteMetrics from "../src/index.ts";

suite("Basic test suite", () => {
    test("start test", () => {
        const metrics = new SuiteMetrics();
        metrics.startTest(["Basic test suite", "start test"]);
        expect(true).to.equal(true);
        metrics.stopTest();

        expect(metrics.suiteExists(["Basic test suite"])).to.equal(true);
        expect(metrics.testExists(["Basic test suite", "start test"])).to.equal(true);

        const suiteData = metrics.getSuiteMetrics(["Basic test suite"]);
        console.log("Suite metrics: " + JSON.stringify(suiteData, null, 4));
        expect(suiteData.name).to.equal("Basic test suite");
        expect(suiteData.parentSuites).to.deep.equal([]);
        expect(suiteData.childSuites).to.equal(null);
        expect(suiteData.testMetrics.numTests).to.equal(1);
        expect(suiteData.testMetrics.totalTime).to.be.a("number");
        expect(suiteData.testMetrics.averageTime).to.be.a("number");

        const recursiveSuiteData = metrics.getSuiteMetricsRecursive(["Basic test suite"]);
        console.log("\nRecursive suite metrics: " + JSON.stringify(recursiveSuiteData, null, 4));
        expect(recursiveSuiteData.name).to.equal("Basic test suite");
        expect(recursiveSuiteData.parentSuites).to.deep.equal([]);
        expect(recursiveSuiteData.childSuites).to.equal(null);

        expect(recursiveSuiteData.directTestMetrics.numTests).to.equal(1);
        expect(recursiveSuiteData.directTestMetrics.totalTime).to.be.a("number");
        expect(recursiveSuiteData.directTestMetrics.averageTime).to.be.a("number");

        expect(recursiveSuiteData.subTestMetrics.numTests).to.equal(0);
        expect(recursiveSuiteData.subTestMetrics.totalTime).to.equal(0);
        expect(recursiveSuiteData.subTestMetrics.averageTime).to.equal(null);

        expect(recursiveSuiteData.totalTestMetrics.numTests).to.equal(1);
        expect(recursiveSuiteData.totalTestMetrics.totalTime).to.be.a("number");
        expect(recursiveSuiteData.totalTestMetrics.averageTime).to.be.a("number");

        const metricsStringTL = metrics.printAllSuiteMetrics(true);
        console.log("\nMetrics string (with top-level suite):\n" + metricsStringTL);
        expect(metricsStringTL).to.be.a("string");

        const metricsString = metrics.printAllSuiteMetrics(false);
        console.log("\nMetrics string:\n" + metricsString);
        expect(metricsString).to.be.a("string");
    });
});
