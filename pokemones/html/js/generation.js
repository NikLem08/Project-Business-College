import { fetchTypes, fetchGeneration } from "./api.js";
import { populateTypeFilter, renderPokemonList } from "./ui.js";

// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);
const genNumber = urlParams.get("gen");

// DOM Elements
const genTitle = document.getElementById("genTitle");
const pokemonList = document.getElementById("pokemonList");
const typeFilter = document.getElementById("typeFilter");
const sortFilter = document.getElementById("sortFilter");
const searchInput = document.getElementById("searchInput");
const initialLoadingMessage = document.getElementById("initialLoadingMessage");
const mainNav = document.getElementById("mainNav");

// State
let allPokemons = [];

/**
 * Highlights the active generation link in the navigation.
 */
function highlightActiveGeneration() {
  if (!genNumber) return;

  // Удаляем класс активной генерации со всех ссылок
  mainNav.querySelectorAll("a").forEach((link) => {
    link.classList.remove("active-gen");
    // Убедимся, что All Pokemon тоже не активен
    if (link.getAttribute("href") === "poke.html") {
      link.classList.remove("active-nav");
    }
    if (link.getAttribute("href") === "index.html") {
      link.classList.remove("active-nav");
    }
  });

  // Добавляем класс активной генерации к нужной ссылке
  const activeLink = mainNav.querySelector(`a[data-gen="${genNumber}"]`);
  if (activeLink) {
    activeLink.classList.add("active-gen");
  }
}

/**
 * Applies search, filter, and sort logic, then re-renders the list.
 */
function applyFiltersAndSort() {
  let currentPokemons = [...allPokemons];
  const selectedType = typeFilter.value;
  const sortValue = sortFilter.value;
  const searchTerm = searchInput.value.toLowerCase().trim();

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

  renderPokemonList(currentPokemons, pokemonList);
}

/**
 * Initialization function for the Generation page.
 */
async function initGenerationPage() {
  highlightActiveGeneration();

  if (!genNumber) {
    pokemonList.innerHTML =
      '<p class="no-results">Please select a Pokémon generation from the navigation bar.</p>';
    initialLoadingMessage.style.display = "none";
    genTitle.textContent = "Pokémon Generations";
    return;
  }

  genTitle.textContent = `Pokémon Generation ${genNumber}`;
  initialLoadingMessage.style.display = "block"; // Show loading message

  try {
    // 1. Fetch Types
    const types = await fetchTypes();
    populateTypeFilter(types);

    // 2. Fetch Generation Pokémon
    allPokemons = await fetchGeneration(genNumber);

    // 3. Apply filters and render list
    applyFiltersAndSort();
  } catch (error) {
    console.error("Failed to load generation data:", error);
    pokemonList.innerHTML =
      '<p class="no-results">Failed to load Pokémon data for this generation.</p>';
  } finally {
    initialLoadingMessage.style.display = "none"; // Hide loading message
  }
}

// Event Listeners
typeFilter.addEventListener("change", applyFiltersAndSort);
sortFilter.addEventListener("change", applyFiltersAndSort);
searchInput.addEventListener("input", applyFiltersAndSort);

// Initial call
initGenerationPage();
