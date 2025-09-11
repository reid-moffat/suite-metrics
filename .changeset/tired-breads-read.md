---
"suite-metrics": minor
---

Main update:
* Fully freeze all suite and test data with Immer, prevent all state-breaking external updates
* Removed unnecessary Suite copying (immutable), significantly improving query performance
* Made suite aggregateData fields readonly

Minor additions:
* Slight start time accuracy improvement
* Clarified paths are readonly as parameters
* Clarified Test start & end times are relative to epoch
* Added path to Suite object
* Method documentation improvements
* Minor error message clarity improvements
* Minor refactoring for clarity and efficiency
* Fixed CI/CD testing gaps
