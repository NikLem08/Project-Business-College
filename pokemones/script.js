const pokemonList = document.getElementById("pokemonList");
const modal = document.getElementById("pokemonModal");
const modalContent = document.getElementById("pokemonDetails");
const closeModal = document.getElementById("closeModal");

// Элемент для поиска
const searchInput = document.getElementById("searchInput");
let allPokemons = []; // Массив для хранения всех загруженных покемонов

// --- 1. Логика загрузки и поиска ---

// Загружаем первых 151 покемона (Gen 1)
async function fetchPokemons() {
  // Загружаем список 151
  const res = await fetch("https://pokeapi.co/api/v2/pokemon?limit=151");
  const data = await res.json();

  // Создаем промисы для детальной информации о каждом покемоне
  const fetchPromises = data.results.map(async (pokemon) => {
    const pokeRes = await fetch(pokemon.url);
    return pokeRes.json();
  });

  // Ждем все детали и сохраняем
  allPokemons = await Promise.all(fetchPromises);

  // Применяем начальную сортировку
  allPokemons.sort((a, b) => a.id - b.id);

  // Изначально отображаем всех
  applySearchAndRender();
}

// Функция применения поиска и отрисовки
function applySearchAndRender() {
  let currentPokemons = [...allPokemons]; // Копируем массив

  // --- Поиск по имени/ID ---
  const searchTerm = searchInput.value.toLowerCase().trim();
  if (searchTerm) {
    currentPokemons = currentPokemons.filter((pokemon) => {
      // Поиск по имени (включая) ИЛИ по ID (начинается с)
      const nameMatch = pokemon.name.toLowerCase().includes(searchTerm);
      const idMatch = String(pokemon.id).startsWith(searchTerm);
      return nameMatch || idMatch;
    });
  }

  renderPokemonList(currentPokemons);
}

// Функция для отображения списка покемонов
function renderPokemonList(pokemons) {
  pokemonList.innerHTML = ""; // Очищаем список перед отрисовкой
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
              `<span class="pokemon-type type-${
                t.type.name
              }">${t.type.name.toUpperCase()}</span>`
          )
          .join("")}
    </div>
  `;
  card.addEventListener("click", () => showPokemonDetails(pokemon.id));
  pokemonList.appendChild(card);
}

// Обработчик события для поиска
searchInput.addEventListener("input", applySearchAndRender);

// --- 2. Логика модального окна ---

async function showPokemonDetails(id) {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
  const data = await res.json();

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
    shiny: data.sprites?.front_shiny,
  };

  let current = "normal"; // текущее изображение

  modalContent.innerHTML = `
    <h2>${data.name.toUpperCase()} (#${data.id})</h2>
    <div class="image-container">
      <img id="pokemonImage" src="${images.normal}" alt="${data.name}">
      <button id="toggleImageBtn">Switch Image</button>
    </div>
    <p><b>Types:</b> 
        ${data.types
          .map(
            (t) =>
              `<span class="pokemon-type type-${
                t.type.name
              }">${t.type.name.toUpperCase()}</span>`
          )
          .join("")}
    </p>
    <h3>Stats</h3>
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
  `;

  modal.style.display = "flex";

  // Добавляем кнопку переключения картинки
  const toggleBtn = document.getElementById("toggleImageBtn");
  const imageEl = document.getElementById("pokemonImage");

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
}

closeModal.addEventListener("click", () => (modal.style.display = "none"));
window.addEventListener("click", (e) => {
  if (e.target === modal) modal.style.display = "none";
});

fetchPokemons();
