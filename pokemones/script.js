const pokemonList = document.getElementById("pokemonList");
const searchInput = document.getElementById("search");
const typeFilter = document.getElementById("typeFilter");
const sortFilter = document.getElementById("sortFilter");
const loadMoreBtn = document.getElementById("loadMoreBtn");

let allPokemon = [];
let displayedCount = 0;
const batchSize = 50; // Показываем по 50

async function fetchAllPokemon() {
  const res = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1000");
  const data = await res.json();
  const results = await Promise.all(
    data.results.map(async (p) => {
      const details = await fetch(p.url).then((r) => r.json());
      return {
        id: details.id,
        name: details.name,
        types: details.types.map((t) => t.type.name),
        image: details.sprites.other["official-artwork"].front_default,
      };
    })
  );
  allPokemon = results;
  updateTypeFilter();
  updateDisplay();
}

function updateTypeFilter() {
  const types = [...new Set(allPokemon.flatMap((p) => p.types))].sort();
  typeFilter.innerHTML += types
    .map((t) => `<option value="${t}">${t}</option>`)
    .join("");
}

function getFilteredPokemon() {
  const search = searchInput.value.toLowerCase();
  const type = typeFilter.value;
  const sort = sortFilter.value;

  let filtered = allPokemon.filter(
    (p) =>
      (p.name.includes(search) || p.id.toString().includes(search)) &&
      (type === "" || p.types.includes(type))
  );

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

function displayNextBatch() {
  const filtered = getFilteredPokemon();
  const nextBatch = filtered.slice(displayedCount, displayedCount + batchSize);

  nextBatch.forEach((p) => {
    const card = document.createElement("div");
    card.className = "pokemon-card";
    card.innerHTML = `
      <img src="${p.image}" alt="${p.name}">
      <h3>#${p.id} ${p.name}</h3>
      <p>${p.types.join(", ")}</p>
    `;
    pokemonList.appendChild(card);
  });

  displayedCount += nextBatch.length;

  loadMoreBtn.style.display =
    displayedCount >= filtered.length ? "none" : "block";
}

function updateDisplay() {
  pokemonList.innerHTML = "";
  displayedCount = 0;
  displayNextBatch();
}

searchInput.addEventListener("input", updateDisplay);
typeFilter.addEventListener("change", updateDisplay);
sortFilter.addEventListener("change", updateDisplay);
loadMoreBtn.addEventListener("click", displayNextBatch);

fetchAllPokemon();
