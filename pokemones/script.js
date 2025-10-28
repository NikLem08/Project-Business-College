const pokemonList = document.getElementById("pokemonList");
const typeFilter = document.getElementById("typeFilter");
const sortFilter = document.getElementById("sortFilter");
const searchInput = document.getElementById("search");
const loadMoreBtn = document.getElementById("loadMoreBtn");

let allPokemon = [];
let visibleCount = 0;
const batchSize = 50;

async function fetchPokemonData() {
  const res = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1025");
  const data = await res.json();
  const results = await Promise.all(
    data.results.map(async (p) => {
      const details = await fetch(p.url).then((r) => r.json());
      return {
        id: details.id,
        name: details.name,
        // Haetaan Pokémonin kuva ja tyypit API-datasta
        image: details.sprites.other["official-artwork"].front_default,
        types: details.types.map((t) => t.type.name),
      };
    })
  );
  allPokemon = results;
  updateTypeFilter();
  renderPokemon();
}

function updateTypeFilter() {
  // Haetaan kaikki Pokémon-tyypit listasta, poistetaan duplikaatit ja laitetaan aakkosjärjestykseen
  const types = [...new Set(allPokemon.flatMap((p) => p.types))].sort();
  typeFilter.innerHTML += types
    .map((t) => `<option value="${t}">${t}</option>`)
    .join("");
}

function applyFilters() {
  const type = typeFilter.value;
  const sort = sortFilter.value;
  const search = searchInput.value.trim();

  let filtered = allPokemon;

  if (type) filtered = filtered.filter((p) => p.types.includes(type));
  if (search) filtered = filtered.filter((p) => p.id === Number(search));

  // Tarkistetaan valittu lajittelutapa ja lajitellaan sen mukaan
  switch (sort) {
    case "id-desc":
      filtered.sort((a, b) => b.id - a.id);
      break;
    case "name-asc":
      filtered.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "name-desc":
      filtered.sort((a, b) => b.name.localeCompare(a.name));
      break;
    default:
      filtered.sort((a, b) => a.id - b.id);
  }

  return filtered;
}

function renderPokemon() {
  const filtered = applyFilters();
  const visible = filtered.slice(0, visibleCount + batchSize);
  visibleCount = visible.length;

  pokemonList.innerHTML = visible
    .map(
      (p) => `
    <div class="pokemon-card">
      <img src="${p.image}" alt="${p.name}">
      <p>#${p.id}</p>
      <h3>${p.name}</h3>
      <p>${p.types.join(", ")}</p>
    </div>
  `
    )
    .join("");

  loadMoreBtn.style.display = visibleCount < filtered.length ? "block" : "none";
}

loadMoreBtn.addEventListener("click", renderPokemon);
typeFilter.addEventListener("change", () => {
  visibleCount = 0;
  renderPokemon();
});
sortFilter.addEventListener("change", () => {
  visibleCount = 0;
  renderPokemon();
});
searchInput.addEventListener("input", () => {
  visibleCount = 0;
  renderPokemon();
});

fetchPokemonData();
