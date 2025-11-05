const urlParams = new URLSearchParams(window.location.search);
const genNumber = urlParams.get("gen");
const genTitle = document.getElementById("genTitle");
const pokemonList = document.getElementById("pokemonList");
const modal = document.getElementById("pokemonModal");
const modalContent = document.getElementById("pokemonDetails");

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
        return null;
      }

      return pokeRes.json();
    } catch (e) {
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
      '<p class="no-results">No Pokémon found in this generation.</p>';
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
              `<span class="pokemon-type type-icon ${
                t.type.name
              }" title="${t.type.name.toUpperCase()}"></span>`
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

  const abilitiesList = data.abilities
    .map(
      (a) =>
        `<li><span>${a.ability.name.toUpperCase()}</span><strong>${
          a.is_hidden ? "HIDDEN" : "STANDARD"
        }</strong></li>`
    )
    .join("");

  const cryUrl = data.cries.latest || data.cries.legacy;
  const cryButton = cryUrl
    ? `<button id="playCryBtn" class="cry-button">🔊</button>`
    : "";

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

  const toggleBtn = document.getElementById("toggleImageBtn");
  const imageEl = document.getElementById("pokemonImage");
  const playCryBtn = document.getElementById("playCryBtn");
  const closeModalBtn = document.getElementById("closeModal");

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

  if (playCryBtn && cryUrl) {
    playCryBtn.addEventListener("click", () => {
      const audio = new Audio(cryUrl);
      audio.play();
    });
  }

  closeModalBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });
}

window.addEventListener("click", (e) => {
  if (e.target === modal) modal.style.display = "none";
});

if (genNumber) {
  fetchGeneration(genNumber);
}
