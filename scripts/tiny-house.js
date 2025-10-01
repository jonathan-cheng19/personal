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
    metricModeControls: document.getElementById("metricModeControls"),
    metricLegend: document.getElementById("metricLegend"),
    optimizationInsights: document.getElementById("optimizationInsights"),
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

if (ui.metricModeControls) {
    ui.metricModeControls.querySelectorAll("button").forEach((button) => {
        button.addEventListener("click", () => {
            ui.metricModeControls.querySelectorAll("button").forEach((btn) => btn.classList.remove("active"));
            button.classList.add("active");
            updateRoomVisuals(button.dataset.mode);
        });
    });
}

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

const labelGroup = new THREE.Group();
scene.add(labelGroup);

function clearGroups() {
    Object.values(lensGroups).forEach((group) => {
        while (group.children.length) {
            const child = group.children[group.children.length - 1];
            group.remove(child);
            if (child.geometry) child.geometry.dispose?.();
            const material = child.material;
            if (Array.isArray(material)) {
                material.forEach((mat) => mat?.map?.dispose?.());
                material.forEach((mat) => mat?.dispose?.());
            } else if (material) {
                material.map?.dispose?.();
                material.dispose?.();
            }
        }
    });
    while (labelGroup.children.length) {
        const child = labelGroup.children.pop();
        if (child.material?.map) child.material.map.dispose?.();
        child.material?.dispose?.();
    }
    state.roomMeshes = [];
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
    metricMode: "program",
    roomMeshes: [],
};

const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

const programPalette = {
    Living: 0x60a5fa,
    Sleeping: 0xf472b6,
    Culinary: 0xf59e0b,
    Wellness: 0x34d399,
    Flex: 0xa855f7,
    Utility: 0x38bdf8,
    Service: 0x94a3b8,
};

const heatmapPalettes = {
    cost: [0x38bdf8, 0x0ea5e9, 0xf97316],
    energy: [0x22d3ee, 0x3b82f6, 0x9333ea],
    carbon: [0x4ade80, 0xfacc15, 0xef4444],
    comfort: [0x10b981, 0x60a5fa, 0xf97316],
};

const metricMetadata = {
    program: { label: "Program", unit: "", palette: null, accessor: (room) => room.category },
    cost: { label: "Cost Intensity", unit: "USD / sqft", palette: heatmapPalettes.cost, accessor: (room) => room.performance?.costPerSqft ?? 0 },
    energy: { label: "Energy Intensity", unit: "kWh / sqft·yr", palette: heatmapPalettes.energy, accessor: (room) => room.performance?.energyIntensity ?? 0 },
    carbon: { label: "Embodied Carbon", unit: "kg CO₂e / sqft", palette: heatmapPalettes.carbon, accessor: (room) => room.performance?.carbonIntensity ?? 0 },
    comfort: { label: "Comfort Index", unit: "Score 0–100", palette: heatmapPalettes.comfort, accessor: (room) => room.performance?.comfortScore ?? 0 },
};

function interpolatePalette(palette, t) {
    if (!palette?.length) return new THREE.Color(0xffffff);
    const clamped = Math.max(0, Math.min(1, t));
    const scaled = clamped * (palette.length - 1);
    const idx = Math.floor(scaled);
    const frac = scaled - idx;
    const start = new THREE.Color(palette[idx]);
    const end = new THREE.Color(palette[Math.min(idx + 1, palette.length - 1)]);
    return start.lerp(end, frac);
}

function createMaterialTextures() {
    const parquetCanvas = document.createElement("canvas");
    parquetCanvas.width = parquetCanvas.height = 256;
    const ctx = parquetCanvas.getContext("2d");
    ctx.fillStyle = "#2f3e54";
    ctx.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            const tone = 38 + ((x + y) % 2) * 10;
            ctx.fillStyle = `rgb(${tone + 70}, ${tone + 40}, ${tone})`;
            ctx.fillRect(x * 32, y * 32, 32, 32);
        }
    }
    const parquetTexture = new THREE.CanvasTexture(parquetCanvas);
    parquetTexture.wrapS = parquetTexture.wrapT = THREE.RepeatWrapping;
    parquetTexture.repeat.set(6, 6);

    const roofCanvas = document.createElement("canvas");
    roofCanvas.width = roofCanvas.height = 128;
    const roofCtx = roofCanvas.getContext("2d");
    roofCtx.fillStyle = "#111827";
    roofCtx.fillRect(0, 0, 128, 128);
    roofCtx.fillStyle = "rgba(148, 163, 184, 0.2)";
    for (let i = 0; i < 18; i++) {
        roofCtx.fillRect(i * 7, 0, 3, 128);
    }
    const roofTexture = new THREE.CanvasTexture(roofCanvas);
    roofTexture.wrapS = roofTexture.wrapT = THREE.RepeatWrapping;
    roofTexture.repeat.set(3, 3);

    return { parquet: parquetTexture, roof: roofTexture };
}

const textures = createMaterialTextures();

function getProgramColor(category) {
    return programPalette[category] ?? 0x94a3b8;
}

function createRoomLabel(text) {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 64;
    const context = canvas.getContext("2d");
    context.fillStyle = "rgba(15, 23, 42, 0.82)";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "rgba(255, 255, 255, 0.92)";
    context.font = "28px 'Inter', sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(2.2, 0.55, 1);
    return sprite;
}

function updateMetricLegend(mode, stats = {}) {
    if (!ui.metricLegend) return;
    if (mode === "program") {
        const categories = Array.from(
            new Set(state.roomMeshes.map((mesh) => mesh.userData?.room?.category).filter(Boolean))
        );
        if (!categories.length) {
            ui.metricLegend.innerHTML =
                '<strong>Program Legend</strong><span>Generate a layout to reveal spatial program colors.</span>';
            return;
        }
        ui.metricLegend.innerHTML = [
            '<strong>Program Legend</strong>',
            ...categories.map((category) => {
                const color = new THREE.Color(getProgramColor(category));
                return `<div class="legend-row"><span class="legend-swatch" style="background: #${color.getHexString()}"></span><span>${category}</span></div>`;
            }),
        ].join("");
        return;
    }

    const formatter = (value) => {
        if (typeof value !== "number" || Number.isNaN(value)) return "—";
        if (Math.abs(value) >= 1000) return Math.round(value).toLocaleString();
        if (Math.abs(value) >= 100) return value.toFixed(0);
        return value.toFixed(1);
    };

    const gradient = stats.palette
        ? `linear-gradient(90deg, ${stats.palette
              .map((hex, idx) => {
                  const color = new THREE.Color(hex).getStyle();
                  const stop = Math.round((idx / (stats.palette.length - 1 || 1)) * 100);
                  return `${color} ${stop}%`;
              })
              .join(", ")})`
        : undefined;

    ui.metricLegend.innerHTML = `
        <strong>${stats.label ?? "Metric"}</strong>
        <div class="legend-bar" style="background:${gradient || "rgba(56,189,248,0.8)"}"></div>
        <div class="legend-labels"><span>${formatter(stats.min)}</span><span>${formatter(stats.max)}</span></div>
        <span>${stats.unit ?? ""}</span>
    `;
}

function updateRoomVisuals(mode = state.metricMode) {
    state.metricMode = mode;
    const meta = metricMetadata[mode];
    if (!meta || !state.roomMeshes.length) {
        updateMetricLegend(mode);
        return;
    }
    if (mode === "program") {
        state.roomMeshes.forEach((mesh) => {
            const room = mesh.userData?.room;
            const color = new THREE.Color(getProgramColor(room?.category));
            mesh.material.color.copy(color.clone().multiplyScalar(0.95));
            mesh.material.emissive.copy(color.clone().multiplyScalar(0.18));
            mesh.material.needsUpdate = true;
        });
        updateMetricLegend(mode);
        return;
    }

    const values = state.roomMeshes.map((mesh) => meta.accessor(mesh.userData?.room || {}));
    if (!values.length || values.every((value) => typeof value !== "number" || Number.isNaN(value))) {
        updateMetricLegend(mode, { label: meta.label, unit: meta.unit, min: 0, max: 0, palette: meta.palette });
        return;
    }
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    state.roomMeshes.forEach((mesh, idx) => {
        const value = values[idx];
        const normalized = (value - min) / range;
        const color = interpolatePalette(meta.palette, normalized);
        mesh.material.color.copy(color.clone().multiplyScalar(0.9));
        mesh.material.emissive.copy(color.clone().multiplyScalar(0.25 + normalized * 0.3));
        mesh.material.needsUpdate = true;
    });

    updateMetricLegend(mode, { label: meta.label, unit: meta.unit, min, max, palette: meta.palette });
}

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
        const type = assignRoomType(i, params, rand);
        const category = categorizeRoom(type);
        rooms.push({
            id: `module-${i}`,
            width,
            length,
            height: 3 * floors,
            x: x + width / 2,
            z: z + length / 2,
            type,
            category,
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

    rooms.forEach((room) => {
        room.performance = evaluateRoomPerformance(room, params, features);
        room.programColor = getProgramColor(room.category);
        room.areaSqft = room.performance.areaSqft;
    });

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

function categorizeRoom(type) {
    if (!type) return "Flex";
    const normalized = type.toLowerCase();
    if (normalized.includes("bed")) return "Sleeping";
    if (normalized.includes("bath")) return "Wellness";
    if (normalized.includes("kitchen") || normalized.includes("dining")) return "Culinary";
    if (normalized.includes("great") || normalized.includes("living") || normalized.includes("lounge")) return "Living";
    if (normalized.includes("workspace") || normalized.includes("studio") || normalized.includes("library")) return "Flex";
    if (normalized.includes("utility") || normalized.includes("mudroom")) return "Utility";
    if (normalized.includes("atrium") || normalized.includes("service") || normalized.includes("core")) return "Service";
    return "Flex";
}

function evaluateRoomPerformance(room, params, features) {
    const areaSqft = room.width * room.length * 10.7639;
    const categoryCost = {
        Living: 215,
        Sleeping: 185,
        Culinary: 255,
        Wellness: 230,
        Flex: 198,
        Utility: 160,
        Service: 150,
    };
    const categoryEnergy = {
        Living: 12,
        Sleeping: 8,
        Culinary: 15,
        Wellness: 11,
        Flex: 9,
        Utility: 7,
        Service: 6,
    };
    const categoryCarbon = {
        Living: 32,
        Sleeping: 26,
        Culinary: 35,
        Wellness: 28,
        Flex: 27,
        Utility: 24,
        Service: 20,
    };
    const sustainabilityCostFactor = { balanced: 1, carbon: 1.08, energy: 1.05, luxury: 1.22 };
    const paletteFactor = { minimal: 0.95, industrial: 1.02, organic: 1.08, futuristic: 1.14 };
    const envelopeFactor = { standard: 1, hempcrete: 0.86, recycled: 0.74, "mass-timber": 0.92 };
    const energySystemFactor = { hybrid: 0.88, geothermal: 0.78, grid: 1, microgrid: 0.82 };
    const comfortOrientation = { balanced: 0, southern: 3, eastern: 2, western: -2 };

    const costPerSqft =
        (categoryCost[room.category] ?? 200) *
        (sustainabilityCostFactor[params.sustainability] ?? 1.05) *
        (paletteFactor[params.palette] ?? 1);

    const energyIntensity =
        (categoryEnergy[room.category] ?? 10) *
        (energySystemFactor[params.energySystem] ?? 0.95) *
        (1 - Math.min(0.22, features.glazingRatio * 0.28));

    const carbonIntensity =
        (categoryCarbon[room.category] ?? 26) *
        (envelopeFactor[params.envelope] ?? 1) *
        (params.sustainability === "carbon" ? 0.92 : 1);

    const comfortBase = 68 + features.glazingRatio * 22 + (room.category === "Sleeping" ? 3 : 0);
    const comfortScore = Math.min(
        96,
        Math.max(
            60,
            comfortBase +
                (params.sustainability === "luxury" ? 6 : params.sustainability === "energy" ? 5 : 3) +
                (comfortOrientation[params.orientation] ?? 0) -
                (params.energySystem === "grid" ? 2 : 0)
        )
    );

    const totalCost = costPerSqft * areaSqft;
    const energyUse = energyIntensity * areaSqft;
    const carbonTotal = carbonIntensity * areaSqft;

    return { areaSqft, costPerSqft, energyIntensity, carbonIntensity, comfortScore, totalCost, energyUse, carbonTotal };
}

function buildDesign(design, analytics) {
    clearGroups();
    const floorMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x1a2437,
        roughness: 0.8,
        metalness: 0.12,
        map: textures.parquet,
    });
    if (floorMaterial.map) floorMaterial.map.needsUpdate = true;

    const slabGeometry = new THREE.BoxGeometry(design.footprint.width + 0.2, 0.22, design.footprint.length + 0.2);
    const floor = new THREE.Mesh(slabGeometry, floorMaterial);
    floor.receiveShadow = true;
    floor.position.y = 0;
    floor.userData.isSlab = true;
    floor.userData.baseY = floor.position.y;
    floor.userData.baseScaleY = floor.scale.y;
    lensGroups.walls.add(floor);

    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x020617, transparent: true, opacity: 0.35 });
    const structureMaterial = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.3 });
    const systemsMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xf97316,
        emissive: new THREE.Color(0x7c2d12),
        roughness: 0.35,
        metalness: 0.25,
    });

    const wallThickness = 0.2;
    design.rooms.forEach((room) => {
        const geometry = new THREE.BoxGeometry(
            Math.max(room.width - wallThickness, 0.4),
            room.height,
            Math.max(room.length - wallThickness, 0.4)
        );
        const material = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(room.programColor || 0xe2e8f0).multiplyScalar(0.9),
            roughness: 0.38,
            metalness: 0.18,
            clearcoat: 0.35,
            clearcoatRoughness: 0.25,
            transparent: true,
            opacity: 0.94,
        });
        const roomMesh = new THREE.Mesh(geometry, material);
        roomMesh.position.set(room.x, room.height / 2, room.z);
        roomMesh.castShadow = true;
        roomMesh.receiveShadow = true;
        roomMesh.userData.room = room;
        roomMesh.userData.originalScaleY = roomMesh.scale.y;
        state.roomMeshes.push(roomMesh);
        lensGroups.walls.add(roomMesh);

        const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), edgeMaterial.clone());
        edges.position.copy(roomMesh.position);
        lensGroups.structure.add(edges);

        const frameBase = new THREE.BoxGeometry(
            geometry.parameters.width + 0.18,
            room.height + 0.25,
            geometry.parameters.depth + 0.18
        );
        const frameEdges = new THREE.EdgesGeometry(frameBase);
        frameBase.dispose();
        const frame = new THREE.LineSegments(frameEdges, structureMaterial.clone());
        frame.position.copy(roomMesh.position);
        lensGroups.structure.add(frame);

        const label = createRoomLabel(room.type);
        label.position.set(room.x, room.height + 0.35, room.z);
        labelGroup.add(label);
        roomMesh.userData.label = label;
    });

    const roofMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x101827,
        roughness: 0.55,
        metalness: 0.28,
        map: textures.roof,
        clearcoat: 0.12,
    });
    if (roofMaterial.map) roofMaterial.map.needsUpdate = true;
    const roof = new THREE.Mesh(
        new THREE.BoxGeometry(design.footprint.width + 0.45, 0.2, design.footprint.length + 0.45),
        roofMaterial
    );
    roof.position.y = design.rooms[0]?.height + 0.22 || 3.3;
    roof.castShadow = true;
    roof.receiveShadow = true;
    lensGroups.roof.add(roof);

    design.connectors.forEach((core) => {
        const pipe = new THREE.Mesh(new THREE.CylinderGeometry(core.radius * 0.28, core.radius * 0.28, 3.2, 24), systemsMaterial.clone());
        pipe.position.set(core.x, 1.5, core.z);
        pipe.material.transparent = true;
        pipe.material.opacity = 0.72;
        lensGroups.systems.add(pipe);

        const conduit = new THREE.Mesh(new THREE.TorusGeometry(core.radius, 0.06, 12, 48), systemsMaterial.clone());
        conduit.rotation.x = Math.PI / 2;
        conduit.position.set(core.x, 2.2, core.z);
        lensGroups.systems.add(conduit);
    });

    updateRoomVisuals(state.metricMode);
    applyLensVisibility();

    if (analytics?.comfortScore && ui.headerStatus) {
        ui.headerStatus.textContent = `Comfort index ${analytics.comfortScore.toFixed(0)}/100`;
    }
}

function describeDesign(design, analytics) {
    if (ui.activeDesignTitle) {
        ui.activeDesignTitle.textContent = `${design.id} · ${analytics.programProfile}`;
    }
    if (ui.layoutSummary) {
        ui.layoutSummary.innerHTML = design.rooms
            .slice(0, 12)
            .map((room) => {
                const perf = room.performance || {};
                const sqft = Math.round(perf.areaSqft ?? room.width * room.length * 10.7639);
                const cost = perf.costPerSqft ? `$${perf.costPerSqft.toFixed(0)}/sqft` : "—";
                const energy = perf.energyIntensity ? `${Math.round(perf.energyIntensity)} kWh/yr·sqft` : "—";
                return `
                    <div class="room-summary">
                        <div>
                            <strong>${room.type}</strong>
                            <span>${room.category}</span>
                        </div>
                        <div class="room-metrics">
                            <span>${sqft.toLocaleString()} sqft</span>
                            <span>${cost} · ${energy}</span>
                        </div>
                    </div>
                `;
            })
            .join("");
    }
    if (ui.highlightPills) {
        ui.highlightPills.innerHTML = analytics.highlights.map((h) => `<span>${h}</span>`).join("");
    }
    if (ui.optimizationInsights) {
        ui.optimizationInsights.innerHTML = (analytics.optimization || [])
            .map((entry) => `<div class="insight-card"><strong>${entry.value}</strong><span>${entry.label}</span></div>`)
            .join("");
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

    const roomPerformance = design.rooms
        .map((room) => room.performance)
        .filter((perf) => perf && Number.isFinite(perf.totalCost));
    const totalProgramArea = roomPerformance.reduce((sum, perf) => sum + (perf.areaSqft || 0), 0) || areaSqft;
    const totalRoomCost = roomPerformance.reduce((sum, perf) => sum + (perf.totalCost || 0), 0);
    const comfortScore = roomPerformance.length
        ? roomPerformance.reduce((sum, perf) => sum + (perf.comfortScore || 0) * (perf.areaSqft || 0), 0) / totalProgramArea
        : 72;

    let energyUse = areaSqft * 14 * energyMultiplier * climateEnergy;
    const energyFromRooms = roomPerformance.reduce((sum, perf) => sum + (perf.energyUse || 0), 0);
    if (energyFromRooms > 0) {
        energyUse = energyFromRooms;
    }

    const marketValue = estimateMarketValue(areaSqft, context?.location || null);
    const materialCosts = buildMaterialCosts(design, floorArea, wallArea, envelopeFactor, marketValue.costFactor);
    const aggregatedCost =
        totalRoomCost > 0 ? Math.max(totalRoomCost, materialCosts.totalCost) : materialCosts.totalCost;
    const costPerSqft = aggregatedCost / Math.max(1, areaSqft);
    const carbonPerSqft = embodiedCarbon / Math.max(1, areaSqft);
    const energyPerSqft = energyUse / Math.max(1, areaSqft);

    const highlights = [
        `${design.features.roofType} roof`,
        `${Math.round(design.features.glazingRatio * 100)}% glazing`,
        `${design.params.energySystem} energy hub`,
        `${design.params.envelope} envelope`,
        `${Math.round(costPerSqft).toLocaleString()} USD/sqft build cost`,
        `${Math.round(comfortScore)} comfort score`,
    ];

    const timeline = buildTimeline(design, floorArea, materialCosts.printHours, design.params.fabricator);
    const financial = buildFinancials(materialCosts, marketValue);
    const systems = buildSystems(design, energyUse);
    const envelope = buildEnvelope(design, context?.climate);
    const climateRisks = assessClimate(context?.climate, context?.location);
    const climateStrategies = buildClimateStrategies(climateRisks, design);

    const optimization = [
        { label: "Total Build Cost", value: materialCosts.currencyFormatter.format(aggregatedCost) },
        { label: "Cost Efficiency", value: materialCosts.currencyFormatter.format(costPerSqft) },
        { label: "Energy Intensity", value: `${Math.round(energyPerSqft)} kWh/yr·sqft` },
        { label: "Comfort Index", value: `${Math.round(comfortScore)}/100` },
    ];

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
        optimization,
        comfortScore,
        costPerSqft,
        carbonPerSqft,
        energyPerSqft,
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
    buildDesign(selected.design, selected.analytics);
    describeDesign(selected.design, selected.analytics);
    const comfort = selected.analytics?.comfortScore;
    const statusSuffix = Number.isFinite(comfort) ? ` · Comfort ${Math.round(comfort)}/100` : "";
    setSimulationStatus(`Ready: ${selected.design.id}${statusSuffix}`);
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
updateMetricLegend(state.metricMode);
