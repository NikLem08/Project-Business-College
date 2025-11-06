import { fetchPokemonDetails } from "./api.js";

// Get common elements
const modal = document.getElementById("pokemonModal");
const modalContent = document.getElementById("pokemonDetails");
const typeFilter = document.getElementById("typeFilter");

/**
 * Populates the type filter dropdown with Pokémon types.
 * @param {Array<string>} types - An array of type names.
 */
function populateTypeFilter(types) {
  typeFilter.innerHTML = '<option value="">All Types</option>';
  types.forEach((type) => {
    const option = document.createElement("option");
    option.value = type;
    option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
    typeFilter.appendChild(option);
  });
}

/**
 * Creates and appends a single Pokémon card to the list.
 * @param {Object} pokemon - The Pokémon data object.
 * @param {HTMLElement} listElement - The DOM element to append the card to.
 */
function renderPokemonCard(pokemon, listElement) {
  const card = document.createElement("div");
  card.classList.add("pokemon-card");

  card.innerHTML = `
    <img src="${
      pokemon.sprites.other["official-artwork"].front_default
    }" alt="${pokemon.name}">
    <p class="pokemon-id">#${String(pokemon.id).padStart(3, "0")}</p>
    <h3>${pokemon.name.toUpperCase()}</h3>
    <div class="types-container">
        ${pokemon.types
          .map(
            (t) =>
              `<span class="pokemon-type type-icon ${
                t.type.name
              }" title="${t.type.name.toUpperCase()}"></span>`
          )
          .join("")}
    </div>
  `;

  // Attach click listener to show details
  card.addEventListener("click", () => showPokemonDetails(pokemon.id));
  listElement.appendChild(card);
}

/**
 * Renders a list of Pokémon to the specified list container.
 * @param {Array<Object>} pokemons - The array of Pokémon data.
 * @param {HTMLElement} listElement - The DOM element to render the list in.
 */
function renderPokemonList(pokemons, listElement) {
  listElement.innerHTML = "";
  if (pokemons.length === 0) {
    listElement.innerHTML =
      '<p class="no-results">No Pokémon found matching your criteria.</p>';
    return;
  }
  pokemons.forEach((pokemon) => renderPokemonCard(pokemon, listElement));
}

/**
 * Shows the detailed modal for a specific Pokémon.
 * @param {number} id - The ID of the Pokémon.
 */
async function showPokemonDetails(id) {
  const data = await fetchPokemonDetails(id);
  if (!data) return;

  // Stat Icons
  const statIcons = {
    hp: "❤️",
    attack: "⚔️",
    defense: "🛡️",
    "special-attack": "🔥",
    "special-defense": "💎",
    speed: "⚡",
  };

  const images = {
    normal: data.sprites.other["official-artwork"]?.front_default,
    shiny: data.sprites.front_shiny,
  };
  let current = "normal";

  // Abilities List
  const abilitiesList = data.abilities
    .map(
      (a) =>
        `<li><span>${a.ability.name.toUpperCase()}</span><strong>${
          a.is_hidden ? "HIDDEN" : "STANDARD"
        }</strong></li>`
    )
    .join("");

  // Cry Button
  const cryUrl = data.cries.latest || data.cries.legacy;
  const cryButton = cryUrl
    ? `<button id="playCryBtn" class="cry-button">🔊</button>`
    : "";

  // Modal Content HTML
  modalContent.innerHTML = `
    <div class="modal-header">
        <h2>${data.name.toUpperCase()} (#${data.id})${cryButton}</h2>
        <span class="close-modal-btn" id="closeModal">&times;</span>
    </div>
    <div class="modal-body">
        <div class="image-container">
            <img id="pokemonImage" src="${images.normal}" alt="${data.name}">
            <button id="toggleImageBtn">Switch Image</button>
        </div>
        <p><b>Types:</b> 
            ${data.types
              .map(
                (t) =>
                  `<span class="pokemon-type type-icon ${
                    t.type.name
                  }" title="${t.type.name.toUpperCase()}"></span>`
              )
              .join("")}
        </p>
        <h3>General Info</h3>
        <ul>
            <li><span>HEIGHT</span><strong>${data.height / 10} m</strong></li>
            <li><span>WEIGHT</span><strong>${data.weight / 10} kg</strong></li>
            <li><span>BASE EXP.</span><strong>${
              data.base_experience
            }</strong></li>
        </ul>
        <h3>Abilities</h3>
        <ul>
            ${abilitiesList}
        </ul>
        <h3>Base Stats</h3>
        <ul>
        ${data.stats
          .map(
            (s) => `
                <li>
                <span>${
                  statIcons[s.stat.name] || "•"
                } ${s.stat.name.toUpperCase()}</span>
                <strong>${s.base_stat}</strong>
                </li>
            `
          )
          .join("")}
        </ul>
        <h3>Moves (Top 10)</h3>
        <p>${data.moves
          .slice(0, 10)
          .map((m) => m.move.name.toUpperCase())
          .join(", ")}</p>
    </div>
  `;

  modal.style.display = "flex";

  // Modal Event Listeners (moved to UI for cleanup)
  const toggleBtn = document.getElementById("toggleImageBtn");
  const imageEl = document.getElementById("pokemonImage");
  const playCryBtn = document.getElementById("playCryBtn");
  const closeModalBtn = document.getElementById("closeModal");

  // Image Toggle
  toggleBtn.addEventListener("click", () => {
    if (current === "normal") {
      imageEl.src = images.shiny || images.normal;
      toggleBtn.textContent = "Switch Back";
      current = "shiny";
    } else {
      imageEl.src = images.normal;
      toggleBtn.textContent = "Switch Image";
      current = "normal";
    }
  });

  // Play Cry
  if (playCryBtn && cryUrl) {
    playCryBtn.addEventListener("click", () => {
      const audio = new Audio(cryUrl);
      audio.play();
    });
  }

  // Close Modal
  closeModalBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });
}

// Close modal when clicking outside
window.addEventListener("click", (e) => {
  if (e.target === modal) modal.style.display = "none";
});

export {
  populateTypeFilter,
  renderPokemonList,
  renderPokemonCard,
  showPokemonDetails,
};
