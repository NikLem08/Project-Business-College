const pokemonList = document.getElementById("pokemonList");
const modal = document.getElementById("pokemonModal");
const modalContent = document.getElementById("pokemonDetails");
const closeModal = document.getElementById("closeModal");

const searchInput = document.getElementById("searchInput");
const loadMoreBtn = document.getElementById("loadMoreBtn");
const initialLoadingMessage = document.getElementById("initialLoadingMessage");

let allPokemons = [];
const renderChunkSize = 50;
let currentRenderLimit = renderChunkSize;

async function fetchAllPokemonDetails() {
  initialLoadingMessage.style.display = "block";

  const listRes = await fetch(
    "https://pokeapi.co/api/v2/pokemon?limit=100000&offset=0"
  );
  const listData = await listRes.json();

  const fetchPromises = listData.results.map(async (pokemon) => {
    const pokeRes = await fetch(pokemon.url);
    if (!pokeRes.ok) return null;
    return pokeRes.json();
  });

  allPokemons = (await Promise.all(fetchPromises)).filter((p) => p !== null);

  allPokemons.sort((a, b) => a.id - b.id);

  initialLoadingMessage.style.display = "none";

  applySearchAndRender();
}

loadMoreBtn.addEventListener("click", () => {
  loadMoreBtn.disabled = true;

  currentRenderLimit += renderChunkSize;

  applySearchAndRender();

  loadMoreBtn.disabled = false;
});

function applySearchAndRender() {
  let currentPokemons = [...allPokemons];

  const searchTerm = searchInput.value.toLowerCase().trim();

  if (searchTerm) {
    currentPokemons = currentPokemons.filter((pokemon) => {
      const nameMatch = pokemon.name.toLowerCase().includes(searchTerm);
      const idMatch = String(pokemon.id).startsWith(searchTerm);
      return nameMatch || idMatch;
    });

    loadMoreBtn.style.display = "none";

    renderPokemonList(currentPokemons);
  } else {
    const pokemonsToRender = currentPokemons.slice(0, currentRenderLimit);

    renderPokemonList(pokemonsToRender);

    if (currentRenderLimit < allPokemons.length) {
      loadMoreBtn.style.display = "block";
    } else {
      loadMoreBtn.style.display = "none";
    }
  }
}

function renderPokemonList(pokemons) {
  pokemonList.innerHTML = "";
  if (pokemons.length === 0) {
    pokemonList.innerHTML =
      '<p class="no-results">No Pokémon found matching your criteria.</p>';
    return;
  }
  pokemons.forEach(renderPokemon);
}

function renderPokemon(pokemon) {
  const card = document.createElement("div");
  card.classList.add("pokemon-card");
  card.innerHTML = `
    <img src="${
      pokemon.sprites.other["official-artwork"].front_default
    }" alt="${pokemon.name}">
    <p class="pokemon-id">#${pokemon.id}</p>
    <h3>${pokemon.name.toUpperCase()}</h3>
    <div class="types-container">
        ${pokemon.types
          .map(
            (t) =>
              `<span class="pokemon-type type-${
                t.type.name
              }">${t.type.name.toUpperCase()}</span>`
          )
          .join("")}
    </div>
  `;
  card.addEventListener("click", () => showPokemonDetails(pokemon.id));
  pokemonList.appendChild(card);
}

searchInput.addEventListener("input", applySearchAndRender);

async function showPokemonDetails(id) {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
  const data = await res.json();

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
    shiny: data.sprites?.front_shiny,
  };

  let current = "normal";

  modalContent.innerHTML = `
    <h2>${data.name.toUpperCase()} (#${data.id})</h2>
    <div class="image-container">
      <img id="pokemonImage" src="${images.normal}" alt="${data.name}">
      <button id="toggleImageBtn">Switch Image</button>
    </div>
    <p><b>Types:</b> 
        ${data.types
          .map(
            (t) =>
              `<span class="pokemon-type type-${
                t.type.name
              }">${t.type.name.toUpperCase()}</span>`
          )
          .join("")}
    </p>
    <h3>Stats</h3>
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
  `;

  modal.style.display = "flex";

  const toggleBtn = document.getElementById("toggleImageBtn");
  const imageEl = document.getElementById("pokemonImage");

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
}

closeModal.addEventListener("click", () => (modal.style.display = "none"));
window.addEventListener("click", (e) => {
  if (e.target === modal) modal.style.display = "none";
});

fetchAllPokemonDetails();
