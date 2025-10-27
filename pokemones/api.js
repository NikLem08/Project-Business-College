async function fetchGeneration(genNumber) {
  const response = await fetch(
    `https://pokeapi.co/api/v2/generation/${genNumber}/`
  );
  const data = await response.json();
  return data.pokemon_species.map((p) => p.name);
}

async function fetchPokemonDetails(nameOrId) {
  const response = await fetch(
    `https://pokeapi.co/api/v2/pokemon/${nameOrId}/`
  );
  const data = await response.json();

  return {
    id: data.id,
    name: data.name,
    types: data.types.map((t) => t.type.name),
    image: data.sprites?.other?.["official-artwork"]?.front_default || "",
  };
}
