const pokemonList = document.getElementById("pokemonList");
const modal = document.getElementById("pokemonModal");
const modalContent = document.getElementById("pokemonDetails");

const searchInput = document.getElementById("searchInput");
const loadMoreBtn = document.getElementById("loadMoreBtn");
const initialLoadingMessage = document.getElementById("initialLoadingMessage");

const typeFilter = document.getElementById("typeFilter");
const sortFilter = document.getElementById("sortFilter");

let allPokemons = [];
let filteredAndSortedPokemons = [];
const renderChunkSize = 50; // Tehtiin funktio, joka näyttää kuinka monta Pokemonia näytetään yhdellä kerralla
let currentRenderLimit = renderChunkSize;

async function fetchTypes() {
  const res = await fetch("https://pokeapi.co/api/v2/type");
  const data = await res.json();

  const types = data.results
    .map((type) => type.name)
    .filter((name) => name !== "unknown" && name !== "shadow"); // Tässä funktiossa poistetaan tarpeettomat pokemonien tyypit

  types.forEach((type) => {
    const option = document.createElement("option");
    option.value = type;
    option.textContent = type.charAt(0).toUpperCase() + type.slice(1); // Laitetaan tarvittaville tyyppeille ensimmäinen kirjain isoksi
    typeFilter.appendChild(option);
  });
}

async function fetchAllPokemonDetails() {
  initialLoadingMessage.style.display = "block"; // Funktio, joka näyttää käyttäjälle "ladataan..." -viesti

  // lisätään ja haetaan lista kaikista Pokémoneista (max. raja on 100000)
  const listRes = await fetch(
    "https://pokeapi.co/api/v2/pokemon?limit=100000&offset=0"
  );
  const listData = await listRes.json();

  // Tässä me haetaan jokaisen Pokemonin tiedot erikseen, jotta olisi mukavampi käyttäjälle
  const fetchPromises = listData.results.map(async (pokemon) => {
    const pokeRes = await fetch(pokemon.url);
    if (!pokeRes.ok) return null; // Jos pokemonien tietojen lataus epäonnistuu, ohitetaan ja jatketaan
    return pokeRes.json();
  });

  // Odotetaan, kunnes kaikkien pokemonien lataus valmistuu
  allPokemons = (await Promise.all(fetchPromises)).filter((p) => p !== null);

  allPokemons.sort((a, b) => a.id - b.id); // Järjestetään Pokémonit ID:n mukaan

  await fetchTypes();

  initialLoadingMessage.style.display = "none"; // Piilotetaan näkyvä latausviesti

  applySearchAndRender(); // Käynistetään funktio ja näytetään lista käyttäjälle
}

function applySearchAndRender() {
  let currentPokemons = [...allPokemons];

  const searchTerm = searchInput.value.toLowerCase().trim();
  const selectedType = typeFilter.value;

  // Suodatetaan pokemonit niiden nimen tai ID:n perusteella
  if (searchTerm) {
    currentPokemons = currentPokemons.filter((pokemon) => {
      const nameMatch = pokemon.name.toLowerCase().includes(searchTerm);
      const idMatch = String(pokemon.id).startsWith(searchTerm);
      return nameMatch || idMatch;
    });
  }

  // Suodatetaan pokemonit myös niiden tyypin mukaan
  if (selectedType) {
    currentPokemons = currentPokemons.filter((pokemon) =>
      pokemon.types.some((t) => t.type.name === selectedType)
    );
  }

  const sortValue = sortFilter.value;

  // Järjestetään pokemonit käyttjän valinnan mukaan
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

  filteredAndSortedPokemons = currentPokemons;

  currentRenderLimit = renderChunkSize;

  // Näytetään kättjälle vain osa Pokémoneista aluksi, jos niitä on liikaa
  const pokemonsToRender = filteredAndSortedPokemons.slice(
    0,
    currentRenderLimit
  );
  renderPokemonList(pokemonsToRender);

  // Näytetään käyttjälle “Lataa lisää” -nappi, jos Pokemoneja on enemmän, kuin mahdollisesti mahtuu
  if (filteredAndSortedPokemons.length > currentRenderLimit) {
    loadMoreBtn.style.display = "block";
  } else {
    loadMoreBtn.style.display = "none";
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
  // Luodaan jokaiselle Pokemonille yhden kortin
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
  // Tehdään funktio missä näkyy Pokemonin lisätiedot, jos häntä klikataan
  card.addEventListener("click", () => showPokemonDetails(pokemon.id));
  pokemonList.appendChild(card);
}

searchInput.addEventListener("input", applySearchAndRender);
sortFilter.addEventListener("change", applySearchAndRender);
typeFilter.addEventListener("change", applySearchAndRender);

loadMoreBtn.addEventListener("click", () => {
  loadMoreBtn.disabled = true; // Estetään käyttäjän monen klikkauksen spämmäys

  currentRenderLimit += renderChunkSize; // Lisätään seuraava erä Pokémoneja

  const pokemonsToRender = filteredAndSortedPokemons.slice(
    currentRenderLimit - renderChunkSize,
    currentRenderLimit
  );

  pokemonsToRender.forEach(renderPokemon);

  if (currentRenderLimit >= filteredAndSortedPokemons.length) {
    loadMoreBtn.style.display = "none"; // Otetaan pois nappi, jos tiedot on jo näytetty
  }

  loadMoreBtn.disabled = false;
});

async function showPokemonDetails(id) {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
  const data = await res.json();

  // Emoji-kuvakkeet pokemonien kortteille
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

  let current = "normal"; // Nykyinen kuva (normaali tai shiny)

  // Luodaan lista pokemonien (abilities)
  const abilitiesList = data.abilities
    .map(
      (a) =>
        `<li><span>${a.ability.name.toUpperCase()}</span><strong>${
          a.is_hidden ? "HIDDEN" : "STANDARD"
        }</strong></li>`
    )
    .join("");

  const cryUrl = data.cries.latest || data.cries.legacy; // Lisätään pokemonille äänen, jos siihen klikataan
  const cryButton = cryUrl
    ? `<button id="playCryBtn" class="cry-button">🔊</button>`
    : "";

  // Tässä näytetään modaalissa kaikki tiedot Pokémonista
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

  modal.style.display = "flex"; // Näytetään modaalinen ikkuna käyttjälle

  const toggleBtn = document.getElementById("toggleImageBtn");
  const imageEl = document.getElementById("pokemonImage");
  const playCryBtn = document.getElementById("playCryBtn");
  const closeModalBtn = document.getElementById("closeModal");

  // Tässä me sitten vaihdetaan normaali kuva - shiny -kuvaan
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

  // Soitetaan Pokemonin äänen
  if (playCryBtn && cryUrl) {
    playCryBtn.addEventListener("click", () => {
      const audio = new Audio(cryUrl);
      audio.play();
    });
  }

  // Suljetaan modaalinen ikkunan
  closeModalBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });
}

// Suljetaan modal jos käyttäjä klikkaa sen ulkopuolelle
window.addEventListener("click", (e) => {
  if (e.target === modal) modal.style.display = "none";
});

fetchAllPokemonDetails(); // Käynnistetään koko sovelluksen
