import SuiteMetrics from "suite-metrics";
import serialize from "serialize-javascript";
import { assert } from "chai";

suite("[Statistics] interpretZScore", function () {

    test("Simple data", function() {
        const instance: SuiteMetrics = new SuiteMetrics();
        const interpretation = instance.statistics.interpretZScore(5);
        console.log(`interpretation: ${serialize(interpretation, 4)}`);

        assert.isObject(interpretation);
        assert.hasAllKeys(interpretation, ["interpretation", "severity", "description"]);
    });
});
