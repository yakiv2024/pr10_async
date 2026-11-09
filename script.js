const cartInput = document.getElementById("cartId");
const loadBtn = document.getElementById("loadBtn");
const statusText = document.getElementById("status");
const cartResult = document.getElementById("cartResult");
const errorText = document.getElementById("error");

const MAX_ATTEMPTS = 2;
const RETRY_DELAY = 1000;

//  перша спроба невдала
const TEST_MODE = true;

// Пауза між спробами
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Асинхронне отримання кошика
async function loadCart(cartId) {
    let url;

    if (cartId === "404") {
        url = "https://dummyjson.com/http/404/Not_Found";
    } else if (cartId === "503") {
        url = "https://dummyjson.com/http/503/Service_Unavailable";
    } else {
        url = `https://dummyjson.com/carts/${cartId}?delay=3000`;
    }

    const response = await fetch(url);

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error("Помилка 404: ресурс не знайдено.");
        }

        if (response.status === 503) {
            throw new Error("Помилка 503: сервер тимчасово недоступний.");
        }

        throw new Error(`HTTP-помилка: ${response.status}`);
    }

    return await response.json();
}

// Автоматична повторна спроба
async function requestWithRetry(cartId) {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        statusText.textContent =
            `Завантаження кошика... Спроба ${attempt} із ${MAX_ATTEMPTS}`;

        try {
            // Штучна помилка першої спроби
            // Лише для звичайного кошика, наприклад ID 1
            if (
                TEST_MODE &&
                attempt === 1 &&
                cartId !== "404" &&
                cartId !== "503"
            ) {
                throw new Error("Тестова помилка першої спроби.");
            }

            const cart = await loadCart(cartId);
            return cart;

        } catch (error) {
            if (attempt === MAX_ATTEMPTS) {
                throw error;
            }

            statusText.textContent =
                `Спроба ${attempt} із ${MAX_ATTEMPTS} невдала. ` +
                `Повтор через 1 секунду...`;

            await sleep(RETRY_DELAY);
        }
    }
}

// Відображення кошика
function displayCart(cart) {
    cartResult.innerHTML = "";

    const heading = document.createElement("h2");
    heading.textContent = `Кошик №${cart.id}`;
    cartResult.appendChild(heading);

    const list = document.createElement("ul");

    cart.products.forEach(product => {
        const item = document.createElement("li");

        item.textContent =
            `${product.title} — ` +
            `Ціна: ${product.price}, ` +
            `Кількість: ${product.quantity}, ` +
            `Вартість: ${product.total}`;

        list.appendChild(item);
    });

    cartResult.appendChild(list);

    const total = document.createElement("h3");
    total.textContent = `Загальна сума: ${cart.total}`;
    cartResult.appendChild(total);
}

// Обробка натискання кнопки
loadBtn.addEventListener("click", async function () {
    const cartId = cartInput.value.trim();

    errorText.textContent = "";
    cartResult.innerHTML = "";

    if (
        !cartId ||
        !Number.isInteger(Number(cartId)) ||
        Number(cartId) < 1
    ) {
        statusText.textContent = "Очікування введення ID кошика.";
        errorText.textContent = "Введіть правильний ID кошика.";
        return;
    }

    loadBtn.disabled = true;

    try {
        const cart = await requestWithRetry(cartId);
        displayCart(cart);
        statusText.textContent = "Кошик успішно завантажено.";

    } catch (error) {
        statusText.textContent =
            "Не вдалося завантажити кошик після двох спроб.";
        errorText.textContent = error.message;

    } finally {
        loadBtn.disabled = false;
    }
});
