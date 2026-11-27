# Antimatter Dimensions TAS

## Disclaimer

This is a fork of Antimatter Dimensions project. Original repository link can be found [here](https://github.com/IvarK/AntimatterDimensionsSourceCode).

License of the project can be found [here](https://github.com/alex9127git/AntimatterDimensionsTAS/blob/master/LICENSE).

## Run game

To run the game locally, you will need to install
[Node.js](https://nodejs.org/) (LTS suggested).

First, run the following command in your terminal (or command line) while being
inside the checked out repository (inside ADgame folder):

```
npm ci
```

After all the packages are installed, start up the game:

```
npm run serve
```

This will make the game served via your localhost, and the playable link will
be displayed in your terminal. The server **doesn't** need to be restarted
after you've made changes - just reload the page. The server **can**
occasionally crash, so check your terminal from time to time and run `serve`
again if needed.

Upon loading the game you will notice a floating panel labeled "Advanced Layout (for) Easy Execution."
This and the TAS framework that exists under /src are not a part of the base game experience
and are currently experimental features for running the instruction sets in a controlled environment
with a custom prebuilt interpreter.

Because of the framework, light modifications to the base game are made.
This includes adding TAS.tick() to two parts of the original game, found in the game loop,
as well as hard coding the diff passed into the loop to be equal to update rate set in Options for consistency. 
Outside of these, no additional modifications are made.
There is no current documentation written up for the use of the TAS/TAS GUI.

## Run simulation

You will need a C++ compiler (preferably g++) that supports **C++20**, as well as **CMake** with a version of at least **3.23**.

Build the ./ADsimulation/src folder - it will automatically run tests for the project and make a valud executable.

The executable itself can be run without arguments in interactive mode, or passed following arguments:

* `-i` to pass an input .json file that encodes a valid simulation game state.
If not specified, the simulation will automatically create a defaul game state equivalent to the one you would get
when starting the game from a hard reset.

* `-o` to specify an output .json file that will be created. It will encode the resulting game state in a simulation format.
Must be specified.

* `-c` to specify a .json file for storing command sequence of the found optimal strategy.
If not specified, the resulting strategy will not be saved to a file.

**WARNING: The program is quite resource-intensive and can potentially take up to 10 gigabytes of RAM and half of the available CPU cores.**
While there are some measures that should prevent the program take all of your compute power, it is strongly recommended 
to set the program run under a watchdog that terminates the program if it takes up more than a certain limit of RAM.

The default amount of CPU cores used is half of all the CPU cores available (i.e., it will use 6 cores if machine has 12 cores available). 
This can be overriden by using the OMP_NUM_THREADS environment variable and setting it to specify the number of cores you wish to use.
