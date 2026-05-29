import {
  DEFAULT_GENERATOR_TUNING,
  normalizeGeneratorTuning,
  type GeneratorTheme,
  type GeneratorTuning,
} from "../core/generator-tuning";
import type { GeneratedLevelRecord } from "../core/profile";

function buildSlider(
  label: string,
  id: string,
  value: number,
  onChange: (value: number) => void,
): HTMLElement {
  const row = document.createElement("label");
  row.className = "generator-tuning-row";
  row.htmlFor = id;

  const title = document.createElement("span");
  title.textContent = label;

  const input = document.createElement("input");
  input.type = "range";
  input.min = "0";
  input.max = "100";
  input.step = "1";
  input.value = String(value);
  input.id = id;
  input.setAttribute("data-testid", id);

  const readout = document.createElement("output");
  readout.setAttribute("for", id);
  readout.textContent = String(value);

  input.addEventListener("input", () => {
    const next = Number(input.value);
    readout.textContent = String(next);
    onChange(next);
  });

  row.append(title, input, readout);
  return row;
}

export interface GeneratorTuningPanelHandle {
  element: HTMLElement;
  readTuning: () => GeneratorTuning;
}

export function mountGeneratorTuningPanel(
  initial: Partial<GeneratorTuning> = {},
): GeneratorTuningPanelHandle {
  const state = normalizeGeneratorTuning({
    ...DEFAULT_GENERATOR_TUNING,
    ...initial,
  });

  const panel = document.createElement("section");
  panel.className = "generator-tuning-panel";
  panel.setAttribute("aria-label", "Level generator dials");
  panel.setAttribute("data-testid", "generator-tuning-panel");

  const heading = document.createElement("h2");
  heading.textContent = "Generator Dials";
  panel.appendChild(heading);

  const difficulty = document.createElement("select");
  difficulty.className = "difficulty-select";
  difficulty.setAttribute("data-testid", "generated-difficulty");
  for (const value of [
    "easy",
    "normal",
    "hard",
    "harder",
    "insane",
    "demon",
    "nightmare",
  ] as const) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value[0]!.toUpperCase() + value.slice(1);
    option.selected = value === state.difficulty;
    difficulty.appendChild(option);
  }
  difficulty.addEventListener("change", () => {
    state.difficulty =
      difficulty.value as GeneratedLevelRecord["difficulty"];
  });

  const subRank = document.createElement("select");
  subRank.className = "difficulty-select";
  subRank.setAttribute("data-testid", "generated-sub-rank");
  for (const value of ["bronze", "gold", "diamond", "void"] as const) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value[0]!.toUpperCase() + value.slice(1);
    option.selected = value === state.subRank;
    subRank.appendChild(option);
  }
  subRank.addEventListener("change", () => {
    state.subRank = subRank.value as NonNullable<GeneratedLevelRecord["subRank"]>;
  });

  const theme = document.createElement("select");
  theme.className = "difficulty-select";
  theme.setAttribute("data-testid", "generated-theme");
  for (const value of [
    "electric",
    "cave",
    "space",
    "disco",
    "flash",
    "forest",
    "sunset",
    "void",
  ] as const satisfies readonly GeneratorTheme[]) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value[0]!.toUpperCase() + value.slice(1);
    option.selected = value === state.theme;
    theme.appendChild(option);
  }
  theme.addEventListener("change", () => {
    state.theme = theme.value as GeneratorTheme;
  });

  const selects = document.createElement("div");
  selects.className = "generator-tuning-selects";
  selects.append(difficulty, subRank, theme);
  panel.appendChild(selects);

  panel.appendChild(
    buildSlider("Length", "tuning-length", state.length, (value) => {
      state.length = value;
    }),
  );
  panel.appendChild(
    buildSlider("Variety", "tuning-variety", state.variety, (value) => {
      state.variety = value;
    }),
  );
  panel.appendChild(
    buildSlider(
      "Obstacle density",
      "tuning-obstacle-density",
      state.obstacleDensity,
      (value) => {
        state.obstacleDensity = value;
      },
    ),
  );
  panel.appendChild(
    buildSlider(
      "Ship emphasis",
      "tuning-ship-emphasis",
      state.shipEmphasis,
      (value) => {
        state.shipEmphasis = value;
      },
    ),
  );
  panel.appendChild(
    buildSlider(
      "Spike / jump emphasis",
      "tuning-spike-emphasis",
      state.spikeEmphasis,
      (value) => {
        state.spikeEmphasis = value;
      },
    ),
  );
  panel.appendChild(
    buildSlider(
      "Vertical height",
      "tuning-vertical-emphasis",
      state.verticalEmphasis,
      (value) => {
        state.verticalEmphasis = value;
      },
    ),
  );

  return {
    element: panel,
    readTuning: () => normalizeGeneratorTuning(state),
  };
}
