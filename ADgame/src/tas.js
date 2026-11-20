import { bigCrunchReset, buyOneDimension, buyTickSpeed, GameIntervals, GameStorage, requestDimensionBoost, requestGalaxyReset, sacrificeReset } from "./core/globals"
import { gainedInfinityPoints } from "./game";
import { pathsToFiles } from "./pathsOfFiles";
import { dispatch } from "./tasUI/injectUI";

export const TAS = {
    _isRunning: false,
    tickSwitch: true,

    instructions: [],
    currentInstruction: 0,

    lastCycleInstruction: 0,
    cycleCounter: 0,

    queue: [],
    segments: [],

    /*
     --- debug binary bitmask ---
     debug = -1 for all
     debug & 1 === logging
     debug & 2 === write output to ui
    */
    variables: {
        debug: 0,
        tick: 0,
        exportedSave: null,
        startTime: null,
    },

    intervals: {},

    runNextPendingInstruction() {
        if (!this._isRunning) {
            return;
        }

        let isSuccessful = true;

        while (isSuccessful) {
            isSuccessful = this.runOneInstruction(this.currentInstruction);

            if (isSuccessful) {
                if (TAS.variables.debug & 1) dumpLog();

	            this.currentInstruction += 1;
            }
        }
    },

    runOneInstruction(index) {
        if (index >= this.instructions.length) {
            this.pause();
            this.export();
            return;
        }

        let instruction = this.instructions[index];

        return instruction.run();
    },

    getSegments(pathsToInstructions, startSave) {
        TAS.segments = [startSave];

        let i = 0;
        TAS.intervals["segmentInterval"] = setInterval(async function() {
            if (!TAS._isRunning) {
                console.log(i);
                
                if (i >= pathsToInstructions.length) {
                    TAS.segments.push(GameStorage.exportModifiedSave());
                    console.log('TAS ended');
                    TAS.removeInterval("segmentInterval");

                    return;
                }

                if (TAS.variables.exportedSave !== null) {
                    TAS.segments.push(TAS.variables.exportedSave);
                }

                if (TAS.variables.debug & 2) {
                    dispatch('inst3', pathsToInstructions[i].replace('\\input\\instructions\\', ''));
                }

                await TAS.prepareAndStart([pathsToInstructions[i]], TAS.segments[i]);
                i++;
            }
        }, 2000);
    },
 
    removeInterval(id) {
        if (id in TAS.intervals) {
            clearInterval(TAS.intervals[id]);
            delete TAS.intervals[id];
            return true;
        }

        console.log(`ID: ${id} is not registered in segmentIntervals.`);

        return false;
    },

    removeAllIntervals() {
        for (const id of Object.keys(this.intervals)) {
            this.removeInterval(id);
        }
    },

    async prepareAndStart(pathsToInstructions, pathToSave=null) {
        await TAS.prepare(pathsToInstructions, pathToSave);

        TAS.start();
    },

    async prepare(pathsToInstructions, save) {
        save ??= pathsToFiles.saves[0];

        if (save?.includes('\\input')) {
            save = await getSave(save);
        }

        TAS.reset(save);


        let max = pathsToInstructions.length;
        for (let i = 0; i < max; i++) {
            console.log(`Loading instructions: (${i}/${max})`);

            await TAS.getInstructions(pathsToInstructions[i]);
            TAS.loadInstructions();
        }

        console.log("Finished loading instructions");
    },

    importSave(save) {
        if (save?.includes('AntimatterDimensions')) {

            console.log("Save found, importing");

            GameStorage.import(save);

            return true;
        } else {
            console.log("Save String is invalid, hard resetting");
            dev.hardReset();
            Speedrun.prepareSave();

            return true;
        }
    },


    async getInstructions(path) {
        try {
            const response = await fetch(path);

            if (!response.ok) 
                throw new Error(`Error fetching save from ${path}. ${response.status}`);

            const commands = await response.json();

            TAS.queue = commands.map(([fn, args]) => ({
                fn,
                args,
                action: actions[fn],
                run() {
                    return this.action(...this.args);
                }
            }));

            return true;

        } catch(e) {
            throw new Error(`Error parsing path to save: ${path}`, {cause: e});
        };
    },

    loadInstructions() {
        TAS.instructions.push(...TAS.queue);

        TAS.queue = [];

        return true;
    },

    start() {
        console.log("TAS started running");
        this.variables.startTime = Date.now();
        this._isRunning = true;

        this.variables.dimPurchasesLeft = undefined;
        GameIntervals.restart();
        this.runNextPendingInstruction();

        return true;
    },

    reset(save=null) {
        this.importSave(save);
        this.variables.startTime = null;

        this.pause();
        this.variables.startTime = player.records.realTimePlayed;
        this.tickSwitch = true;

        this.instructions = [];
        this.currentInstruction = 0;
        this.variables.tick = 0;

        return true;
    },

    hardReset() {
        this.reset();
        this.removeInterval('segmentInterval');
    },

    pause() {
        GameIntervals.stop();
        
        TAS._isRunning = false;
        return true;
    },

    export() {
        console.log("TAS finished running, exporting save:");
        GameStorage.save();

        TAS.variables.exportedSave = GameStorage.exportModifiedSave();

        return console.log(TAS.variables.exportedSave);
    },

    get nextBoost() {
        let amount = AntimatterDimension(1).amount;
        let sacrificed = player.sacrificed.clampMin(1);
        let unweighted = amount.add(sacrificed);
        let weighted = new Decimal((unweighted.log10() / 10) / Math.max(sacrificed.log10() / 10, 1));

        return weighted.clampMin(1).pow(Sacrifice.sacrificeExponent);
    }
};

// actions are performed by TAS instructions
// with arguments passed in.
export const actions = {
    ["buyOneDimension"]     :   buyOneDimension,
    ["buyDimension"]        :   buyDimension,
    ["buyTickSpeed"]        :   buyTickSpeed,
    ["buyDimensionBoost"]   :   buyDimensionBoost,
    ["buyGalaxyReset"]      :   requestGalaxyReset,

    ["trySacrificeReset"]   :   trySacrificeReset,
    ["tryBigCrunchReset"]   :   tryBigCrunchReset,

    ["getInstruction"]      :   TAS.getInstructions,
    ["loadInstruction"]     :   TAS.loadInstructions,

    ["wait"]                :   waitNextTick,
    ["startCycle"]          :   startCycle,
    ["endCycle"]            :   endCycle,

    ["dp"]                  :   simulateEvent,

    ["exportSave"]          :   exportSave,
    ["importSave"]          :   importSave
};

export async function getSave(path=null) {
    if (!path) 
        path = pathsToFiles.saves[0];

    const response = await fetch(path);

    if (!response.ok) 
        throw new Error(`Error fetching save at path: ${path}`);

    return (await response.text()).trim();
};

export const dumpLog = () =>
    console.log(`
        Instruction  : ${TAS.currentInstruction}, 
        cycleCounter : ${TAS.cycleCounter},
        tick         : ${TAS.variables.tick},
        realtime     : ${(Date.now() - TAS.variables.startTime).toFixed(0)},
        gametime     : ${player.records.realTimePlayed}
    `);

const dispatch_events = () => {
    if (TAS.variables.debug & 2) {
        const { cycleCounter, currentInstruction, instructions } = TAS;
        dispatch('cycle', cycleCounter ?? 0);
        dispatch('inst1', currentInstruction);
        dispatch('inst2', instructions[currentInstruction]?.fn + ' ' + instructions[currentInstruction]?.args?.join(' '));
        dispatch('gala1', player.galaxies);
        dispatch('dimb1', player.dimensionBoosts);
        dispatch('time1', new Date(player.records.realTimePlayed).toISOString().slice(11,23));
        dispatch('time2', new Date(Date.now() - TAS.variables.startTime).toISOString().slice(11, 23));
    }
}

export function tasTick() {
    TAS.variables.tick++;

    dispatch_events();

    TAS.runNextPendingInstruction();

    return true;
};

export function waitNextTick() {
    return TAS.tickSwitch = !TAS.tickSwitch;
}

export function startCycle(count) {
    TAS.cycleCounter = count;

    TAS.lastCycleInstruction = TAS.currentInstruction;

    return true;
};

export function endCycle() {
    TAS.cycleCounter -= 1;

    if (TAS.cycleCounter > 0) {
        TAS.currentInstruction = TAS.lastCycleInstruction;
    }

    return true;
};

export function exportSave() {
    TAS.variables.save = GameStorage.exportModifiedSave();

    return true;
};

export function importSave() {
    GameStorage.import(TAS.variables.save);

    return true;
};

export function simulateEvent(type, key, keyCode) {
    const event = new KeyboardEvent(type, {
        key,
        keyCode: keyCode,
        which: keyCode
    });

    return document.dispatchEvent(event);
};



export function buyDimension(tier, times) {
    if (TAS.variables.dimPurchasesLeft === undefined) {
        TAS.variables.dimPurchasesLeft = times;
    }

    let successfulPurchase = true;
    while (successfulPurchase) {
        successfulPurchase = buyOneDimension(tier);

        if (successfulPurchase) {
            TAS.variables.dimPurchasesLeft--;
        }

        if (TAS.variables.dimPurchasesLeft <= 0) {
            TAS.variables.dimPurchasesLeft = undefined;

            return true;
        }
    }

    return false;
}

export function buyDimensionBoost() {
    let oldValue = player.dimensionBoosts;

    requestDimensionBoost();

    let newValue = player.dimensionBoosts;

    return oldValue !== newValue;
};

export function trySacrificeReset(value) {
    if (new Decimal(value).divideBy(Sacrifice.totalBoost).lte(TAS.nextBoost)) {
        sacrificeReset();
        return true;
    }

    return false;
};

export function tryBigCrunchReset(goal) {
    if (!Player.canCrunch || gainedInfinityPoints().lt(Decimal.pow10(goal))) {
        return false;
    }

    bigCrunchReset(false, false);

    return true;
};