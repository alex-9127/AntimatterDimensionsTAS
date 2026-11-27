const galaxiesSpinbox = document.getElementById("galaxiesSpinbox");
const dimboostsSpinbox = document.getElementById("dimboostsSpinbox");
const instructionTable = document.getElementById("instructionTable");

const maxDimboosts = [8, 11, 15];

const instructionMapping = {
    'speedrunTricks': 'Konami Code and Over in 0 seconds tricks',
    'buyDimension': 'Dimension',
    'buyTickSpeed': 'Tickspeed',
    'buyDimensionBoost': 'Dimension Boost',
    'buyGalaxyReset': 'Antimatter Galaxy',
    'trySacrificeReset': 'Dimensional Sacrifice',
    'tryBigCrunchReset': 'Big Crunch'
}

const argNames = {
    'Dimension': ['Tier', 'Amount'],
    'Dimensional Sacrifice': ['Bonus'],
}

// cache fetch responses.
const cache = {}

function updateSpinboxes() {
    // parseInt is safer than Number(). 
    const val = parseInt(galaxiesSpinbox.value);
    const max = parseInt(dimboostsSpinbox.max = maxDimboosts[val]);

    if (parseInt(dimboostsSpinbox.value) > max) {
        dimboostsSpinbox.value = max;
    }
}

function clampSpinboxes() {
    const dimboostval = parseInt(dimboostsSpinbox.value);
    const dimboostmax = parseInt(dimboostsSpinbox.max);
    const dimboostmin = parseInt(dimboostsSpinbox.min);

    const galaxyval = parseInt(galaxiesSpinbox.value);
    const galaxymax = parseInt(galaxiesSpinbox.max);
    const galaxymin = parseInt(galaxiesSpinbox.min);

    if (dimboostval > dimboostmax) {
        dimboostsSpinbox.value = dimboostsSpinbox.max
    } else if (dimboostval < dimboostmin) {
        dimboostsSpinbox.value = dimboostsSpinbox.min
    }

    if (galaxyval > galaxymax) {
        galaxiesSpinbox.value = galaxiesSpinbox.max
    } else if (galaxyval < galaxymin) {
        galaxiesSpinbox.value = galaxiesSpinbox.min
    }
}

async function getOrCacheFetchable(path) {
    if (path in cache) {
        return cache[path];
    } else {
        try {
            var data = await fetch(path);
            var json = await data.json();

        } catch(e) {
            throw new Error(e);
        }

        cache[path] = json;

        return json;
    }
}

// the instruction name is the hint. 
function handlehint(hint) {
    if (hint.includes('Konami')) {
        const cell = document.createElement('span');

        cell.className = 'hint';
        cell.textContent = hint;

        cell.dataset.tooltip = `
        Input most of konami code (up, up, down, down, left, right, left, right, B, A)
        before buying 1st Dimension, then press Enter immediately after.
        After doing that, export the save as soon as possible, then reimport it repeatedly
        for 30 seconds to get Achievement 44 - this saves some time in several dimboosts.
        `;

        return cell;
    // default to returning a cell with textcontent as the hint, to allow handlehint to be in charge of the name
    // as well as the node itself.
    } else {
        const cell = document.createElement("span");
        cell.textContent = hint;

        return cell;
    }
}

async function loadInstructions() {
    const g = parseInt(galaxiesSpinbox.value);
    const d = parseInt(dimboostsSpinbox.value);

    const path = `./data/g${g}d${d}.json`;
    const instructions = await getOrCacheFetchable(path);

    const maxArgs = Math.max(...instructions.map(entry => entry[1].length));
    
    instructionTable.replaceChildren();

    for (const [i, [name, args]] of instructions.entries()) {
        const row = instructionTable.insertRow();
        const instrName = instructionMapping[name];
        const node = handlehint(instrName);

        row.insertCell().appendChild(node);

        for (var j = 0; j < maxArgs; j++) {
            const cell = row.insertCell();

            if (j < args.length) {
                if (j == 0 && args[j] == 0) continue;

                cell.textContent = `${argNames[instrName][j]}: ${args[j]}`;
            }
        }
    }
}

galaxiesSpinbox.addEventListener("input", () => {
    clampSpinboxes();
    updateSpinboxes();
    loadInstructions();
});

dimboostsSpinbox.addEventListener("input", () => {
    clampSpinboxes();
    updateSpinboxes();
    loadInstructions();
});

window.onload = function() {
    clampSpinboxes();
    updateSpinboxes();
    loadInstructions();
}
