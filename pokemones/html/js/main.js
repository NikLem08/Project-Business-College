import { fetchTypes, fetchAllPokemonList } from "./api.js";
import { populateTypeFilter, renderPokemonCard } from "./ui.js";

// DOM Elements
const pokemonList = document.getElementById("pokemonList");
const searchInput = document.getElementById("searchInput");
const loadMoreBtn = document.getElementById("loadMoreBtn");
const initialLoadingMessage = document.getElementById("initialLoadingMessage");
const typeFilter = document.getElementById("typeFilter");
const sortFilter = document.getElementById("sortFilter");

// State
let allPokemons = [];
let filteredAndSortedPokemons = [];
const RENDER_CHUNK_SIZE = 50;
let currentRenderLimit = RENDER_CHUNK_SIZE;

/**
 * Applies search, filter, and sort logic, then re-renders the list.
 */
function applySearchAndRender() {
  let currentPokemons = [...allPokemons];
  const searchTerm = searchInput.value.toLowerCase().trim();
  const selectedType = typeFilter.value;
  const sortValue = sortFilter.value;

  // 1. Search Filter (by name or ID)
  if (searchTerm) {
    currentPokemons = currentPokemons.filter((pokemon) => {
      const nameMatch = pokemon.name.toLowerCase().includes(searchTerm);
      const idMatch = String(pokemon.id).startsWith(searchTerm);
      return pokemon && (nameMatch || idMatch); // Проверка на null/undefined
    });
  }

  // 2. Type Filter
  if (selectedType) {
    currentPokemons = currentPokemons.filter((pokemon) =>
      pokemon.types.some((t) => t.type.name === selectedType)
    );
  }

  // 3. Sort
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
  currentRenderLimit = RENDER_CHUNK_SIZE;

  // Initial render of the first chunk
  const pokemonsToRender = filteredAndSortedPokemons.slice(
    0,
    currentRenderLimit
  );

  pokemonList.innerHTML = "";
  if (pokemonsToRender.length === 0 && allPokemons.length > 0) {
    pokemonList.innerHTML =
      '<p class="no-results">No Pokémon found matching your criteria.</p>';
  } else if (pokemonsToRender.length === 0 && allPokemons.length === 0) {
    // Не показываем ошибку фильтрации, если вообще нет данных
  } else {
    pokemonsToRender.forEach((pokemon) =>
      renderPokemonCard(pokemon, pokemonList)
    );
  }

  // Update Load More button visibility
  if (filteredAndSortedPokemons.length > currentRenderLimit) {
    loadMoreBtn.style.display = "block";
  } else {
    loadMoreBtn.style.display = "none";
  }
}

/**
 * Renders the next chunk of Pokémon on "Load More" click.
 */
function loadMorePokemons() {
  loadMoreBtn.disabled = true;

  const startIndex = currentRenderLimit;
  currentRenderLimit += RENDER_CHUNK_SIZE;

  const pokemonsToRender = filteredAndSortedPokemons.slice(
    startIndex,
    currentRenderLimit
  );

  pokemonsToRender.forEach((pokemon) =>
    renderPokemonCard(pokemon, pokemonList)
  );

  if (currentRenderLimit >= filteredAndSortedPokemons.length) {
    loadMoreBtn.style.display = "none";
  }

  loadMoreBtn.disabled = false;
}

/**
 * Initialization function.
 */
async function init() {
  // 1. Show loading message
  initialLoadingMessage.style.display = "block";

  try {
    // 2. Fetch all types and populate filter
    const types = await fetchTypes();
    populateTypeFilter(types);

    // 3. Fetch all Pokémon details (может занять время)
    allPokemons = await fetchAllPokemonList();

    // 4. Apply filters and render initial list
    applySearchAndRender();
  } catch (error) {
    console.error("Failed to load all Pokémon data:", error);
    pokemonList.innerHTML =
      '<p class="no-results">Failed to load Pokémon data. Please check network connection.</p>';
  } finally {
    // 5. Hide loading message в любом случае
    initialLoadingMessage.style.display = "none";
  }
}

// Event Listeners
searchInput.addEventListener("input", applySearchAndRender);
sortFilter.addEventListener("change", applySearchAndRender);
typeFilter.addEventListener("change", applySearchAndRender);
loadMoreBtn.addEventListener("click", loadMorePokemons);

// Initial call
init();
