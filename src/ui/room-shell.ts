export interface RoomShell {
  list: HTMLUListElement;
  main: HTMLElement;
}

export function buildRoomShell(title: string, onBack: () => void): RoomShell {
  const main = document.createElement("main");
  main.className = "room";
  main.setAttribute("aria-label", title);

  const header = document.createElement("header");
  main.appendChild(header);

  const heading = document.createElement("h1");
  heading.textContent = title;
  header.appendChild(heading);

  const backButton = document.createElement("button");
  backButton.type = "button";
  backButton.className = "utility-button";
  backButton.setAttribute("data-testid", "room-back");
  backButton.textContent = "Back to Lobby";
  backButton.addEventListener("click", onBack);
  header.appendChild(backButton);

  const list = document.createElement("ul");
  list.className = "cosmetic-list";
  main.appendChild(list);

  return { list, main };
}

export interface RoomRowOptions {
  actionDisabled: boolean;
  actionLabel: string;
  actionTestId: string;
  detail?: string;
  hintText?: string;
  hintTestId?: string;
  hintVisible?: boolean;
  name: string;
  nameTestId?: string;
  onAction: () => void;
  rowExtraClass?: string;
  statusLabel: string;
  statusTestId: string;
  statusVisible: boolean;
  swatchColor?: number;
  swatchPlaceholder?: boolean;
  swatchShape?: "rectangle" | "diamond" | "circle";
  swatchMotif?: string;
  swatchTestId?: string;
}

function formatSwatchColor(color: number): string {
  return `#${color.toString(16).padStart(6, "0")}`;
}

export function buildRoomRow(options: RoomRowOptions): HTMLLIElement {
  const li = document.createElement("li");
  li.className = options.rowExtraClass
    ? `cosmetic-row ${options.rowExtraClass}`
    : "cosmetic-row";

  if (options.swatchColor !== undefined) {
    const shapeClass =
      options.swatchShape === "circle"
        ? " shape-circle"
        : options.swatchShape === "diamond"
          ? " shape-diamond"
          : "";
    const swatch = document.createElement("span");
    const motifClass = options.swatchMotif ? ` motif-${options.swatchMotif}` : "";
    swatch.className = `cosmetic-swatch${shapeClass}${motifClass}`;
    swatch.style.background = formatSwatchColor(options.swatchColor);
    if (options.swatchTestId) {
      swatch.setAttribute("data-testid", options.swatchTestId);
    }
    li.appendChild(swatch);
  } else if (options.swatchPlaceholder) {
    const swatch = document.createElement("span");
    swatch.className = "cosmetic-swatch cosmetic-swatch-empty";
    li.appendChild(swatch);
  }

  const nameEl = document.createElement("span");
  nameEl.className = "cosmetic-name";
  nameEl.textContent = options.name;
  if (options.nameTestId) {
    nameEl.setAttribute("data-testid", options.nameTestId);
  }
  li.appendChild(nameEl);

  if (options.detail) {
    const detailEl = document.createElement("span");
    detailEl.className = "cosmetic-price";
    detailEl.textContent = options.detail;
    li.appendChild(detailEl);
  }

  const button = document.createElement("button");
  button.type = "button";
  button.className = "primary-button";
  button.setAttribute("data-testid", options.actionTestId);
  button.textContent = options.actionLabel;
  button.disabled = options.actionDisabled;
  button.addEventListener("click", options.onAction);
  li.appendChild(button);

  const status = document.createElement("span");
  status.className = "cosmetic-equipped";
  status.setAttribute("data-testid", options.statusTestId);
  status.textContent = options.statusLabel;
  status.hidden = !options.statusVisible;
  li.appendChild(status);

  if (options.hintTestId) {
    const hint = document.createElement("span");
    hint.className = "room-row-hint";
    hint.setAttribute("data-testid", options.hintTestId);
    hint.textContent = options.hintText ?? "";
    hint.hidden = !options.hintVisible;
    li.appendChild(hint);
  }

  return li;
}

export function safeTestId(itemId: string): string {
  return itemId.replace(/[^a-z0-9-]/gi, "-");
}
