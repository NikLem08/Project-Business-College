const pokemonList = document.getElementById("pokemonList");
const typeFilter = document.getElementById("typeFilter");
const sortFilter = document.getElementById("sortFilter");
const genTitle = document.getElementById("genTitle");

const genRanges = {
  1: [1, 151],
  2: [152, 251],
  3: [252, 386],
  4: [387, 493],
  5: [494, 649],
  6: [650, 721],
  7: [722, 809],
  8: [810, 905],
  9: [906, 1025],
};

// Haetaan URL-osoitteen parametrit (esim. generation.html?gen=2)
const urlParams = new URLSearchParams(window.location.search);
const gen = urlParams.get("gen");
genTitle.textContent = `Generation ${gen}`;

let allPokemon = [];

async function fetchPokemonData() {
  const [start, end] = genRanges[gen];
  const res = await fetch(
    `https://pokeapi.co/api/v2/pokemon?limit=${end}&offset=${start - 1}`
  );
  // Muutetaan API:n vastaus JSON-muotoon
  const data = await res.json();
  const results = await Promise.all(
    data.results.map(async (p) => {
      const details = await fetch(p.url).then((r) => r.json());
      return {
        id: details.id,
        name: details.name,
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
  const types = [...new Set(allPokemon.flatMap((p) => p.types))].sort();
  typeFilter.innerHTML += types
    .map((t) => `<option value="${t}">${t}</option>`)
    .join("");
}

function applyFilters() {
  const type = typeFilter.value;
  const sort = sortFilter.value;

  let filtered = allPokemon;
  if (type) filtered = filtered.filter((p) => p.types.includes(type));

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
  pokemonList.innerHTML = filtered
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
}

typeFilter.addEventListener("change", renderPokemon);
sortFilter.addEventListener("change", renderPokemon);

fetchPokemonData();
