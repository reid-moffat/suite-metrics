import Suites from "../helpers/Suites.ts";

/**
 * Methods for calculating overall test metrics
 */
class Metrics {

    // Ref to suites instance with all this metrics' data
    private readonly suites: Suites;

    constructor(suites: Suites) {
        this.suites = suites;
    }
}

export default Metrics;
