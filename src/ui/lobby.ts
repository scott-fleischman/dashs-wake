const futureDestinations = [
  "Generated Levels",
  "Gauntlets",
  "Chest Room",
  "Shop",
  "Icon Customizer",
  "Settings",
] as const;

const PLAY_ROUTE = "#play";

function destinationButton(name: (typeof futureDestinations)[number]): string {
  return `
    <button class="destination future" type="button" aria-label="${name} - Coming later" disabled>
      <span>${name}</span>
      <small>Coming later</small>
    </button>
  `;
}

export function mountLobby(root: HTMLElement): void {
  root.innerHTML = `
    <main class="lobby">
      <header class="title">
        <p class="kicker">Rhythm Runner Prototype</p>
        <h1>Dash's Wake</h1>
        <p class="subtitle">Original geometric worlds shaped by the beat.</p>
      </header>

      <nav class="destination-grid" aria-label="Destinations">
        <div class="future-left">
          ${futureDestinations.slice(0, 3).map(destinationButton).join("")}
        </div>

        <button class="play-button" type="button" data-action="play" aria-pressed="false">
          <span class="play-symbol" aria-hidden="true"></span>
          <span>Play</span>
        </button>

        <div class="future-right">
          ${futureDestinations.slice(3).map(destinationButton).join("")}
        </div>
      </nav>

      <section class="selection" hidden>
        <p role="status">Play selected. The practice lane opens in the next build.</p>
      </section>
    </main>
  `;

  const playButton = root.querySelector<HTMLButtonElement>("[data-action='play']");
  const selection = root.querySelector<HTMLElement>(".selection");

  if (!playButton || !selection) {
    throw new Error("Lobby controls did not mount correctly.");
  }

  const updateRoute = (): void => {
    const selected = window.location.hash === PLAY_ROUTE;
    playButton.setAttribute("aria-pressed", String(selected));
    selection.hidden = !selected;
    root.classList.toggle("play-selected", selected);
  };

  playButton.addEventListener("click", () => {
    window.location.hash = PLAY_ROUTE;
    updateRoute();
  });
  window.addEventListener("hashchange", updateRoute);

  updateRoute();
}
