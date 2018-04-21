# A simple 'Heads & Tails' game log analyzer application.

Usage:
```
node gamelog_analyzer.js --logFile FILE --toss TOSS
```

Options:
```
-l, --logFile FILE     Read game log from a JSON file FILE.
```

A game log analyzer app, outputs some game session statistics to stdout.
The user must define log file name with the option *-l* / *--logFile* **FILE** (string).
