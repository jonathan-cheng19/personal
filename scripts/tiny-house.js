import * as THREE from "https://unpkg.com/three@0.155.0/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.155.0/examples/jsm/controls/OrbitControls.js";
import { Sky } from "https://unpkg.com/three@0.155.0/examples/jsm/objects/Sky.js";

// Flag so the HTML shell can detect whether the module executed successfully.
globalThis.__tinyHouseStudioLoaded = true;
const moduleWarning = document.getElementById("moduleLoadWarning");
if (moduleWarning) moduleWarning.hidden = true;

const ui = {
    generate: document.getElementById("generate"),
    variantCount: document.getElementById("variantCount"),
    variantLabel: document.getElementById("variantCountLabel"),
    headerVariantBadge: document.getElementById("headerVariantBadge"),
    headerStatus: document.getElementById("headerStatus"),
    headerEnvironment: document.getElementById("headerEnvironment"),
    environmentSelect: document.getElementById("environment"),
    designList: document.getElementById("designList"),
    activeDesignTitle: document.getElementById("activeDesignTitle"),
    layoutSummary: document.getElementById("layoutSummary"),
    highlightPills: document.getElementById("highlightPills"),
    marketInsights: document.getElementById("marketInsights"),
    materialsTable: document.querySelector("#materialsTable tbody"),
    timelineInsights: document.getElementById("timelineInsights"),
    financialInsights: document.getElementById("financialInsights"),
    systemsInsights: document.getElementById("systemsInsights"),
    envelopeInsights: document.getElementById("envelopeInsights"),
    climateRisk: document.getElementById("climateRisk"),
    climateStrategies: document.getElementById("climateStrategies"),
    metricArea: document.getElementById("metricArea"),
    metricCarbon: document.getElementById("metricCarbon"),
    metricEnergy: document.getElementById("metricEnergy"),
    simulatePrint: document.getElementById("simulatePrint"),
    recordVideo: document.getElementById("recordVideo"),
    simulationStatus: document.getElementById("simulationStatus"),
    videoPreview: document.getElementById("videoPreview"),
    simulationVideo: document.getElementById("simulationVideo"),
    downloadLink: document.getElementById("downloadLink"),
    generationProgress: document.getElementById("generationProgress"),
    generationProgressFill: document.getElementById("generationProgressFill"),
    generationProgressLabel: document.getElementById("generationProgressLabel"),
};

const lensToggles = {
    roof: document.getElementById("toggleRoof"),
    walls: document.getElementById("toggleWalls"),
    structure: document.getElementById("toggleStructure"),
    systems: document.getElementById("toggleSystems"),
};

function updateVariantCountLabel() {
    if (!ui.variantCount || !ui.variantLabel) return;
    const label = `${ui.variantCount.value} layouts queued`;
    ui.variantLabel.textContent = label;
    if (ui.headerVariantBadge) {
        ui.headerVariantBadge.textContent = ui.variantCount.value;
    }
}

function formatEnvironmentLabel(value) {
    const option = ui.environmentSelect?.querySelector(`option[value="${value}"]`);
    if (option) return option.textContent;
    if (!value) return "—";
    return value
        .split(/[-_\s]/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

function setEnvironmentLabel(value) {
    if (ui.headerEnvironment) {
        ui.headerEnvironment.textContent = formatEnvironmentLabel(value);
    }
}

function setSimulationStatus(message) {
    if (ui.simulationStatus) {
        ui.simulationStatus.textContent = message;
    }
    if (ui.headerStatus) {
        ui.headerStatus.textContent = message;
    }
}

const yieldToFrame = () =>
    new Promise((resolve) =>
        (typeof requestAnimationFrame === "function" ? requestAnimationFrame(resolve) : setTimeout(resolve, 16))
    );

function showGenerationProgress(total) {
    if (!ui.generationProgress) return;
    ui.generationProgress.hidden = false;
    ui.generationProgress.classList.remove("success", "error");
    if (ui.generationProgressFill) {
        ui.generationProgressFill.style.width = "0%";
    }
    if (ui.generationProgressLabel) {
        ui.generationProgressLabel.textContent = total
            ? `Synthesizing layout 0 of ${total}…`
            : "Synthesizing layouts…";
    }
}

function updateGenerationProgress(current, total) {
    if (!ui.generationProgress || !ui.generationProgressFill) return;
    const percent = total ? Math.min(98, Math.max(0, Math.round((current / total) * 100))) : 0;
    ui.generationProgressFill.style.width = `${percent}%`;
    if (ui.generationProgressLabel) {
        ui.generationProgressLabel.textContent = total
            ? `Synthesizing layout ${current} of ${total}…`
            : `Synthesizing layout ${current}…`;
    }
    setSimulationStatus(
        total ? `Synthesizing layout ${current} of ${total}…` : `Synthesizing layout ${current}…`
    );
}

function completeGenerationProgress({ message, success = true } = {}) {
    if (!ui.generationProgress) return;
    ui.generationProgress.classList.remove("success", "error");
    if (success) {
        ui.generationProgress.classList.add("success");
        if (ui.generationProgressFill) {
            ui.generationProgressFill.style.width = "100%";
        }
    } else {
        ui.generationProgress.classList.add("error");
        if (ui.generationProgressFill) {
            ui.generationProgressFill.style.width = "12%";
        }
    }
    if (ui.generationProgressLabel && message) {
        ui.generationProgressLabel.textContent = message;
    }
    setTimeout(() => {
        if (!ui.generationProgress) return;
        ui.generationProgress.hidden = true;
        ui.generationProgress.classList.remove("success", "error");
        if (ui.generationProgressFill) {
            ui.generationProgressFill.style.width = "0%";
        }
    }, success ? 1200 : 2200);
}

if (ui.variantCount) {
    ui.variantCount.addEventListener("input", updateVariantCountLabel);
    updateVariantCountLabel();
}

setEnvironmentLabel(ui.environmentSelect?.value);

ui.environmentSelect?.addEventListener("change", (event) => {
    setEnvironmentLabel(event.target.value);
});

document.querySelectorAll("[data-collapsible]").forEach((group) => {
    const header = group.querySelector("header");
    if (!header) return;
    header.addEventListener("click", () => {
        group.classList.toggle("collapsed");
    });
});

document.querySelectorAll(".viewport-tabs button").forEach((btn) => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".viewport-tabs button").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const tab = btn.dataset.tab;
        document.querySelectorAll("[data-tab-panel]").forEach((panel) => {
            panel.classList.toggle("active", panel.dataset.tabPanel === tab);
        });
    });
});

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("three-canvas"), antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(8, 6, 10);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 1.2, 0);

const ambient = new THREE.HemisphereLight(0xe0f2fe, 0x0f172a, 0.65);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xffffff, 1.05);
sun.position.set(10, 15, 8);
sun.castShadow = true;
scene.add(sun);

const sky = new Sky();
sky.scale.setScalar(450000);
scene.add(sky);
const skyUniforms = sky.material.uniforms;
skyUniforms["turbidity"].value = 8;
skyUniforms["rayleigh"].value = 0.3;
skyUniforms["mieCoefficient"].value = 0.005;
skyUniforms["mieDirectionalG"].value = 0.7;

const sunSphere = new THREE.Vector3();
function updateSun(elevation = 50, azimuth = 120) {
    const phi = THREE.MathUtils.degToRad(90 - elevation);
    const theta = THREE.MathUtils.degToRad(azimuth);
    sunSphere.setFromSphericalCoords(1, phi, theta);
    sun.position.copy(sunSphere.clone().multiplyScalar(50));
    sun.target.position.set(0, 0, 0);
}
updateSun();

const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 80),
    new THREE.MeshStandardMaterial({ color: 0x1e293b })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const lensGroups = {
    roof: new THREE.Group(),
    walls: new THREE.Group(),
    structure: new THREE.Group(),
    systems: new THREE.Group(),
};

Object.values(lensGroups).forEach((group) => scene.add(group));

const environmentGroup = new THREE.Group();
scene.add(environmentGroup);

function clearGroups() {
    Object.values(lensGroups).forEach((group) => {
        while (group.children.length) {
            group.remove(group.children[0]);
        }
    });
}

function applyLensVisibility() {
    lensGroups.roof.visible = lensToggles.roof.checked;
    lensGroups.walls.children.forEach((mesh) => {
        mesh.material.opacity = lensToggles.walls.checked ? 0.95 : 0.25;
        mesh.material.transparent = true;
        mesh.material.needsUpdate = true;
    });
    lensGroups.structure.visible = lensToggles.structure.checked;
    lensGroups.systems.visible = lensToggles.systems.checked;
}

Object.values(lensToggles).forEach((toggle) => toggle.addEventListener("change", applyLensVisibility));

const state = {
    designs: [],
    activeDesign: null,
    animation: null,
    mediaRecorder: null,
    recordedChunks: [],
    environment: "auto",
};

const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

function randomUint32() {
    if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
        const buffer = new Uint32Array(1);
        crypto.getRandomValues(buffer);
        return buffer[0];
    }
    return Math.floor(Math.random() * 0xffffffff);
}

function seededRandom(seed) {
    let t = seed += 0x6d2b79f5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function generateLayout(seed, params) {
    const rand = () => seededRandom((seed = (seed * 1664525 + 1013904223) >>> 0));
    const area = params.area;
    const floors = Number(params.floors);
    const baseLength = Math.sqrt(area * (rand() * 0.4 + 0.8));
    const baseWidth = area / baseLength;
    const roomCount = params.bedrooms + params.bathrooms + 2;
    const rooms = [];
    const modules = Math.max(4, Math.round(roomCount * (rand() * 0.4 + 0.9)));
    const moduleWidth = baseWidth / Math.max(2, Math.round(rand() * 3 + 2));
    const moduleLength = baseLength / Math.max(2, Math.round(rand() * 3 + 2));

    let x = -baseWidth / 2;
    let z = -baseLength / 2;
    for (let i = 0; i < modules; i++) {
        const width = moduleWidth * (rand() * 0.6 + 0.6);
        const length = moduleLength * (rand() * 0.6 + 0.6);
        rooms.push({
            id: `module-${i}`,
            width,
            length,
            height: 3 * floors,
            x: x + width / 2,
            z: z + length / 2,
            type: assignRoomType(i, params, rand),
        });
        x += width;
        if (x > baseWidth / 2) {
            x = -baseWidth / 2;
            z += moduleLength;
        }
    }

    const connectors = Array.from({ length: Math.max(1, Math.round(rand() * 2 + floors)) }, (_, idx) => ({
        id: `core-${idx}`,
        x: (rand() - 0.5) * baseWidth * 0.6,
        z: (rand() - 0.5) * baseLength * 0.6,
        radius: rand() * 0.8 + 0.6,
        type: rand() > 0.6 ? "atrium" : "service",
    }));

    const features = {
        glazingRatio: 0.25 + rand() * 0.35,
        roofType: randomChoice(["Butterfly", "Mono-Pitch", "Gable", "Green Roof", "Solar Canopy"]),
        facade: randomChoice(["Engineered Timber", "Basalt Composite", "Upcycled Aluminum", "Ceramic Panels"]),
        lighting: randomChoice(["Dynamic Circadian", "Smart Dimmable", "Daylight Harvesting"]),
        shading: randomChoice(["Electrochromic", "Kinetic Louvers", "Retractable Awning"]),
    };

    return {
        id: `Design-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        rooms,
        connectors,
        floors,
        footprint: { width: baseWidth, length: baseLength },
        features,
        params,
    };
}

function assignRoomType(index, params, rand) {
    const palette = [
        "Great Room",
        "Kitchen",
        "Dining Nook",
        "Flex Studio",
        "Workspace",
        "Library",
        "Mudroom",
        "Utility",
    ];
    const bedrooms = Array.from({ length: params.bedrooms }, (_, i) => `Bedroom ${i + 1}`);
    const baths = Array.from({ length: params.bathrooms }, (_, i) => `${i === 0 ? "Primary" : "Guest"} Bath`);
    const catalog = [...bedrooms, ...baths, ...palette];
    return catalog[Math.floor(rand() * catalog.length)] || randomChoice(palette);
}

function buildDesign(design) {
    clearGroups();
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.45, metalness: 0 });
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x0f172a, emissive: 0x020617, roughness: 0.6 });
    const structureMaterial = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.6, roughness: 0.35 });
    const systemsMaterial = new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0x7c2d12, metalness: 0.1, roughness: 0.2 });

    const floor = new THREE.Mesh(
        new THREE.BoxGeometry(design.footprint.width + 0.1, 0.2, design.footprint.length + 0.1),
        floorMaterial
    );
    floor.receiveShadow = true;
    floor.position.y = 0;
    floor.userData.isSlab = true;
    floor.userData.baseY = floor.position.y;
    floor.userData.baseScaleY = floor.scale.y;
    lensGroups.walls.add(floor);

    design.rooms.forEach((room) => {
        const wall = new THREE.Mesh(new THREE.BoxGeometry(room.width, room.height, room.length), wallMaterial.clone());
        wall.position.set(room.x, room.height / 2, room.z);
        wall.castShadow = true;
        wall.receiveShadow = true;
        wall.userData.room = room;
        wall.userData.originalScaleY = wall.scale.y;
        lensGroups.walls.add(wall);

        const structure = new THREE.Mesh(new THREE.BoxGeometry(room.width + 0.08, room.height + 0.2, room.length + 0.08), structureMaterial);
        structure.position.copy(wall.position);
        structure.material.transparent = true;
        structure.material.opacity = 0.08;
        lensGroups.structure.add(structure);
    });

    const roof = new THREE.Mesh(
        new THREE.BoxGeometry(design.footprint.width + 0.3, 0.18, design.footprint.length + 0.3),
        roofMaterial
    );
    roof.position.y = design.rooms[0]?.height + 0.15 || 3.2;
    roof.castShadow = true;
    lensGroups.roof.add(roof);

    design.connectors.forEach((core) => {
        const pipe = new THREE.Mesh(new THREE.CylinderGeometry(core.radius * 0.3, core.radius * 0.3, 3.6, 24), systemsMaterial);
        pipe.position.set(core.x, 1.6, core.z);
        pipe.material.transparent = true;
        pipe.material.opacity = 0.6;
        lensGroups.systems.add(pipe);

        const conduit = new THREE.Mesh(new THREE.TorusGeometry(core.radius, 0.05, 8, 32), systemsMaterial.clone());
        conduit.rotation.x = Math.PI / 2;
        conduit.position.set(core.x, 2.2, core.z);
        lensGroups.systems.add(conduit);
    });

    applyLensVisibility();
}

function describeDesign(design, analytics) {
    if (ui.activeDesignTitle) {
        ui.activeDesignTitle.textContent = `${design.id} · ${analytics.programProfile}`;
    }
    if (ui.layoutSummary) {
        ui.layoutSummary.innerHTML = design.rooms
            .slice(0, 12)
            .map((room) => `<div class="info-row"><span>${room.type}</span><span>${room.width.toFixed(1)}m × ${room.length.toFixed(1)}m</span></div>`)
            .join("");
    }
    if (ui.highlightPills) {
        ui.highlightPills.innerHTML = analytics.highlights.map((h) => `<span>${h}</span>`).join("");
    }
    if (ui.marketInsights) {
        ui.marketInsights.innerHTML = analytics.market
            .map((entry) => `<div class="info-row"><span>${entry.label}</span><span>${entry.value}</span></div>`)
            .join("");
    }
    if (ui.metricArea) {
        ui.metricArea.textContent = `${Math.round(analytics.areaSqft).toLocaleString()} sqft`;
    }
    if (ui.metricCarbon) {
        ui.metricCarbon.textContent = `${Math.round(analytics.embodiedCarbon).toLocaleString()} kg CO₂e`;
    }
    if (ui.metricEnergy) {
        ui.metricEnergy.textContent = `${Math.round(analytics.energyUse).toLocaleString()} kWh/yr`;
    }

    if (ui.materialsTable) {
        ui.materialsTable.innerHTML = analytics.materials
            .map((mat) => `<tr><td>${mat.name}</td><td>${mat.quantity}</td><td>${mat.unitCost}</td><td>${mat.total}</td></tr>`)
            .join("");
    }
    if (ui.timelineInsights) {
        ui.timelineInsights.innerHTML = analytics.timeline
            .map((entry) => `<div class="info-row"><span>${entry.label}</span><span>${entry.value}</span></div>`)
            .join("");
    }
    if (ui.financialInsights) {
        ui.financialInsights.innerHTML = analytics.financial
            .map((entry) => `<div class="info-row"><span>${entry.label}</span><span>${entry.value}</span></div>`)
            .join("");
    }
    if (ui.systemsInsights) {
        ui.systemsInsights.innerHTML = analytics.systems
            .map((entry) => `<div class="info-row"><span>${entry.label}</span><span>${entry.value}</span></div>`)
            .join("");
    }
    if (ui.envelopeInsights) {
        ui.envelopeInsights.innerHTML = analytics.envelope
            .map((entry) => `<div class="info-row"><span>${entry.label}</span><span>${entry.value}</span></div>`)
            .join("");
    }
    if (ui.climateRisk) {
        ui.climateRisk.innerHTML = analytics.climateRisks
            .map(
                (risk) => `
                <div class="risk-card">
                    <header><strong>${risk.type}</strong><span class="risk-${risk.level.toLowerCase()}">${risk.level}</span></header>
                    <p>${risk.description}</p>
                </div>
            `
            )
            .join("");
    }
    if (ui.climateStrategies) {
        ui.climateStrategies.innerHTML = analytics.climateStrategies
            .map((entry) => `<div class="info-row"><span>${entry.label}</span><span>${entry.value}</span></div>`)
            .join("");
    }
}

function computeAnalytics(design, context) {
    const floorArea = design.footprint.width * design.footprint.length * design.floors;
    const areaSqft = floorArea * 10.7639;
    const wallArea = design.rooms.reduce((sum, room) => sum + (room.width + room.length) * 2 * room.height, 0);
    const envelopeFactor = { standard: 1, hempcrete: 0.85, recycled: 0.72, "mass-timber": 0.92 }[design.params.envelope] || 1;
    const carbonIntensity = { standard: 52, hempcrete: 34, recycled: 28, "mass-timber": 40 }[design.params.envelope] || 52;
    const embodiedCarbon = wallArea * carbonIntensity * envelopeFactor;
    const energyMultiplier = { hybrid: 0.82, geothermal: 0.65, grid: 1.05, microgrid: 0.78 }[design.params.energySystem] || 1;
    const climateEnergy = context?.climate?.degreeDays ? 1 + (context.climate.degreeDays - 3000) / 12000 : 1;
    const energyUse = areaSqft * 14 * energyMultiplier * climateEnergy;
    const highlights = [
        `${design.features.roofType} roof`,
        `${Math.round(design.features.glazingRatio * 100)}% glazing`,
        `${design.params.energySystem} energy hub`,
        `${design.params.envelope} envelope`,
    ];

    const marketValue = estimateMarketValue(areaSqft, context?.location || null);
    const materialCosts = buildMaterialCosts(design, floorArea, wallArea, envelopeFactor, marketValue.costFactor);
    const timeline = buildTimeline(design, floorArea, materialCosts.printHours, design.params.fabricator);
    const financial = buildFinancials(materialCosts, marketValue);
    const systems = buildSystems(design, energyUse);
    const envelope = buildEnvelope(design, context?.climate);
    const climateRisks = assessClimate(context?.climate, context?.location);
    const climateStrategies = buildClimateStrategies(climateRisks, design);

    return {
        areaSqft,
        embodiedCarbon,
        energyUse,
        highlights,
        programProfile: `${design.params.bedrooms}BR/${design.params.bathrooms}BA · ${design.floors}-level`,
        materials: materialCosts.entries,
        timeline,
        financial,
        systems,
        envelope,
        climateRisks,
        climateStrategies,
        market: [
            { label: "Est. Sale Value", value: materialCosts.currencyFormatter.format(marketValue.saleValue) },
            { label: "Projected ROI", value: `${(marketValue.saleValue / materialCosts.totalCost * 100 - 100).toFixed(1)}%` },
            { label: "Local Build Pressure", value: marketValue.marketPressure },
        ],
    };
}

function buildMaterialCosts(design, floorArea, wallArea, envelopeFactor, costFactor) {
    const unitCosts = {
        foundation: 75 * costFactor,
        wall: 32 * costFactor * envelopeFactor,
        roof: 28 * costFactor,
        glazing: 55 * costFactor,
        finish: 40 * costFactor,
        systems: 45 * costFactor,
    };
    const foundationVolume = design.footprint.width * design.footprint.length * 0.35;
    const roofArea = design.footprint.width * design.footprint.length;
    const glazingArea = wallArea * design.features.glazingRatio;
    const entriesRaw = [
        { name: "3D Print Concrete", quantity: `${foundationVolume.toFixed(1)} m³`, total: foundationVolume * unitCosts.foundation },
        { name: "Envelope Shell", quantity: `${wallArea.toFixed(0)} m²`, total: wallArea * unitCosts.wall },
        { name: "Roof Assembly", quantity: `${roofArea.toFixed(0)} m²`, total: roofArea * unitCosts.roof },
        { name: "Glazing Package", quantity: `${glazingArea.toFixed(0)} m²`, total: glazingArea * unitCosts.glazing },
        { name: "Interior Fit-Out", quantity: `${(floorArea * 0.9).toFixed(0)} m²`, total: floorArea * 0.9 * unitCosts.finish },
        { name: "Systems Integration", quantity: `${design.connectors.length} cores`, total: design.connectors.length * unitCosts.systems * 80 },
    ];
    const totalCost = entriesRaw.reduce((sum, item) => sum + item.total, 0);
    const currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
    const entries = entriesRaw.map((entry) => ({
        name: entry.name,
        quantity: entry.quantity,
        unitCost: currencyFormatter.format(entry.total / Math.max(1, parseFloat(entry.quantity))),
        total: currencyFormatter.format(entry.total),
    }));
    const printHours = (floorArea * 10.7639) / { gantry: 48, arm: 55, swarm: 38 }[design.params.fabricator] * 2;
    return { entries, totalCost, printHours, currencyFormatter };
}

function buildTimeline(design, floorArea, printHours, fabricator) {
    const totalDays = Math.ceil(printHours / 12 + design.floors * 1.5 + 6);
    return [
        { label: "Print Duration", value: `${printHours.toFixed(1)} hrs` },
        { label: "Post-Processing", value: `${(design.floors * 1.5).toFixed(1)} days` },
        { label: "Systems Fit-Out", value: `${(floorArea * 0.3).toFixed(1)} crew hrs` },
        { label: "Total Schedule", value: `${totalDays} days (${fabricator})` },
    ];
}

function buildFinancials(materialCosts, marketValue) {
    const formatter = materialCosts.currencyFormatter;
    return [
        { label: "Total Material Cost", value: formatter.format(materialCosts.totalCost) },
        { label: "Soft Costs + Labor", value: formatter.format(materialCosts.totalCost * 0.35) },
        { label: "Lifecycle Maintenance (10yr)", value: formatter.format(materialCosts.totalCost * 0.12) },
        { label: "Projected Sale", value: formatter.format(marketValue.saleValue) },
        { label: "Net Margin", value: formatter.format(marketValue.saleValue - materialCosts.totalCost * 1.35) },
    ];
}

function buildSystems(design, energyUse) {
    const heatPump = design.params.energySystem === "geothermal" ? "Geothermal Heat Pump" : "Inverter Mini-Split";
    const hvac = `${heatPump} · ${Math.round(energyUse / 120)} SEER`;
    const electrical = `${design.params.energySystem === "microgrid" ? "Dual-fed microgrid" : "Smart load center"} with ${Math.round(energyUse / 365)}kWh storage`;
    const water = {
        rainwater: "Rainwater cistern + UV purification",
        municipal: "High-efficiency municipal hookup",
        offgrid: "Atmospheric water generator",
    }[design.params.waterStrategy];
    return [
        { label: "HVAC", value: hvac },
        { label: "Electrical", value: electrical },
        { label: "Water", value: water },
        { label: "Automation", value: "AI habitat assistant + adaptive shading" },
    ];
}

function buildEnvelope(design, climate) {
    const rValue = { standard: 28, hempcrete: 32, recycled: 30, "mass-timber": 26 }[design.params.envelope];
    const vapor = climate && climate.humidity > 70 ? "Smart vapor control" : "Breathable membrane";
    const acoustic = design.params.palette === "industrial" ? "Reverberant acoustic panels" : "Acoustic felt baffles";
    return [
        { label: "R-Value", value: `R-${rValue}` },
        { label: "Air Tightness", value: `${(1.5 * (design.features.glazingRatio + 0.6)).toFixed(1)} ACH50` },
        { label: "Vapor Strategy", value: vapor },
        { label: "Acoustic", value: acoustic },
    ];
}

function estimateMarketValue(areaSqft, location) {
    const costIndexByCountry = {
        us: 1.28,
        ca: 1.12,
        gb: 1.45,
        au: 1.25,
        de: 1.32,
        fr: 1.3,
        jp: 1.38,
        sg: 1.65,
    };
    const defaultCost = 1.1;
    const basePrice = 240;
    const countryCode = location?.country_code?.toLowerCase();
    const costFactor = costIndexByCountry[countryCode] || defaultCost;
    const saleValue = areaSqft * basePrice * costFactor;
    const marketPressure = location?.population > 1500000 ? "High Demand" : location?.population > 400000 ? "Emerging" : "Niche";
    return { saleValue, marketPressure, costFactor };
}

function assessClimate(climate, location) {
    if (!climate) {
        return [
            { type: "Data Pending", level: "Medium", description: "Run a generation to synchronize site-specific climate analytics." },
        ];
    }
    const risks = [];
    const floodIndex = climate.precipitation > 1400 || climate.seaLevel === "coastal" ? "High" : climate.precipitation > 900 ? "Medium" : "Low";
    const heatIndex = climate.temperature > 28 ? "High" : climate.temperature > 22 ? "Medium" : "Low";
    const windIndex = climate.wind > 12 ? "High" : climate.wind > 8 ? "Medium" : "Low";
    const fireIndex = climate.humidity < 40 && climate.precipitation < 600 ? "High" : climate.humidity < 55 ? "Medium" : "Low";
    risks.push({ type: "Flooding & Storm Surge", level: floodIndex, description: `Annual rainfall ${climate.precipitation}mm with prevailing ${climate.wind.toFixed(1)}m/s winds.` });
    risks.push({ type: "Extreme Heat", level: heatIndex, description: `Average temperature ${climate.temperature.toFixed(1)}°C and ${climate.degreeDays} heating degree days.` });
    risks.push({ type: "High Winds", level: windIndex, description: `Gust potential ${climate.wind.toFixed(1)}m/s; design roof uplift anchors accordingly.` });
    risks.push({ type: "Wildfire", level: fireIndex, description: `Relative humidity ${climate.humidity}% with vegetation index ${climate.vegetation}.` });
    return risks;
}

function buildClimateStrategies(risks, design) {
    const strategies = [];
    if (!risks) return strategies;
    const highRisk = risks.filter((r) => r.level === "High");
    const mediumRisk = risks.filter((r) => r.level === "Medium");
    strategies.push({ label: "Structure", value: `${design.params.envelope} shell + hurricane straps` });
    strategies.push({ label: "Drainage", value: highRisk.some((r) => r.type.includes("Flood")) ? "Elevated plinth + perimeter swales" : "Permeable landscape" });
    strategies.push({ label: "Cooling", value: mediumRisk.some((r) => r.type.includes("Heat")) ? "Phase-change insulation + radiant cooling" : "Passive cross ventilation" });
    strategies.push({ label: "Fire Resistance", value: highRisk.some((r) => r.type.includes("Wildfire")) ? "Intumescent coatings + ember screens" : "Fire-resistant landscaping" });
    strategies.push({ label: "Energy Backup", value: highRisk.some((r) => r.type.includes("High Winds")) ? "Storm-mode battery reserve" : "Standard resilience kit" });
    return strategies;
}

async function geocodeLocation(query) {
    if (!query) return null;
    try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1`);
        if (!res.ok) throw new Error("Geocoding failed");
        const data = await res.json();
        return data.results?.[0] || null;
    } catch (error) {
        console.warn("Geocoding error", error);
        return null;
    }
}

async function fetchClimate(lat, lon) {
    if (typeof lat !== "number" || typeof lon !== "number") return null;
    try {
        const res = await fetch(`https://climate-api.open-meteo.com/v1/climate?latitude=${lat}&longitude=${lon}&start_year=2000&end_year=2020&models=CMIP6&daily=temperature_2m_max,precipitation_sum,wind_speed_10m_mean,relative_humidity_2m_mean`);
        if (!res.ok) throw new Error("Climate query failed");
        const data = await res.json();
        const temperature = average(data?.daily?.temperature_2m_max?.map((v) => v?.value));
        const precipitation = average(data?.daily?.precipitation_sum?.map((v) => v?.value)) * 365;
        const wind = average(data?.daily?.wind_speed_10m_mean?.map((v) => v?.value));
        const humidity = average(data?.daily?.relative_humidity_2m_mean?.map((v) => v?.value));
        const vegetation = precipitation > 1200 ? "lush" : precipitation > 600 ? "moderate" : "arid";
        const degreeDays = Math.max(2500, Math.min(6200, Math.round(4000 + (18 - temperature) * 120)));
        return { temperature, precipitation: Math.round(precipitation), wind, humidity: Math.round(humidity), vegetation, degreeDays };
    } catch (error) {
        console.warn("Climate error", error);
        return null;
    }
}

function average(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return 0;
    return arr.reduce((sum, v) => sum + v, 0) / arr.length;
}

function environmentFromLocation(location, manual) {
    if (manual && manual !== "auto") return manual;
    if (!location) return "forest";
    const coastalCountries = ["us", "ca", "au", "es", "pt", "it", "jp", "gb", "br"];
    if (coastalCountries.includes(location.country_code?.toLowerCase()) && location.longitude && Math.abs(location.longitude) < 50) return "coastal";
    if (location.population > 1000000) return "urban";
    if (location.latitude > 55 || location.latitude < -55) return "forest";
    return location.elevation > 800 ? "mountain" : "forest";
}

function updateEnvironment(env) {
    while (environmentGroup.children.length) environmentGroup.remove(environmentGroup.children[0]);
    const palette = {
        urban: 0x111827,
        coastal: 0x0ea5e9,
        forest: 0x14532d,
        desert: 0xca8a04,
        mountain: 0x6b7280,
    };
    const color = palette[env] || 0x14532d;
    ground.material.color.setHex(color);
    state.environment = env;
    setEnvironmentLabel(env);

    if (env === "urban") {
        const skyline = new THREE.Group();
        for (let i = 0; i < 8; i++) {
            const tower = new THREE.Mesh(new THREE.BoxGeometry(1, Math.random() * 6 + 3, 1), new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.4, roughness: 0.5 }));
            tower.position.set(-10 + Math.random() * 6, tower.geometry.parameters.height / 2, -8 - Math.random() * 6);
            skyline.add(tower);
        }
        environmentGroup.add(skyline);
    } else if (env === "coastal") {
        const water = new THREE.Mesh(new THREE.PlaneGeometry(40, 20), new THREE.MeshStandardMaterial({ color: 0x0ea5e9, transparent: true, opacity: 0.65 }));
        water.rotation.x = -Math.PI / 2;
        water.position.set(0, -0.01, -12);
        environmentGroup.add(water);
    } else if (env === "forest") {
        const forest = new THREE.Group();
        for (let i = 0; i < 25; i++) {
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 1.8), new THREE.MeshStandardMaterial({ color: 0x92400e }));
            const canopy = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.8, 12), new THREE.MeshStandardMaterial({ color: 0x14532d }));
            trunk.position.set((Math.random() - 0.5) * 18, 0.9, -10 - Math.random() * 10);
            canopy.position.set(trunk.position.x, 1.8, trunk.position.z);
            forest.add(trunk, canopy);
        }
        environmentGroup.add(forest);
    } else if (env === "desert") {
        const dunes = new THREE.Mesh(new THREE.PlaneGeometry(40, 30, 32, 32), new THREE.MeshStandardMaterial({ color: 0xfacc15, side: THREE.DoubleSide }));
        dunes.rotation.x = -Math.PI / 2;
        dunes.position.z = -14;
        environmentGroup.add(dunes);
    } else if (env === "mountain") {
        const peak = new THREE.Mesh(new THREE.ConeGeometry(6, 8, 32), new THREE.MeshStandardMaterial({ color: 0x6b7280 }));
        peak.position.set(-8, 4, -15);
        environmentGroup.add(peak);
    }
}

async function generateDesigns() {
    if (!ui.generate) {
        console.warn("Generate button missing; cannot start layout synthesis.");
        return;
    }
    ui.generate.disabled = true;
    ui.generate.textContent = "⏳ Synthesizing";
    setSimulationStatus("Synthesizing intelligent layout variants…");

    try {
        state.designs = [];
        if (ui.designList) {
            ui.designList.innerHTML = "";
        }

        const params = {
            location: document.getElementById("location").value,
            lotWidth: Number(document.getElementById("lotWidth").value),
            lotLength: Number(document.getElementById("lotLength").value),
            orientation: document.getElementById("orientation").value,
            environment: document.getElementById("environment").value,
            area: Number(document.getElementById("area").value) / 10.7639,
            floors: Number(document.getElementById("floors").value),
            bedrooms: Number(document.getElementById("bedrooms").value),
            bathrooms: Number(document.getElementById("bathrooms").value),
            sustainability: document.getElementById("sustainability").value,
            envelope: document.getElementById("envelope").value,
            variantCount: Number(document.getElementById("variantCount").value),
            energySystem: document.getElementById("energySystem").value,
            waterStrategy: document.getElementById("waterStrategy").value,
            fabricator: document.getElementById("fabricator").value,
            palette: document.getElementById("palette").value,
            budget: Number(document.getElementById("budget").value),
        };

        showGenerationProgress(params.variantCount);

        const location = await geocodeLocation(params.location);
        const climate = location ? await fetchClimate(location.latitude, location.longitude) : null;
        if (climate) climate.seaLevel = params.environment === "coastal" ? "coastal" : undefined;
        const environment = environmentFromLocation(location, params.environment);
        updateEnvironment(environment);

        for (let i = 0; i < params.variantCount; i++) {
            const seed = randomUint32();
            const design = generateLayout(seed, params);
            state.designs.push({ design, seed, analytics: computeAnalytics(design, { climate, location }) });
            updateGenerationProgress(i + 1, params.variantCount);
            // Ensure the UI reflects progress during intensive synthesis loops.
            // eslint-disable-next-line no-await-in-loop
            await yieldToFrame();
        }

        if (!state.designs.length) {
            throw new Error("No designs generated");
        }

        if (!ui.designList) {
            throw new Error("Design list container missing");
        }

        ui.designList.innerHTML = state.designs
            .map(
                (entry, idx) => `
            <div class="design-item" data-index="${idx}">
                <strong>${entry.design.id}</strong>
                <span>${entry.analytics.programProfile}</span>
                <span>${Math.round(entry.analytics.areaSqft).toLocaleString()} sqft · ${entry.design.features.roofType}</span>
            </div>
        `
            )
            .join("");

        ui.designList.querySelectorAll(".design-item").forEach((item) => {
            item.addEventListener("click", () => activateDesign(Number(item.dataset.index)));
        });

        activateDesign(0);
        completeGenerationProgress({
            message: "Layouts ready. Select a variant to inspect.",
            success: true,
        });
        const variantCount = state.designs.length;
        const descriptor = variantCount === 1 ? "layout" : "layouts";
        setSimulationStatus(`Generated ${variantCount} intelligent ${descriptor}.`);
    } catch (error) {
        console.error("Generation error", error);
        setSimulationStatus("Generation failed. Adjust parameters and try again.");
        if (ui.designList) {
            ui.designList.innerHTML =
                '<div class="design-item error" role="alert">Unable to generate layouts. Please review inputs and retry.</div>';
        }
        completeGenerationProgress({
            message: "Generation failed. Review the inputs and retry.",
            success: false,
        });
    } finally {
        if (ui.generate) {
            ui.generate.disabled = false;
            ui.generate.textContent = "⚙️ Generate Intelligent Layouts";
        }
    }
}

function activateDesign(index) {
    if (!ui.designList) return;
    ui.designList.querySelectorAll(".design-item").forEach((item) => item.classList.remove("active"));
    const item = ui.designList.querySelector(`[data-index="${index}"]`);
    if (item) item.classList.add("active");
    const selected = state.designs[index];
    if (!selected) return;
    state.activeDesign = selected;
    buildDesign(selected.design);
    describeDesign(selected.design, selected.analytics);
    setSimulationStatus(`Ready to simulate ${selected.design.id}.`);
}

if (ui.generate) {
    ui.generate.addEventListener("click", generateDesigns);
} else {
    console.warn("Generate button not found; layout synthesis UI inactive.");
}

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

function playSimulation(record = false) {
    if (!state.activeDesign) return;
    if (state.animation) cancelAnimationFrame(state.animation);
    const totalDuration = 4500;
    const start = performance.now();
    const roof = lensGroups.roof.children[0];
    const initialRoofY = roof ? roof.position.y : 0;
    const animatedWalls = lensGroups.walls.children.filter((child) => {
        const data = child.userData || {};
        return data.room && !data.isSlab;
    });
    const slab = lensGroups.walls.children.find((child) => child.userData?.isSlab);

    const animateStep = (time) => {
        const elapsed = Math.min(time - start, totalDuration);
        const progress = elapsed / totalDuration;
        animatedWalls.forEach((wall) => {
            const baseScale = wall.userData.originalScaleY ?? 1;
            const eased = Math.max(0.01, progress);
            wall.scale.y = baseScale * eased;
            wall.position.y = (wall.userData.room?.height || 3) * eased / 2;
        });
        if (roof) {
            roof.position.y = initialRoofY + Math.sin(progress * Math.PI) * 0.35;
        }
        if (elapsed < totalDuration) {
            state.animation = requestAnimationFrame(animateStep);
        } else {
            setSimulationStatus(`Simulation complete for ${state.activeDesign.design.id}.`);
            if (record && state.mediaRecorder) state.mediaRecorder.stop();
        }
    };
    animatedWalls.forEach((wall) => {
        wall.scale.y = 0.01;
        wall.position.y = 0.01;
    });
    if (slab) {
        slab.scale.y = slab.userData?.baseScaleY ?? 1;
        slab.position.y = slab.userData?.baseY ?? 0;
    }
    setSimulationStatus(record ? "Recording simulation…" : "Simulating 3D printing sequence…");
    state.animation = requestAnimationFrame(animateStep);
}

ui.simulatePrint?.addEventListener("click", () => playSimulation(false));

ui.recordVideo?.addEventListener("click", async () => {
    if (!state.activeDesign) return;
    if (state.mediaRecorder) {
        state.mediaRecorder.stop();
        state.mediaRecorder = null;
    }
    const stream = renderer.domElement.captureStream(60);
    const options = { mimeType: "video/webm;codecs=vp9" };
    const mediaRecorder = new MediaRecorder(stream, options);
    state.recordedChunks = [];
    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) state.recordedChunks.push(event.data);
    };
    mediaRecorder.onstop = () => {
        const blob = new Blob(state.recordedChunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        ui.simulationVideo.src = url;
        ui.downloadLink.href = url;
        ui.videoPreview.hidden = false;
        setSimulationStatus("Simulation video ready.");
    };
    state.mediaRecorder = mediaRecorder;
    mediaRecorder.start();
    playSimulation(true);
});

applyLensVisibility();
setSimulationStatus("Awaiting design synthesis.");
updateVariantCountLabel();
setEnvironmentLabel(ui.environmentSelect?.value ?? state.environment);
