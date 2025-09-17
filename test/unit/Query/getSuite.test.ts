import SuiteMetrics, { BaseSuiteMetrics, Suite } from "suite-metrics";
import serialize from "serialize-javascript";
import { createSimpleTestData } from "../../generators/testDataHelpers.ts";

suite("[Query] getSuite", function () {

    /**
     * Gets and deeply validates a suite
     */
    function runTest(instance: BaseSuiteMetrics, suitePath: string[]) {
        const suite: Suite = instance.queries.getSuite(suitePath);
        console.log(`Queried suite: ${serialize(suite, 4)}`);
    }

    test("Simple data", function () {
        const instance: SuiteMetrics = createSimpleTestData() as SuiteMetrics;
        runTest(instance, []);
    });
});
