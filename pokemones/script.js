document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");
  const typeFilter = document.getElementById("typeFilter");
  const pokemonListContainer = document.getElementById("pokemonList");
  const loadMoreBtn = document.getElementById("loadMoreBtn");

  let allPokemons = [];
  let displayedCount = 0;
  const loadStep = 50;

  async function loadAllNames() {
    const response = await fetch(
      "https://pokeapi.co/api/v2/pokemon?limit=10000"
    );
    const data = await response.json();
    return data.results.map((p) => p.name);
  }

  async function loadNextBatch() {
    const nextBatch = allPokemons.slice(
      displayedCount,
      displayedCount + loadStep
    );
    renderPokemonList(nextBatch, pokemonListContainer, true);
    displayedCount += nextBatch.length;
    if (displayedCount >= allPokemons.length)
      loadMoreBtn.style.display = "none";
  }

  async function init() {
    const names = await loadAllNames();
    for (const name of names) {
      try {
        const details = await fetchPokemonDetails(name);
        allPokemons.push(details);
      } catch (err) {
        console.warn(err);
      }
    }

    allPokemons.sort((a, b) => a.id - b.id);
    loadNextBatch();
  }

  init();

  loadMoreBtn.addEventListener("click", loadNextBatch);

  searchBtn.addEventListener("click", () => {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) return;

    const filtered = allPokemons.filter(
      (p) => p.name.toLowerCase() === query || p.id.toString() === query
    );

    if (filtered.length === 0) alert("Pokémon not found 😢");

    pokemonListContainer.innerHTML = "";
    renderPokemonList(filtered, pokemonListContainer);
  });

  typeFilter.addEventListener("change", () => {
    const selectedType = typeFilter.value;
    const filtered = selectedType
      ? allPokemons.filter((p) => p.types.includes(selectedType))
      : allPokemons;

    pokemonListContainer.innerHTML = "";
    displayedCount = 0;
    allPokemons = filtered;
    loadMoreBtn.style.display = "block";
    loadNextBatch();
  });
});
