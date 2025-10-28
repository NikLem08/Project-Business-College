const pokemonList = document.getElementById("pokemonList");
const modal = document.getElementById("pokemonModal");
const modalContent = document.getElementById("pokemonDetails");
const closeModal = document.getElementById("closeModal");

// Элемент для поиска и новые элементы для пагинации
const searchInput = document.getElementById("searchInput");
const loadMoreBtn = document.getElementById("loadMoreBtn");
const initialLoadingMessage = document.getElementById("initialLoadingMessage"); // НОВЫЙ ЭЛЕМЕНТ

let allPokemons = []; // Массив для хранения ВСЕХ загруженных покемонов
const renderChunkSize = 50; // Сколько покемонов отрисовывать за раз
let currentRenderLimit = renderChunkSize; // Текущий лимит отрисовки

// --- 1. Логика загрузки, пагинации и поиска ---

/**
 * Загружает ДЕТАЛИ для ВСЕХ покемонов и сохраняет в allPokemons.
 * Это позволяет мгновенно искать по всем данным.
 */
async function fetchAllPokemonDetails() {
  initialLoadingMessage.style.display = "block";

  // Шаг 1: Получаем список всех покемонов (используем большой лимит)
  // Это быстрый запрос, который дает нам все имена и ссылки.
  const listRes = await fetch(
    "https://pokeapi.co/api/v2/pokemon?limit=100000&offset=0"
  );
  const listData = await listRes.json();

  // Шаг 2: Создаем промисы для детальной информации о каждом покемоне
  const fetchPromises = listData.results.map(async (pokemon) => {
    const pokeRes = await fetch(pokemon.url);
    if (!pokeRes.ok) return null; // Игнорируем проблемные записи
    return pokeRes.json();
  });

  // Шаг 3: Ждем все детали и сохраняем
  allPokemons = (await Promise.all(fetchPromises)).filter((p) => p !== null);

  // Сортируем по ID
  allPokemons.sort((a, b) => a.id - b.id);

  initialLoadingMessage.style.display = "none"; // Скрываем сообщение о загрузке

  // Изначально отображаем первую порцию
  applySearchAndRender();
}

// Обработчик события для кнопки "Load More"
loadMoreBtn.addEventListener("click", () => {
  loadMoreBtn.disabled = true; // Отключаем кнопку, чтобы избежать двойных кликов

  // Увеличиваем лимит отрисовки
  currentRenderLimit += renderChunkSize;

  // Запускаем отрисовку с новым лимитом
  applySearchAndRender();

  loadMoreBtn.disabled = false; // Включаем кнопку после отрисовки
});

// Функция применения поиска и отрисовки (теперь управляет и пагинацией)
function applySearchAndRender() {
  let currentPokemons = [...allPokemons]; // Копируем ВЕСЬ массив для поиска

  const searchTerm = searchInput.value.toLowerCase().trim();

  // --- 1. Логика поиска ---
  if (searchTerm) {
    currentPokemons = currentPokemons.filter((pokemon) => {
      // Поиск всегда работает по всему массиву 'allPokemons'
      const nameMatch = pokemon.name.toLowerCase().includes(searchTerm);
      const idMatch = String(pokemon.id).startsWith(searchTerm);
      return nameMatch || idMatch;
    });

    // При активном поиске показываем ВСЕ найденные результаты
    loadMoreBtn.style.display = "none";

    // Отрисовываем отфильтрованный список целиком
    renderPokemonList(currentPokemons);
  } else {
    // --- 2. Логика пагинации (если поиск пуст) ---

    // Берем только ту часть, которая должна быть отрисована
    const pokemonsToRender = currentPokemons.slice(0, currentRenderLimit);

    renderPokemonList(pokemonsToRender);

    // Показываем/скрываем кнопку Load More
    if (currentRenderLimit < allPokemons.length) {
      loadMoreBtn.style.display = "block";
    } else {
      loadMoreBtn.style.display = "none";
    }
  }
}

// Функция для отображения списка покемонов (без изменений)
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

// Обработчик события для поиска (без изменений)
searchInput.addEventListener("input", applySearchAndRender);

// --- 2. Логика модального окна (без изменений) ---

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

fetchAllPokemonDetails();
