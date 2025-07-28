# suite-metrics

[![npm](https://img.shields.io/npm/v/suite-metrics)](https://www.npmjs.com/package/suite-metrics)
[![npm](https://img.shields.io/npm/dt/suite-metrics)](https://www.npmjs.com/package/suite-metrics)
[![npm](https://img.shields.io/npm/l/suite-metrics)](https://www.npmjs.com/package/suite-metrics)

Easily track and aggregate test timing metrics for many nested test suites

Features:
- **Precision Tracking**: Measure test execution time down to microseconds
- **Flexible Nesting**: Organize tests in any number of nested suites with any structure
- **Comprehensive Metrics**: Get aggregate test data, find outliers, and perform statistical tests
- **Easy Interface**: Simple methods calls provided with clear documentation
- **Concurrency Support**: Allows for tracking of multiple concurrent tests safely

## 📦 Installation

```bash
npm i suite-metrics -D

# or
pnpm i suite-metrics -D

# or
yarn add suite-metrics -D
```

## 🚀 Usage

### Setup

If you are not running tests concurrently, use SuiteMetrics:

```typescript
import SuiteMetrics from 'suite-metrics';

// Use as a lazy singleton for easy access across multiple files
const metricsSingleton = SuiteMetrics.getInstance();

// Alternatively, create a new instance for isolated metrics
const metrics = new SuiteMetrics();
```

For running concurrent tests, ConcurrentSuiteMetrics is required:

```typescript
import { ConcurrentSuiteMetrics } from 'suite-metrics';

// Singleton and start/stop test methods are async for thread-safe queues
const concurrentMetricsSingleton = await ConcurrentSuiteMetrics.getInstance();
// or
const concurrentMetrics = new ConcurrentSuiteMetrics();
```

*Note: ConcurrentSuiteMetrics does work fine for sequential tests; however, it requires async calls, a parameter for 
stopTest(), and a bit more overhead with the mutex locks. It is recommended to only use it when required for simplicity*

### Tracking Tests

Standard SuiteMetrics is simple:

```typescript
// Start tracking a test (directly before test logic for best accuracy)
metrics.startTest(["Suite Name", "Sub-suite name", "Test Name"]);

// Execute your test logic here...

// Call directly after test logic completes to stop tracking
metrics.stopTest();
```

Concurrent metrics can run multiple at the same time:

```typescript
const promises = [
    (async () => {
        await concurrentMetrics.startTest(["Suite Name", "Test Name 1"]);
        // Test logic...
        await concurrentMetrics.stopTest(["Suite Name", "Test Name 1"]);
    })(),
    (async () => {
        await concurrentMetrics.startTest(["Suite Name", "Test Name 2"]);
        // Test logic...
        await concurrentMetrics.stopTest(["Suite Name", "Test Name 2"]);
    })(),
    (async () => {
        await concurrentMetrics.startTest(["Suite Name", "Test Name 3"]);
        // Test logic...
        await concurrentMetrics.stopTest(["Suite Name", "Test Name 3"]);
    })()
];

await Promise.all(promises);
```

### Getting Test Data

Both `SuiteMetrics` and `ConcurrentSuiteMetrics` have extensive methods in composite classes:

- **BaseSuiteMetrics**: Base class with simple methods like `getTotalTestCount()` and `getAverageTestDuration()`
- **queries**: Query for Suites and Tests, such as `getTest()` and `suiteExists()`
- **metrics**: Gets aggregate metrics for single or multiple suites
- **performance**: Gets the fastest or slowest test(s) in order
- **statistics**: Helpers for Z-scores and standard deviation

> ⚠️ Important ⚠️: If you are using `ConcurrentSuiteMetrics`, these methods are NOT thread-safe. Do not call while 
> concurrently running tests.

#### BaseSuiteMetrics

```typescript
metrics.validatePath(["Suite 1", "Test 1"], true); // -> valid
metrics.validatePath([], false); // -> invalid (error)

metrics.pathToString(['suite 1', 'sub-suite 2', 'test 3']); // -> "[suite 1, sub-suite 2, test 3]"

metrics.getTestsInOrder(); // Copy of all tests in order they were completed
```

#### queries

```typescript
// Check if a suite or test exists
if (metrics.queries.suiteExists(["Suite Name"])) {
    // ...
}

if (metrics.queries.testExists(["Suite Name", "Test Name"])) {
    // ...
}


// Gets a full Suite or Test object
metrics.queries.getSuite(["Suite 1", "Sub-suite"]); // -> suite's name, tests, sub-suites, and aggregate data

metrics.queries.getTest(["Suite 1", "Sub-suite", "Test 1"]); // -> test's name, timestamps, and metadata


// Get child suite/test names
metrics.queries.getSuiteNames(["Suite 1"]); // -> all suite names directly in this suite

metrics.queries.getTestNames(["Suite 2"]); // -> all test names directly in this suite
```

#### metrics

```typescript
metrics.getTotalTestCount(); // # of completed tests in this metrics instance

metrics.getAverageTestDuration(); // Average test duration for all tests (microseconds)

metrics.metrics.getSuiteMetrics(["Suite Name"]); // -> suite's location and test metrics (direct and sub-suites)

console.log(metrics.metrics.printAllSuiteMetrics()); // -> human-readable summary of all tests
```

#### performance

```typescript
metrics.performance.getSlowestTest(); // -> slowest test overall

metrics.performance.getKSlowestTests(5); // -> the 5 slowests tests overall, in order

metrics.performance.getAllTestsSlowestFirst(); // -> all tests, slowest first

metrics.performance.getFastestTest(); // -> fastest test voerall

metrics.performance.getKFastestTests(10); // -> the 10 fastest tests overall, in order

metrics.performance.getAllTestsFastestFirst(); // -> all tests, slowest first
```

#### statistics

```typescript
metrics.statistics.getStandardDeviation(); // -> standard deviation for all test times combined

metrics.statistics.getTestZScore(/* <test object> */); // -> Z-score for the test (e.g. 0.7)

metrics.statistics.getAllTestsWithZScores(); // -> every test with their Z-score

metrics.statistics.interpretZScore(2); // -> human-readable z score interpretation (e.g. below)
result = {
    interpretation: 'Unusual performance',
    severity: 'unusual',
    description: 'Test is unusually slow'
}
```

## ⏱️ Performance & Time Complexity

### Overview
This package uses **lazy loading** and **caching** to optimize performance, making most operations `O(1)` constant time.

### Non-Constant Operations

| Operation | Complexity | Notes                                                                                         |
|-----------|------------|-----------------------------------------------------------------------------------------------|
| **ConcurrentSuiteMetrics methods** | `O(k)` | `k` = number of waiting operations. Very fast in practice (~few ms for 100 concurrent tests)  |
| **Getting/Adding Suites/Tests** | `O(k)` | `k` = depth of Suite/Test in hierarchy. Minimal for typical use cases                         |
| **Returning multiple Suites/Tests** | `O(k)` | `k` = number of items returned. Requires a deep copy to prevent reference leaks               |
| **Performance methods** | `O(n log n)` → `O(k)` | Cache rebuild when tests added, then `O(k)` for subsequent calls (returning `k` Tests)        |
| **Statistics methods** | `O(n)` → `O(1)` | Cache rebuild when tests added, then constant time (except `getAllTestsWithZScores` which is `O(n)`) |
| **JSON export & printing** | `O(n)` | `toJSON()` and `printAllSuiteMetrics()` require a full traverse                               |

> **Note**: `interpretZScore()` is always `O(1)` and doesn't require cache rebuilds.

### ⚡ Performance Best Practices

- **Test execution**: Run all tests before gathering metrics to ensure cache rebuilds only run once
- **Suite depth**: Keep suite hierarchies reasonable (avoid 100s of deeply nested suites)
- **Bulk operations**: Minimize repeated calls to methods returning large datasets (10,000+ tests)

### Real-World Performance
In typical scenarios, performance overhead is **negligible** due to efficient caching. For large cases (~10,000+ tests),
following the recommended patterns above to reduce overhead.
