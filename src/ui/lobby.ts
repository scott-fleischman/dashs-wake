const futureDestinations = [
  "Generated Levels",
  "Gauntlets",
  "Chest Room",
  "Shop",
  "Icon Customizer",
  "Settings",
] as const;

function destinationButton(name: (typeof futureDestinations)[number]): string {
  return `
    <button class="destination future" type="button" aria-label="${name} - Coming later" disabled>
      <span>${name}</span>
      <small>Coming later</small>
    </button>
  `;
}

export function mountLobby(root: HTMLElement, onPlay: () => void): () => void {
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

        <button class="play-button" type="button" data-action="play">
          <span class="play-symbol" aria-hidden="true"></span>
          <span>Play</span>
        </button>

        <div class="future-right">
          ${futureDestinations.slice(3).map(destinationButton).join("")}
        </div>
      </nav>
    </main>
  `;

  const playButton = root.querySelector<HTMLButtonElement>("[data-action='play']");

  if (!playButton) {
    throw new Error("Lobby controls did not mount correctly.");
  }

  playButton.addEventListener("click", onPlay);

  return () => {
    playButton.removeEventListener("click", onPlay);
  };
}
