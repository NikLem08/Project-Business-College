const urlParams = new URLSearchParams(window.location.search);
const genNumber = urlParams.get("gen");
const genTitle = document.getElementById("genTitle");
const pokemonList = document.getElementById("pokemonList");
const modal = document.getElementById("pokemonModal");
const modalContent = document.getElementById("pokemonDetails");
const closeModal = document.getElementById("closeModal");

const typeFilter = document.getElementById("typeFilter");
const sortFilter = document.getElementById("sortFilter");

let allPokemons = [];

genTitle.textContent = `Pokémon Generation ${genNumber}`;

async function fetchTypes() {
  const res = await fetch("https://pokeapi.co/api/v2/type");
  const data = await res.json();

  const types = data.results
    .map((type) => type.name)
    .filter((name) => name !== "unknown" && name !== "shadow");

  types.forEach((type) => {
    const option = document.createElement("option");
    option.value = type;
    option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
    typeFilter.appendChild(option);
  });
}

async function fetchGeneration(gen) {
  const res = await fetch(`https://pokeapi.co/api/v2/generation/${gen}`);
  const data = await res.json();

  const fetchPromises = data.pokemon_species.map(async (p) => {
    try {
      const pokeRes = await fetch(
        `https://pokeapi.co/api/v2/pokemon/${p.name}`
      );

      if (!pokeRes.ok) {
        console.warn(`Skipping failed fetch for: ${p.name}`);
        return null;
      }

      return pokeRes.json();
    } catch (e) {
      console.error(`Error fetching data for ${p.name}:`, e);
      return null;
    }
  });

  allPokemons = (await Promise.all(fetchPromises)).filter(
    (pokemon) => pokemon && pokemon.id
  );

  allPokemons.sort((a, b) => a.id - b.id);

  await fetchTypes();
  applyFiltersAndSort();
}

function applyFiltersAndSort() {
  let currentPokemons = [...allPokemons];

  const selectedType = typeFilter.value;
  if (selectedType) {
    currentPokemons = currentPokemons.filter((pokemon) =>
      pokemon.types.some((t) => t.type.name === selectedType)
    );
  }

  const sortValue = sortFilter.value;
  switch (sortValue) {
    case "id-asc":
      currentPokemons.sort((a, b) => a.id - b.id);
      break;
    case "id-desc":
      currentPokemons.sort((a, b) => b.id - a.id);
      break;
    case "name-asc":
      currentPokemons.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "name-desc":
      currentPokemons.sort((a, b) => b.name.localeCompare(a.name));
      break;
  }

  renderPokemonList(currentPokemons);
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

typeFilter.addEventListener("change", applyFiltersAndSort);
sortFilter.addEventListener("change", applyFiltersAndSort);

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
    shiny: data.sprites.front_shiny,
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

if (genNumber) {
  fetchGeneration(genNumber);
}
