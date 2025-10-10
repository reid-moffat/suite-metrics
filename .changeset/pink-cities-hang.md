---
"suite-metrics": minor
---

The 'resetInstance()' method clears all data for the singleton instance instead of resetting the reference, not invalidating old references and breaking the state. Refactored code to remove unnecessary fields, improved testing, improve error messages surrounding conureent singleton mutex
