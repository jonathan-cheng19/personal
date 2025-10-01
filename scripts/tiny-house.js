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
    scoreBreakdown: document.getElementById("scoreBreakdown"),
    massInsights: document.getElementById("massInsights"),
    climateEconomics: document.getElementById("climateEconomics"),
    metricScore: document.getElementById("metricScore"),
    metricRisk: document.getElementById("metricRisk"),
    megaBatch: document.getElementById("megaBatch"),
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
        const badgeValue = state.totalGenerated || Number(ui.variantCount.value);
        ui.headerVariantBadge.textContent = badgeValue.toLocaleString();
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

function lonLatToTile(lon, lat, zoom) {
    const latRad = (lat * Math.PI) / 180;
    const n = 2 ** zoom;
    const x = Math.floor(((lon + 180) / 360) * n);
    const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
    return { x, y };
}

function applyGroundTexture(location) {
    if (!location) {
        if (groundTexture) {
            groundTexture.dispose();
            groundTexture = null;
        }
        ground.material.map = null;
        ground.material.needsUpdate = true;
        return;
    }
    const zoom = 14;
    const tile = lonLatToTile(location.longitude || 0, location.latitude || 0, zoom);
    const url = `https://tile.openstreetmap.org/${zoom}/${tile.x}/${tile.y}.png`;
    textureLoader.load(
        url,
        (texture) => {
            if (groundTexture) groundTexture.dispose();
            groundTexture = texture;
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
            ground.material.map = texture;
            ground.material.needsUpdate = true;
        },
        undefined,
        () => {
            ground.material.map = null;
            ground.material.needsUpdate = true;
        }
    );
}

function clearGroups() {
    Object.values(lensGroups).forEach((group) => {
        while (group.children.length) {
            group.remove(group.children[0]);
        }
    });
}

function applyLensVisibility() {
    if (lensToggles.roof) {
        lensGroups.roof.visible = lensToggles.roof.checked;
    }
    if (lensToggles.walls) {
        lensGroups.walls.children.forEach((mesh) => {
            mesh.material.opacity = lensToggles.walls.checked ? 0.95 : 0.25;
            mesh.material.transparent = true;
            mesh.material.needsUpdate = true;
        });
    }
    if (lensToggles.structure) {
        lensGroups.structure.visible = lensToggles.structure.checked;
    }
    if (lensToggles.systems) {
        lensGroups.systems.visible = lensToggles.systems.checked;
    }
}

Object.values(lensToggles).forEach((toggle) => toggle?.addEventListener("change", applyLensVisibility));

const state = {
    designs: [],
    activeDesign: null,
    activeIndex: 0,
    animation: null,
    mediaRecorder: null,
    recordedChunks: [],
    environment: "auto",
    totalGenerated: 0,
    sweepStats: null,
};

const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const textureLoader = new THREE.TextureLoader();
textureLoader.crossOrigin = "anonymous";
let groundTexture = null;

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
    if (ui.metricScore) {
        ui.metricScore.textContent = `${Math.round(analytics.optimizationScore)} / 100`;
    }
    if (ui.metricRisk) {
        ui.metricRisk.textContent = `${analytics.riskLabel} (${Math.round(analytics.riskScore * 100)}%)`;
    }

    if (ui.materialsTable) {
        ui.materialsTable.innerHTML = analytics.materials
            .map((mat) => `<tr><td>${mat.name}</td><td>${mat.quantity}</td><td>${mat.unitCost}</td><td>${mat.total}</td></tr>`)
            .join("");
    }
    if (ui.scoreBreakdown) {
        const breakdown = [...analytics.scoreBreakdown];
        if (state.sweepStats) {
            breakdown.push({
                label: "Mega Batch Avg",
                value: `${(state.sweepStats.averageScore || 0).toFixed(1)} / 100`,
            });
            breakdown.push({
                label: "Mega Batch Leader",
                value: state.sweepStats.bestId
                    ? `${state.sweepStats.bestId} (${Math.round(state.sweepStats.topScore || 0)} pts)`
                    : "—",
            });
        }
        ui.scoreBreakdown.innerHTML = breakdown
            .map((entry) => `<div class="info-row"><span>${entry.label}</span><span>${entry.value}</span></div>`)
            .join("");
    }
    if (ui.timelineInsights) {
        ui.timelineInsights.innerHTML = analytics.timeline
            .map((entry) => `<div class="info-row"><span>${entry.label}</span><span>${entry.value}</span></div>`)
            .join("");
    }
    if (ui.massInsights) {
        ui.massInsights.innerHTML = analytics.massInsights
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
    if (ui.climateEconomics) {
        ui.climateEconomics.innerHTML = analytics.climateEconomics
            .map((entry) => `<div class="info-row"><span>${entry.label}</span><span>${entry.value}</span></div>`)
            .join("");
    }
}

function computeAnalytics(design, context) {
    const floorArea = design.footprint.width * design.footprint.length * design.floors;
    const areaSqft = floorArea * 10.7639;
    const wallArea = design.rooms.reduce((sum, room) => sum + (room.width + room.length) * 2 * room.height, 0);
    const envelopeFactor = { standard: 1, hempcrete: 0.85, recycled: 0.72, "mass-timber": 0.92 }[design.params.envelope] || 1;
    const energyMultiplier = { hybrid: 0.82, geothermal: 0.65, grid: 1.05, microgrid: 0.78 }[design.params.energySystem] || 1;
    const climateEnergy = context?.climate?.degreeDays ? 1 + (context.climate.degreeDays - 3000) / 12000 : 1;
    const energyUse = areaSqft * 14 * energyMultiplier * climateEnergy;
    const highlights = [
        `${design.features.roofType} roof`,
        `${Math.round(design.features.glazingRatio * 100)}% glazing`,
        `${design.params.energySystem} energy hub`,
        `${design.params.envelope} envelope`,
    ];

    const climateAssessment = assessClimate(context?.climate, context?.location);
    const marketValue = estimateMarketValue(areaSqft, context?.location || null, climateAssessment);
    const materialCosts = buildMaterialCosts(design, floorArea, wallArea, envelopeFactor, marketValue.costFactor, floorArea);
    const timeline = buildTimeline(design, floorArea, materialCosts, design.params.fabricator, climateAssessment.riskScore);
    const financial = buildFinancials(materialCosts, marketValue, climateAssessment.premium);
    const systems = buildSystems(design, energyUse);
    const envelope = buildEnvelope(design, context?.climate);
    const climateStrategies = buildClimateStrategies(climateAssessment, design);
    const climateEconomics = buildClimateEconomics(climateAssessment, materialCosts, marketValue, financial);

    const costEfficiency = clamp((design.params.budget || materialCosts.totalCost * 1.15) / Math.max(materialCosts.totalCost, 1), 0, 1.2);
    const costScore = clamp(costEfficiency, 0, 1);
    const energyIntensity = energyUse / Math.max(areaSqft, 1);
    const energyScore = clamp(1 - energyIntensity / 45, 0, 1);
    const carbonPerM2 = materialCosts.embodiedCarbonTotal / Math.max(floorArea, 1);
    const carbonScore = clamp(1 - carbonPerM2 / 65, 0, 1);
    const resilienceScore = clamp(1 - climateAssessment.riskScore, 0, 1);
    const optimizationScore = Math.round((costScore * 0.35 + energyScore * 0.25 + carbonScore * 0.2 + resilienceScore * 0.2) * 100);
    const scoreBreakdown = [
        { label: "Cost Efficiency", value: `${Math.round(costScore * 100)} / 100` },
        { label: "Energy Performance", value: `${Math.round(energyScore * 100)} / 100` },
        { label: "Carbon Profile", value: `${Math.round(carbonScore * 100)} / 100` },
        { label: "Resilience", value: `${Math.round(resilienceScore * 100)} / 100` },
    ];

    return {
        areaSqft,
        embodiedCarbon: materialCosts.embodiedCarbonTotal,
        energyUse,
        highlights,
        programProfile: `${design.params.bedrooms}BR/${design.params.bathrooms}BA · ${design.floors}-level`,
        materials: materialCosts.entries,
        massInsights: materialCosts.massInsights,
        timeline,
        financial: financial.rows,
        systems,
        envelope,
        climateRisks: climateAssessment.risks,
        climateStrategies,
        climateEconomics,
        optimizationScore,
        scoreBreakdown,
        riskLabel: climateAssessment.label,
        riskScore: climateAssessment.riskScore,
        totalCost: materialCosts.totalCost,
        saleValue: marketValue.saleValue,
        printHours: materialCosts.printHours,
        currencyFormatter: materialCosts.currencyFormatter,
        market: [
            { label: "Est. Sale Value", value: materialCosts.currencyFormatter.format(marketValue.saleValue) },
            {
                label: "Projected ROI",
                value: `${((financial.netMargin / Math.max(financial.totalProjectCost, 1)) * 100).toFixed(1)}%`,
            },
            { label: "Local Build Pressure", value: marketValue.marketPressure },
            { label: "Risk Premium", value: `${Math.round(climateAssessment.premium * 100)}%` },
        ],
    };
}

function scoreTier(score) {
    if (score >= 85) return "high";
    if (score >= 65) return "medium";
    return "low";
}

function renderDesignList() {
    if (!ui.designList) return;
    if (!state.designs.length) {
        ui.designList.innerHTML = "";
        return;
    }
    ui.designList.innerHTML = state.designs
        .map((entry, idx) => {
            const score = Math.round(entry.analytics.optimizationScore || 0);
            const tier = scoreTier(score);
            const formatter =
                entry.analytics.currencyFormatter || new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
            const cost = formatter.format(entry.analytics.totalCost || 0);
            const sale = formatter.format(entry.analytics.saleValue || 0);
            const print = `${Math.round(entry.analytics.printHours || 0)} hrs`;
            const activeClass = idx === state.activeIndex ? " active" : "";
            return `
            <div class="design-item${activeClass}" data-index="${idx}">
                <strong>${entry.design.id}<span class="score-badge ${tier}">Score ${score}</span></strong>
                <span>${entry.analytics.programProfile}</span>
                <span>${Math.round(entry.analytics.areaSqft).toLocaleString()} sqft · ${entry.design.features.roofType}</span>
                <span>Cost ${cost} · Sale ${sale} · Print ${print}</span>
            </div>
        `;
        })
        .join("");
    ui.designList.querySelectorAll(".design-item").forEach((item) => {
        item.addEventListener("click", () => activateDesign(Number(item.dataset.index)));
    });
}

function buildMaterialCosts(design, floorArea, wallArea, envelopeFactor, costFactor, areaM2) {
    const unitCosts = {
        foundation: 75 * costFactor,
        wall: 32 * costFactor * envelopeFactor,
        roof: 28 * costFactor,
        glazing: 55 * costFactor,
        finish: 40 * costFactor,
        systems: 45 * costFactor,
    };
    const densities = {
        concrete: 2400,
        wallComposite: 1900,
        roof: 520,
        glass: 2500,
        finishes: 780,
        systems: 480,
    };
    const carbonFactors = {
        concrete: 0.28,
        wallComposite: 0.18,
        roof: 0.12,
        glass: 1.4,
        finishes: 0.25,
        systems: 0.32,
    };
    const wallThickness = 0.22;
    const roofThickness = 0.18;
    const slabThickness = 0.25;
    const foundationVolume = design.footprint.width * design.footprint.length * slabThickness;
    const wallVolume = wallArea * wallThickness;
    const roofArea = design.footprint.width * design.footprint.length;
    const roofVolume = roofArea * roofThickness;
    const glazingArea = wallArea * design.features.glazingRatio;
    const connectorCount = Math.max(1, design.connectors.length);
    const systemsLength = connectorCount * (design.floors * 14 + 30);
    const materials = [
        {
            key: "foundation",
            name: "3D Print Concrete",
            quantity: foundationVolume,
            unit: "m³",
            unitCost: unitCosts.foundation,
            mass: foundationVolume * densities.concrete,
            carbon: foundationVolume * densities.concrete * carbonFactors.concrete,
        },
        {
            key: "walls",
            name: "Envelope Shell",
            quantity: wallArea,
            unit: "m²",
            unitCost: unitCosts.wall,
            mass: wallVolume * densities.wallComposite,
            carbon: wallVolume * densities.wallComposite * carbonFactors.wallComposite,
        },
        {
            key: "roof",
            name: "Roof Assembly",
            quantity: roofArea,
            unit: "m²",
            unitCost: unitCosts.roof,
            mass: roofVolume * densities.roof,
            carbon: roofVolume * densities.roof * carbonFactors.roof,
        },
        {
            key: "glazing",
            name: "Glazing Package",
            quantity: glazingArea,
            unit: "m²",
            unitCost: unitCosts.glazing,
            mass: glazingArea * densities.glass,
            carbon: glazingArea * densities.glass * carbonFactors.glass,
        },
        {
            key: "finish",
            name: "Interior Fit-Out",
            quantity: floorArea * 0.9,
            unit: "m²",
            unitCost: unitCosts.finish,
            mass: floorArea * 0.9 * densities.finishes,
            carbon: floorArea * 0.9 * densities.finishes * carbonFactors.finishes,
        },
        {
            key: "systems",
            name: "Systems Integration",
            quantity: systemsLength,
            unit: "m",
            unitCost: unitCosts.systems,
            mass: systemsLength * densities.systems,
            carbon: systemsLength * densities.systems * carbonFactors.systems,
        },
    ];

    const formatQuantity = (item) => {
        const decimals = item.unit === "m³" ? 2 : item.unit === "m" ? 0 : 0;
        return `${item.quantity.toFixed(decimals)} ${item.unit}`;
    };

    const totalCost = materials.reduce((sum, item) => sum + item.unitCost * item.quantity, 0);
    const totalMass = materials.reduce((sum, item) => sum + item.mass, 0);
    const totalCarbon = materials.reduce((sum, item) => sum + item.carbon, 0);
    const currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
    const entries = materials.map((item) => ({
        name: item.name,
        quantity: formatQuantity(item),
        unitCost: currencyFormatter.format(item.unitCost),
        total: currencyFormatter.format(item.unitCost * item.quantity),
    }));
    const printSpeed = { gantry: 48, arm: 55, swarm: 38 }[design.params.fabricator] || 48;
    const printHours = ((floorArea * 10.7639) / printSpeed) * (1 + wallThickness * 2.2);
    const wallHeight = design.rooms.reduce((sum, room) => sum + room.height, 0) / Math.max(design.rooms.length, 1);
    const printLayers = wallHeight / 0.02;
    const massInsights = [
        { label: "Total Material Mass", value: `${(totalMass / 1000).toFixed(1)} t` },
        { label: "Embodied Carbon (BoM)", value: `${Math.round(totalCarbon).toLocaleString()} kg CO₂e` },
        { label: "Carbon Intensity", value: `${Math.round(totalCarbon / Math.max(areaM2, 1))} kg/m²` },
        { label: "Print Layers", value: `${Math.round(printLayers)} layers` },
    ];
    return {
        entries,
        totalCost,
        printHours,
        currencyFormatter,
        totalMass,
        massInsights,
        embodiedCarbonTotal: totalCarbon,
        printLayers,
    };
}

function buildTimeline(design, floorArea, materialCosts, fabricator, riskScore) {
    const printHours = materialCosts.printHours;
    const finishingDays = design.floors * 1.5;
    const systemsHours = floorArea * 0.3;
    const baseDays = Math.ceil(printHours / 12 + finishingDays + 6);
    const riskBuffer = Math.max(1, Math.round(riskScore * 10));
    const totalDays = baseDays + riskBuffer;
    return [
        { label: "Print Duration", value: `${printHours.toFixed(1)} hrs` },
        { label: "Layer Count", value: `${Math.round(materialCosts.printLayers)} layers` },
        { label: "Systems Fit-Out", value: `${systemsHours.toFixed(1)} crew hrs` },
        { label: "Resilience Buffer", value: `${riskBuffer} day contingency` },
        { label: "Total Schedule", value: `${totalDays} days (${fabricator})` },
    ];
}

function buildFinancials(materialCosts, marketValue, riskPremium) {
    const formatter = materialCosts.currencyFormatter;
    const softCosts = materialCosts.totalCost * 0.35;
    const insurance = materialCosts.totalCost * riskPremium;
    const contingency = materialCosts.totalCost * 0.1;
    const lifecycle = materialCosts.totalCost * 0.12;
    const totalProjectCost = materialCosts.totalCost + softCosts + insurance + contingency;
    const netMargin = marketValue.saleValue - totalProjectCost;
    const rows = [
        { label: "Total Material Cost", value: formatter.format(materialCosts.totalCost) },
        { label: "Soft Costs + Labor", value: formatter.format(softCosts) },
        { label: "Climate Insurance Premium", value: formatter.format(insurance) },
        { label: "Contingency Reserve", value: formatter.format(contingency) },
        { label: "Lifecycle Maintenance (10yr)", value: formatter.format(lifecycle) },
        { label: "Total Project Cost", value: formatter.format(totalProjectCost) },
        { label: "Projected Sale", value: formatter.format(marketValue.saleValue) },
        { label: "Net Margin", value: formatter.format(netMargin) },
    ];
    return { rows, insurance, contingency, totalProjectCost, netMargin, formatter };
}

function buildClimateEconomics(assessment, materialCosts, marketValue, financial) {
    const formatter = materialCosts.currencyFormatter;
    const resilienceROI = marketValue.saleValue - (financial.totalProjectCost + materialCosts.totalCost * assessment.riskScore * 0.12);
    return [
        { label: "Risk Score", value: `${Math.round(assessment.riskScore * 100)} / 100` },
        { label: "Insurance Premium", value: formatter.format(financial.insurance) },
        { label: "Recommended Mitigation", value: formatter.format(materialCosts.totalCost * (0.05 + assessment.riskScore * 0.1)) },
        { label: "Post-Mitigation ROI", value: formatter.format(resilienceROI) },
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

function estimateMarketValue(areaSqft, location, climateAssessment) {
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
    const resilienceModifier = 1 - clamp(climateAssessment?.riskScore ?? 0.4, 0, 1) * 0.12;
    const saleValue = areaSqft * basePrice * costFactor * clamp(resilienceModifier, 0.65, 1.05);
    const marketPressure = location?.population > 1500000 ? "High Demand" : location?.population > 400000 ? "Emerging" : "Niche";
    return { saleValue, marketPressure, costFactor, resilienceModifier };
}

function assessClimate(climate, location) {
    const defaultAssessment = {
        risks: [
            {
                type: "Data Pending",
                level: "Medium",
                description: "Run a generation to synchronize site-specific climate analytics.",
            },
        ],
        riskScore: 0.45,
        label: "Medium",
        premium: 0.05,
    };
    if (!climate) {
        return defaultAssessment;
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
    const weight = { Low: 0.18, Medium: 0.48, High: 0.88 };
    const aggregate = risks.reduce((sum, risk) => sum + (weight[risk.level] || 0.48), 0);
    const riskScore = clamp(aggregate / (risks.length * 0.88), 0, 1);
    const label = riskScore > 0.66 ? "High" : riskScore > 0.33 ? "Medium" : "Low";
    const premium = 0.02 + riskScore * 0.08;
    return { risks, riskScore, label, premium };
}

function buildClimateStrategies(assessment, design) {
    const strategies = [];
    if (!assessment) return strategies;
    const risks = assessment.risks || [];
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

function updateEnvironment(env, location) {
    while (environmentGroup.children.length) environmentGroup.remove(environmentGroup.children[0]);
    applyGroundTexture(location);
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
        if (location?.population) {
            const density = clamp(location.population / 1500000, 0.4, 1.5);
            skyline.children.forEach((tower, idx) => {
                tower.position.x += Math.sin(idx) * density;
                tower.position.z -= Math.cos(idx) * density * 1.5;
            });
        }
        environmentGroup.add(skyline);
        const street = new THREE.Mesh(new THREE.PlaneGeometry(22, 4), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
        street.rotation.x = -Math.PI / 2;
        street.position.set(0, -0.009, 6);
        environmentGroup.add(street);
    } else if (env === "coastal") {
        const water = new THREE.Mesh(new THREE.PlaneGeometry(40, 20), new THREE.MeshStandardMaterial({ color: 0x0ea5e9, transparent: true, opacity: 0.65 }));
        water.rotation.x = -Math.PI / 2;
        water.position.set(0, -0.01, -12);
        environmentGroup.add(water);
        const pier = new THREE.Mesh(new THREE.BoxGeometry(6, 0.3, 2), new THREE.MeshStandardMaterial({ color: 0xe2e8f0 }));
        pier.position.set(-6, 0.15, -4);
        environmentGroup.add(pier);
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
        const cactusMaterial = new THREE.MeshStandardMaterial({ color: 0x15803d });
        for (let i = 0; i < 6; i++) {
            const cactus = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 2.4, 12), cactusMaterial);
            cactus.position.set((Math.random() - 0.5) * 16, 1.2, -8 - Math.random() * 10);
            environmentGroup.add(cactus);
        }
    } else if (env === "mountain") {
        const peak = new THREE.Mesh(new THREE.ConeGeometry(6, 8, 32), new THREE.MeshStandardMaterial({ color: 0x6b7280 }));
        peak.position.set(-8, 4, -15);
        environmentGroup.add(peak);
        const snow = new THREE.Mesh(new THREE.ConeGeometry(6.2, 2.6, 32), new THREE.MeshStandardMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.75 }));
        snow.position.set(-8, 6.4, -15);
        environmentGroup.add(snow);
    }
}

function collectInputParams() {
    return {
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
}

async function resolveSiteContext(params) {
    const location = await geocodeLocation(params.location);
    const climate = location ? await fetchClimate(location.latitude, location.longitude) : null;
    if (climate) climate.seaLevel = params.environment === "coastal" ? "coastal" : undefined;
    const environment = environmentFromLocation(location, params.environment);
    return { location, climate, environment };
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
        state.sweepStats = null;
        state.totalGenerated = 0;
        state.activeIndex = 0;
        if (ui.designList) ui.designList.innerHTML = "";

        const params = collectInputParams();

        showGenerationProgress(params.variantCount);

        const { location, climate, environment } = await resolveSiteContext(params);
        updateEnvironment(environment, location);

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

        state.designs.sort((a, b) => (b.analytics.optimizationScore || 0) - (a.analytics.optimizationScore || 0));
        state.totalGenerated = state.designs.length;
        updateVariantCountLabel();
        renderDesignList();
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
    state.activeIndex = index;
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

async function runMegaBatch() {
    if (!ui.megaBatch) return;
    const params = collectInputParams();
    const sweepSize = Math.max(1024, params.variantCount * 48);
    const retain = Math.min(72, Math.max(params.variantCount, 36));
    ui.megaBatch.disabled = true;
    ui.megaBatch.textContent = "🌀 Sweeping…";
    if (ui.generate) ui.generate.disabled = true;
    showGenerationProgress(sweepSize);
    setSimulationStatus(`Mega batch sweep running (${sweepSize} candidates)…`);

    try {
        const { location, climate, environment } = await resolveSiteContext(params);
        updateEnvironment(environment, location);
        state.designs = [];
        state.activeIndex = 0;
        state.totalGenerated = 0;
        state.sweepStats = null;
        if (ui.designList) ui.designList.innerHTML = "";

        const cohort = [];
        let aggregateScore = 0;
        let bestEntry = null;

        for (let i = 0; i < sweepSize; i++) {
            const seed = randomUint32();
            const design = generateLayout(seed, params);
            const analytics = computeAnalytics(design, { climate, location });
            aggregateScore += analytics.optimizationScore || 0;
            if (!bestEntry || (analytics.optimizationScore || 0) > (bestEntry.analytics.optimizationScore || 0)) {
                bestEntry = { design, seed, analytics };
            }
            if (cohort.length < retain) {
                cohort.push({ design, seed, analytics });
            } else {
                let worstIndex = 0;
                for (let j = 1; j < cohort.length; j++) {
                    if ((cohort[j].analytics.optimizationScore || 0) < (cohort[worstIndex].analytics.optimizationScore || 0)) {
                        worstIndex = j;
                    }
                }
                if ((analytics.optimizationScore || 0) > (cohort[worstIndex].analytics.optimizationScore || 0)) {
                    cohort[worstIndex] = { design, seed, analytics };
                }
            }
            updateGenerationProgress(i + 1, sweepSize);
            // eslint-disable-next-line no-await-in-loop
            await yieldToFrame();
        }

        state.designs = cohort.sort((a, b) => (b.analytics.optimizationScore || 0) - (a.analytics.optimizationScore || 0));
        state.totalGenerated = sweepSize;
        state.sweepStats = {
            totalCandidates: sweepSize,
            averageScore: aggregateScore / sweepSize,
            topScore: bestEntry?.analytics.optimizationScore || 0,
            bestId: bestEntry?.design.id,
        };
        updateVariantCountLabel();
        renderDesignList();
        activateDesign(0);
        completeGenerationProgress({
            message: `Mega batch ready. Top ${state.designs.length} retained.`,
            success: true,
        });
        const leader = state.sweepStats?.bestId
            ? ` Leader ${state.sweepStats.bestId} (${Math.round(state.sweepStats.topScore || 0)} pts).`
            : "";
        setSimulationStatus(`Mega batch complete: ${sweepSize} candidates synthesized.${leader}`);
    } catch (error) {
        console.error("Mega batch error", error);
        setSimulationStatus("Mega batch failed. Try smaller variant counts.");
        completeGenerationProgress({ message: "Mega batch failed.", success: false });
    } finally {
        if (ui.megaBatch) {
            ui.megaBatch.disabled = false;
            ui.megaBatch.textContent = "🧬 Mega Batch 1K Sweep";
        }
        if (ui.generate) ui.generate.disabled = false;
    }
}

if (ui.generate) {
    ui.generate.addEventListener("click", generateDesigns);
} else {
    console.warn("Generate button not found; layout synthesis UI inactive.");
}

if (ui.megaBatch) {
    ui.megaBatch.addEventListener("click", runMegaBatch);
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
