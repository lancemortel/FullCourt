const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const money = (n) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(n);
const read = (key, fallback = []) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
let cart = read("fullcourt-cart");
let wishlist = read("fullcourt-wishlist");

function media(product, className = "product-media") {
  return `<div class="${className}">${product.image ? `<img src="${product.image}" alt="${product.name}">` : `<span class="product-icon" aria-hidden="true">${product.icon || "🏀"}</span>`}</div>`;
}
function productCard(p) {
  const saved = wishlist.includes(p.id);
  return `<article class="product-card" data-product-id="${p.id}">
    <div class="product-media">${p.image ? `<img src="${p.image}" alt="${p.name}">` : `<span class="product-icon">${p.icon || "🏀"}</span>`}<span class="badge">${p.badge || p.category}</span><button class="wish-btn ${saved ? "saved" : ""}" data-wish="${p.id}" aria-label="${saved ? "Remove from" : "Add to"} wishlist">${saved ? "♥" : "♡"}</button></div>
    <div class="product-info"><span class="product-category">${p.category}</span><a class="product-name" href="product.html?id=${p.id}">${p.name}</a><div class="rating">★ ${p.rating} <small>(${p.reviews})</small></div><div class="price-row"><span class="price">${money(p.price)}</span>${p.oldPrice ? `<span class="old-price">${money(p.oldPrice)}</span>` : ""}${p.stock <= 5 ? `<span class="stock-low">Only ${p.stock}</span>` : ""}</div><div class="card-actions"><a class="btn btn-primary" href="product.html?id=${p.id}">Add to Court</a><button class="quick-view" data-view="${p.id}" aria-label="Quick view">👁</button></div></div>
  </article>`;
}
function updateCounts() {
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  $$("[data-cart-count]").forEach((el) => (el.textContent = count));
  $$("[data-wish-count]").forEach((el) => (el.textContent = wishlist.length));
}
function addToCart(id, qty = 1, size, color) {
  const product = PRODUCTS.find((p) => p.id === id);
  if (!product || product.stock < 1) return;
  const selectedSize = size || product.sizes?.[0] || "Standard";
  const selectedColor = color || product.colors?.[0] || "Standard";
  const item = cart.find(
    (i) =>
      i.id === id &&
      (i.size || i.option || "Standard") === selectedSize &&
      (i.color || "Standard") === selectedColor,
  );
  if (item) item.qty = Math.min(product.stock, item.qty + qty);
  else
    cart.push({
      id,
      qty: Math.min(qty, product.stock),
      size: selectedSize,
      color: selectedColor,
    });
  write("fullcourt-cart", cart);
  updateCounts();
  toast(`${product.name} added to your cart.`);
}
function toggleWishlist(id) {
  wishlist = wishlist.includes(id)
    ? wishlist.filter((x) => x !== id)
    : [...wishlist, id];
  write("fullcourt-wishlist", wishlist);
  updateCounts();
  $$(`[data-wish="${id}"]`).forEach((btn) => {
    const saved = wishlist.includes(id);
    btn.classList.toggle("saved", saved);
    btn.textContent = saved ? "♥" : "♡";
  });
  toast(
    wishlist.includes(id)
      ? "Saved to your wishlist."
      : "Removed from your wishlist.",
  );
}
function toast(message) {
  let el = $(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    el.setAttribute("role", "status");
    document.body.append(el);
  }
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}
function modal(p) {
  const box = $("#quick-modal");
  if (!box) return;
  box.innerHTML = `<div class="modal-card"><button class="modal-close" aria-label="Close">×</button><div class="detail-grid">${media(p, "detail-media")}<div class="detail-info"><span class="eyebrow">${p.category}</span><h1>${p.name}</h1><div class="rating">★ ${p.rating} <small>${p.reviews} verified reviews</small></div><div class="detail-price">${money(p.price)}</div><p class="detail-description">${p.description}</p><p class="stock ${p.stock <= 5 ? "low" : ""}">${p.stock > 0 ? `${p.stock} items in stock` : "Out of stock"}</p><p class="detail-description">Select your preferred size and color before adding this product to your cart.</p><a class="btn btn-primary" href="product.html?id=${p.id}">Select size & color</a></div></div></div>`;
  box.classList.add("open");
  document.body.classList.add("no-scroll");
}
function closeModal() {
  $("#quick-modal")?.classList.remove("open");
  document.body.classList.remove("no-scroll");
}

function initShell() {
  const page = document.body.dataset.page;
  $$(".nav-links a").forEach((a) => {
    if (a.dataset.nav === page) a.classList.add("active");
  });
  $(".menu-btn")?.addEventListener("click", () =>
    $(".nav-links").classList.toggle("open"),
  );
  document.addEventListener("click", (e) => {
    const wish = e.target.closest("[data-wish]");
    if (wish) toggleWishlist(wish.dataset.wish);
    const view = e.target.closest("[data-view]");
    if (view) modal(PRODUCTS.find((p) => p.id === view.dataset.view));
    if (e.target.matches(".modal,.modal-close")) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
  updateCounts();
}
function initHome() {
  const grid = $("#featured-products");
  if (grid) grid.innerHTML = PRODUCTS.slice(0, 4).map(productCard).join("");
  const categories = [...new Set(PRODUCTS.map((p) => p.category))];
  const icons = {
    Basketballs: "🏀",
    Footwear: "👟",
    Apparel: "🎽",
    Hoops: "⛹️",
    Training: "🏃",
    Accessories: "🎒",
  };
  const cat = $("#category-grid");
  if (cat)
    cat.innerHTML = categories
      .map(
        (c) =>
          `<a class="category-card" href="products.html?category=${encodeURIComponent(c)}"><span>${icons[c] || "🏀"}</span><strong>${c}</strong><small>${PRODUCTS.filter((p) => p.category === c).length} products</small></a>`,
      )
      .join("");
}
function initCatalogue() {
  const grid = $("#product-grid");
  if (!grid) return;
  const categoryBox = $("#category-options");
  const cats = [...new Set(PRODUCTS.map((p) => p.category))];
  categoryBox.innerHTML = cats
    .map((c) => `<label><input type="checkbox" value="${c}"> ${c}</label>`)
    .join("");
  const params = new URLSearchParams(location.search);
  const requested = params.get("category");
  const wishlistOnly = params.get("wishlist") === "1";
  if (requested) {
    const cb = $(`input[value="${CSS.escape(requested)}"]`);
    if (cb) cb.checked = true;
  }
  if (wishlistOnly) {
    $(".page-hero h1").textContent = "Your wishlist";
    $(".page-hero p").textContent = "The gear you saved for later.";
  }
  const render = () => {
    let data = wishlistOnly
      ? PRODUCTS.filter((p) => wishlist.includes(p.id))
      : [...PRODUCTS];
    const term = $("#catalogue-search").value.toLowerCase().trim();
    const selected = $$("#category-options input:checked").map((x) => x.value);
    const max = Number($("#price-filter").value);
    if (term)
      data = data.filter((p) =>
        (p.name + " " + p.category + " " + p.description)
          .toLowerCase()
          .includes(term),
      );
    if (selected.length)
      data = data.filter((p) => selected.includes(p.category));
    if (max) data = data.filter((p) => p.price <= max);
    const sort = $("#sort-products").value;
    if (sort === "low") data.sort((a, b) => a.price - b.price);
    if (sort === "high") data.sort((a, b) => b.price - a.price);
    if (sort === "rating") data.sort((a, b) => b.rating - a.rating);
    $("#result-count").textContent =
      `Showing ${data.length} ${wishlistOnly ? "saved" : "of " + PRODUCTS.length} products`;
    grid.innerHTML = data.length
      ? data.map(productCard).join("")
      : `<div class="empty-state"><span>${wishlistOnly ? "♡" : "🔍"}</span><h2>${wishlistOnly ? "Your wishlist is empty" : "No products found"}</h2><p>${wishlistOnly ? "Save products with the heart button and they will appear here." : "Try changing your search or filters."}</p></div>`;
  };
  ["input", "change"].forEach((ev) =>
    document.addEventListener(ev, (e) => {
      if (e.target.closest("#catalogue-controls")) render();
    }),
  );
  $("#clear-filters").addEventListener("click", () => {
    $$("#catalogue-controls input").forEach((i) => {
      i.checked = false;
      i.value = i.type === "search" ? "" : i.value;
    });
    $("#price-filter").value = "0";
    render();
  });
  render();
}
function initDetail() {
  const root = $("#product-detail");
  if (!root) return;
  const id = new URLSearchParams(location.search).get("id") || PRODUCTS[0].id;
  const p = PRODUCTS.find((x) => x.id === id) || PRODUCTS[0];
  document.title = `${p.name} | FullCourt Supply`;
  root.innerHTML = `<div class="detail-grid">${media(p, "detail-media")}<div class="detail-info"><span class="eyebrow">${p.category}</span><h1>${p.name}</h1><div class="rating">★ ${p.rating} <small>${p.reviews} verified reviews</small></div><div class="detail-price">${money(p.price)} ${p.oldPrice ? `<span class="old-price">${money(p.oldPrice)}</span>` : ""}</div><p class="detail-description">${p.description}</p><p class="stock ${p.stock <= 5 ? "low" : ""}">${p.stock > 5 ? "In stock — ready to ship" : p.stock > 0 ? `Hurry, only ${p.stock} left` : "Out of stock"}</p><div class="option-group"><strong>Choose a size</strong><div class="choices" data-choice-group="size">${p.sizes.map((s, i) => `<button type="button" class="choice ${i === 0 ? "active" : ""}" data-value="${s}" aria-pressed="${i === 0}">${s}</button>`).join("")}</div></div><div class="option-group"><strong>Choose a color</strong><div class="choices" data-choice-group="color">${p.colors.map((c, i) => `<button type="button" class="choice ${i === 0 ? "active" : ""}" data-value="${c}" aria-pressed="${i === 0}">${c}</button>`).join("")}</div></div><div class="qty-row"><div class="quantity"><button data-qty="-1">−</button><input id="detail-qty" value="1" readonly aria-label="Quantity"><button data-qty="1">+</button></div><button id="detail-add" class="btn btn-primary">Add to cart</button></div><button class="btn btn-outline" data-wish="${p.id}">♡ Save to wishlist</button><p class="detail-meta">Free Metro Manila delivery on orders over ₱2,500 · 7-day returns · Secure simulated checkout</p></div></div>`;
  $$('[data-choice-group] .choice', root).forEach((button) =>
    button.addEventListener("click", () => {
      $$(".choice", button.parentElement).forEach((choice) => {
        choice.classList.remove("active");
        choice.setAttribute("aria-pressed", "false");
      });
      button.classList.add("active");
      button.setAttribute("aria-pressed", "true");
    }),
  );
  $$("[data-qty]", root).forEach((b) =>
    b.addEventListener("click", () => {
      const q = $("#detail-qty");
      q.value = Math.max(
        1,
        Math.min(p.stock, Number(q.value) + Number(b.dataset.qty)),
      );
    }),
  );
  $("#detail-add").addEventListener("click", () =>
    addToCart(
      p.id,
      Number($("#detail-qty").value),
      $('[data-choice-group="size"] .choice.active')?.dataset.value,
      $('[data-choice-group="color"] .choice.active')?.dataset.value,
    ),
  );
  const rec = $("#recommendations");
  if (rec)
    rec.innerHTML = PRODUCTS.filter((x) => x.id !== p.id)
      .slice(0, 4)
      .map(productCard)
      .join("");
}
function initCart() {
  const list = $("#cart-list");
  if (!list) return;
  const render = () => {
    if (!cart.length) {
      list.innerHTML =
        '<div class="empty-state"><span>🛒</span><h2>Your cart is empty</h2><p>Add equipment and get back in the game.</p><a class="btn btn-primary" href="products.html">Shop products</a></div>';
    } else
      list.innerHTML = cart
        .map((i, index) => {
          const p = PRODUCTS.find((x) => x.id === i.id);
          if (!p) return "";
          const size = i.size || i.option || "Standard";
          const color = i.color || "Standard";
          return `<div class="cart-item"><div class="cart-thumb">${p.icon || "🏀"}</div><div><h3><a href="product.html?id=${p.id}">${p.name}</a></h3><p>Size: ${size} · Color: ${color}</p><div class="cart-item-actions"><div class="quantity"><button data-cart-qty="-1" data-index="${index}">−</button><input value="${i.qty}" readonly aria-label="Quantity"><button data-cart-qty="1" data-index="${index}">+</button></div><button class="remove" data-remove-index="${index}">Remove</button></div></div><strong>${money(p.price * i.qty)}</strong></div>`;
        })
        .join("");
    const subtotal = cart.reduce((s, i) => {
      const p = PRODUCTS.find((x) => x.id === i.id);
      return s + (p ? p.price * i.qty : 0);
    }, 0);
    $("#subtotal").textContent = money(subtotal);
    $("#shipping").textContent =
      subtotal >= 2500 || subtotal === 0 ? "FREE" : money(150);
    $("#total").textContent = money(
      subtotal + (subtotal >= 2500 || subtotal === 0 ? 0 : 150),
    );
    updateCounts();
  };
  document.addEventListener("click", (e) => {
    const q = e.target.closest("[data-cart-qty]");
    const rem = e.target.closest("[data-remove-index]");
    if (q) {
      const item = cart[Number(q.dataset.index)];
      const p = PRODUCTS.find((x) => x.id === item.id);
      item.qty = Math.max(
        1,
        Math.min(p.stock, item.qty + Number(q.dataset.cartQty)),
      );
      write("fullcourt-cart", cart);
      render();
    }
    if (rem) {
      cart.splice(Number(rem.dataset.removeIndex), 1);
      write("fullcourt-cart", cart);
      render();
    }
  });
  $("#apply-promo")?.addEventListener("click", () =>
    toast(
      $("#promo").value.toUpperCase() === "FULLCOURT10"
        ? "Promo applied for this demo!"
        : "Try demo code FULLCOURT10",
    ),
  );
  render();
}
function initForm() {
  $$("form[data-validate]").forEach((form) =>
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      let valid = true;
      $$("[required]", form).forEach((input) => {
        const bad =
          !input.value.trim() ||
          (input.type === "email" && !/^\S+@\S+\.\S+$/.test(input.value)) ||
          (input.minLength > 0 && input.value.length < input.minLength);
        input.closest(".field")?.classList.toggle("invalid", bad);
        if (bad) valid = false;
      });
      if (valid) {
        toast(form.dataset.success || "Form submitted successfully!");
        if (form.dataset.redirect) {
          window.setTimeout(() => {
            window.location.href = form.dataset.redirect;
          }, 900);
        } else {
          form.reset();
        }
      }
    }),
  );
}
function initTracking() {
  $("#track-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const code = $("#tracking-code").value.trim();
    if (!code) return toast("Enter a tracking number.");
    $("#tracking-result").hidden = false;
    $("#tracking-label").textContent = code.toUpperCase();
  });
}
function initCheckout() {
  const root = $("#checkout-items");
  if (!root) return;
  if (!cart.length) root.innerHTML = "<p>Your cart is empty.</p>";
  else
    root.innerHTML = cart
      .map((i) => {
        const p = PRODUCTS.find((x) => x.id === i.id);
        const size = i.size || i.option || "Standard";
        const color = i.color || "Standard";
        return p
          ? `<div class="summary-line"><span>${p.name} × ${i.qty}<small style="display:block;color:var(--muted)">${size} · ${color}</small></span><strong>${money(p.price * i.qty)}</strong></div>`
          : "";
      })
      .join("");
  const total = cart.reduce(
    (s, i) => s + (PRODUCTS.find((p) => p.id === i.id)?.price || 0) * i.qty,
    0,
  );
  $("#checkout-total").textContent = money(
    total + (total >= 2500 || !total ? 0 : 150),
  );
  $("#checkout-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    let valid = true;
    $$("[required]", e.currentTarget).forEach((i) => {
      const bad = !i.value.trim();
      i.closest(".field")?.classList.toggle("invalid", bad);
      if (bad) valid = false;
    });
    if (valid) {
      cart = [];
      write("fullcourt-cart", cart);
      updateCounts();
      $("#checkout-main").innerHTML =
        '<div class="panel tracking-box"><span style="font-size:4rem">✅</span><h1 class="section-title">Order confirmed!</h1><p>Your demo order <strong>FC-240731</strong> has been placed. No real payment was processed.</p><a class="btn btn-primary" href="tracking.html">Track order</a></div>';
    }
  });
}
document.addEventListener("DOMContentLoaded", () => {
  initShell();
  initHome();
  initCatalogue();
  initDetail();
  initCart();
  initForm();
  initTracking();
  initCheckout();
});
