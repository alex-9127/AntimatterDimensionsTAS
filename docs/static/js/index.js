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

function updateSpinboxes() {
    const g = Number(galaxiesSpinbox.value);
    dimboostsSpinbox.max = maxDimboosts[g];
    if (Number(dimboostsSpinbox.value) > Number(dimboostsSpinbox.max)) {
        dimboostsSpinbox.value = dimboostsSpinbox.max
    }
}

function clampSpinboxes() {
    if (Number(dimboostsSpinbox.value) > Number(dimboostsSpinbox.max)) {
        dimboostsSpinbox.value = dimboostsSpinbox.max
    }
    if (Number(dimboostsSpinbox.value) < Number(dimboostsSpinbox.min)) {
        dimboostsSpinbox.value = dimboostsSpinbox.min
    }
    if (Number(galaxiesSpinbox.value) > Number(galaxiesSpinbox.max)) {
        galaxiesSpinbox.value = galaxiesSpinbox.max
    }
    if (Number(galaxiesSpinbox.value) < Number(galaxiesSpinbox.min)) {
        galaxiesSpinbox.value = galaxiesSpinbox.min
    }
}

async function loadInstructions() {
    const g = Number(galaxiesSpinbox.value);
    const d = Number(dimboostsSpinbox.value);
    const response = await fetch(`./data/g${g}d${d}.json`)
    instructionTable.replaceChildren();
    if (!response.ok) return;
    const instructions = await response.json();
    var maxArgs = 0;
    for (const [_i, [_name, args]] of instructions.entries()) {
        maxArgs = Math.max(maxArgs, args.length);
    }
    for (const [i, [name, args]] of instructions.entries()) {
        const row = instructionTable.insertRow();
        row.insertCell().textContent = `${i+1}`
        const instrName = instructionMapping[name];
        if (instrName.includes("Konami")) {
            const cell = document.createElement("span");
            cell.className = "hint";
            cell.textContent = instrName;
            cell.dataset.tooltip = `
            Input most of konami code (up, up, down, down, left, right, left, right, B, A)
            before buying 1st Dimension, then press Enter immediately after.
            After doing that, export the save as soon as possible, then reimport it repeatedly
            for 30 seconds to get Achievement 44 - this saves some time in several dimboosts.
            `;
            row.insertCell().appendChild(cell);
        } else {
            row.insertCell().textContent = instrName;
        }
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
