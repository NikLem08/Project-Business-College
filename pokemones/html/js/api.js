const API_BASE = "https://pokeapi.co/api/v2";

/**
 * Executes a list of promises in controlled batches to prevent API/browser overload.
 * @param {Array<Object>} items - The list of items to process.
 * @param {Function} workerFn - The async function to execute for each item.
 * @param {number} batchSize - The number of promises to run concurrently in each batch.
 */
async function runInBatches(items, workerFn, batchSize = 25) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    // Get the current batch of items
    const batch = items.slice(i, i + batchSize);

    // Map batch to promises using the provided worker function
    const promises = batch.map(workerFn);

    // Wait for the entire batch to complete
    const batchResults = await Promise.all(promises);

    // Accumulate results
    results.push(...batchResults);
  }
  return results;
}

/**
 * Fetches the list of all valid Pokémon types.
 * @returns {Promise<Array<string>>} A promise that resolves to an array of type names.
 */
async function fetchTypes() {
  try {
    const res = await fetch(`${API_BASE}/type`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    // Filter out 'unknown' and 'shadow' types
    return data.results
      .map((type) => type.name)
      .filter((name) => name !== "unknown" && name !== "shadow");
  } catch (error) {
    console.error("Error fetching types:", error);
    return [];
  }
}

/**
 * Fetches detailed data for a single Pokémon by ID or name.
 * @param {number|string} id - The Pokémon ID or name.
 * @returns {Promise<Object|null>} A promise that resolves to the Pokémon data or null on failure.
 */
async function fetchPokemonDetails(id) {
  try {
    const res = await fetch(`${API_BASE}/pokemon/${id}`);
    if (!res.ok) return null; // Return null if 404/not found
    return res.json();
  } catch (e) {
    console.error("Error fetching Pokémon details for", id, e);
    return null;
  }
}

/**
 * Fetches a comprehensive list of all main Pokémon forms using controlled batching.
 * This is the fix for the "infinite loading" issue.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of all main Pokémon data.
 */
async function fetchAllPokemonList() {
  // 1025 covers all main forms up to the latest main generation (Gen 9)
  const MAX_POKEMON_COUNT = 1025;
  try {
    const listRes = await fetch(
      `${API_BASE}/pokemon?limit=${MAX_POKEMON_COUNT}&offset=0`
    );
    if (!listRes.ok) throw new Error(`HTTP error! status: ${listRes.status}`);
    const listData = await listRes.json();

    const pokemonsToFetch = listData.results;

    // Fetch details for all Pokémon in controlled batches (25 at a time)
    const allPokemons = await runInBatches(
      pokemonsToFetch,
      (pokemon) => fetchPokemonDetails(pokemon.name),
      25
    );

    // Filter out nulls (failed fetches) and sort by ID
    const validPokemons = allPokemons
      .filter((p) => p !== null)
      .sort((a, b) => a.id - b.id);

    return validPokemons;
  } catch (error) {
    console.error("Error fetching all Pokémon list:", error);
    // Пробрасываем ошибку для обработки в main.js (скрыть загрузчик, показать ошибку)
    throw new Error("Failed to load comprehensive Pokémon list from API.");
  }
}

/**
 * Fetches all Pokémon belonging to a specific generation.
 * This is safe to run concurrently as generations are small (100-150 Pokémon).
 * @param {number} gen - The generation number (1-9).
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of Pokémon data for the generation.
 */
async function fetchGeneration(gen) {
  try {
    const res = await fetch(`${API_BASE}/generation/${gen}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();

    // Create promises to fetch details for each species concurrently (safe for small generations)
    const fetchPromises = data.pokemon_species.map(async (p) => {
      return fetchPokemonDetails(p.name);
    });

    const pokemons = (await Promise.all(fetchPromises)).filter(
      (pokemon) => pokemon && pokemon.id
    );

    pokemons.sort((a, b) => a.id - b.id);
    return pokemons;
  } catch (error) {
    console.error(`Error fetching generation ${gen}:`, error);
    throw new Error(`Failed to load data for Generation ${gen}.`);
  }
}

export {
  fetchTypes,
  fetchPokemonDetails,
  fetchAllPokemonList,
  fetchGeneration,
};
