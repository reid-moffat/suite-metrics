# suite-metrics

Easily keep track of metrics for many nested test suites

Features:
- Track execution time to microseconds for tests
- Use any amount of nested suites in any structure with tests anywhere
- Metrics for suites, sub-suites and tests
- Simple interface
- [In development] Concurrent test running

## 📦 Installation

```bash
npm i suite-metrics -D

# or
pnpm i suite-metrics -D

# or
yarn add suite-metrics -D
```

## 🚀 Usage

```typescript
import SuiteMetrics from 'suite-metrics';

const metrics = new SuiteMetrics();

metrics.startTest(["Suite Name", "Sub-suite name", "Test Name"]);
// Run test...
metrics.endTest();

// Get metrics - speed, stats, etc
console.log(metrics.printAllSuiteMetrics()); // Simple summary of all tests
metrics.getSuiteMetrics(["Suite Name"]); // Detailed metrics for suite
metrics.getSuiteMetricsRecursive(["Suite Name"]); // Include sub-suites

// Helpers
metrics.suiteExists(["Suite Name"]);
metrics.testExists(["Suite Name", "Test Name"]);
```
