import SuiteMetrics from "suite-metrics";
import serialize from "serialize-javascript";
import { assert } from "chai";

suite("[Statistics] interpretZScore", function () {

    // Expected when |Z| < 1
    const normalInterpretation = () => {
        return {
            interpretation: 'Within normal range',
            severity: 'normal',
            description: 'Test performance is close to average'
        }
    };

    // Expected when 1 <= |Z| < 2
    const notableInterpretation = (score: number) => {
        return {
            interpretation: 'Notable deviation',
            severity: 'notable',
            description: `Test is notably ${score > 0 ? "slower" : "faster"} than average`
        }
    };

    // Expected when 2 <= |Z| < 3
    const unusualInterpretation = (score: number) => {
        return {
            interpretation: 'Unusual performance',
            severity: 'unusual',
            description: `Test is unusually ${score > 0 ? "slow" : "fast"}`
        }
    };

    // Expected when |Z| >= 3
    const extremeInterpretation = (score: number) => {
        return {
            interpretation: 'Extreme outlier',
            severity: 'extreme',
            description: `Test is extremely ${score > 0 ? "slow" : "fast"} (potential issue)`
        }
    };

    test("Simple data", function() {
        const instance: SuiteMetrics = new SuiteMetrics();
        const interpretation = instance.statistics.interpretZScore(5);
        console.log(`interpretation: ${serialize(interpretation, 4)}`);

        assert.isObject(interpretation);
        assert.hasAllKeys(interpretation, ["interpretation", "severity", "description"]);
    });
});
