# A simple 'Heads & Tails' game application.

Usage:
```
node heads_tails.js --logFile FILE --toss TOSS
```

Options:
```
-l, --logFile FILE     Write game log to a JSON file FILE.
-t, --toss TOSS        Number of coin tosses for one game round.
```

A simple game of *Heads&Tails*. A player inputs **1** or **2** for the sides of a coin or **q** to end the round.
Game log is written in the *logs* folder with the game start timestamp file name. The user can redefine log file name with the option *-l* / *--logFile* **FILE** (string).
The user can set a number of coin tosses for one game round with the option *-t* / *--toss* **TOSS** (number).
A game session consists of one or more game rounds, until the player cancels the game.
