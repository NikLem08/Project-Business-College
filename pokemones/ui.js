function renderPokemonList(pokemons, container) {
  container.innerHTML = "";

  pokemons.forEach((p) => {
    const card = document.createElement("div");
    card.classList.add("pokemon-card");

    card.innerHTML = `
      <h3>${p.id}. ${capitalize(p.name)}</h3>
      <img src="${p.image}" alt="${p.name}" />
      <p>Types: ${p.types.map(capitalize).join(", ")}</p>
    `;

    container.appendChild(card);
  });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
