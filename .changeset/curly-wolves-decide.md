---
"suite-metrics": patch
---

Cached partial statistic values, optimizing standard deviation calculations after new tests are added (e.g. adding 10 tests to 100,000 tests with a calculated standard deviation only requires looping thrugh the 10 aded tests, not all 100,010)
