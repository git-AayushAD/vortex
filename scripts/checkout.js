import eventsData from "../data/eventsData.js";

// =========================================
// 1. THEME INITIALIZATION
// =========================================
const themeBtn = document.getElementById("themeToggleBtn");
const themeIcon = document.getElementById("themeIcon");
const htmlElement = document.documentElement;

let savedTheme = localStorage.getItem("vortex_theme") || "dark";
htmlElement.setAttribute("data-theme", savedTheme);
if (themeIcon) themeIcon.className = savedTheme === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon";

themeBtn?.addEventListener("click", () => {
  const currentTheme = htmlElement.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  htmlElement.setAttribute("data-theme", newTheme);
  if (themeIcon) themeIcon.className = newTheme === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon";
  localStorage.setItem("vortex_theme", newTheme);
});

// =========================================
// 2. MATH & CART LOADING
// =========================================
const parsePrice = (price) => {
  if (typeof price === "number") return price;
  if (!price) return 0;
  return Number(String(price).replace(/[^0-9.]/g, '')) || 0;
};

const formatINR = (amount) => `₹${Number(amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

let cart = [];
try { cart = JSON.parse(localStorage.getItem("vortex_cart") || "[]"); } catch { cart = []; }

cart = cart.map((item) => {
  const eventRecord = eventsData.find((e) => e.id === item.id);
  return { ...item, price: eventRecord ? parsePrice(eventRecord.price) : 0 };
});

if (cart.length === 0) {
    alert("Your cart is empty! Redirecting to events...");
    window.location.href = "index.html#events";
}

// =========================================
// 3. DISCOUNT MATH 
// =========================================
const getCartBilling = () => {
    const eligibleItems = cart.filter((item) => item.id !== "sridp");
    const ineligibleItems = cart.filter((item) => item.id === "sridp");
  
    const counts = { general: 0, prodigy: 0, pharma: 0 };
    eligibleItems.forEach((item) => { if (Object.hasOwn(counts, item.category)) counts[item.category]++; });
  
    let completedSeries = 0;
    if (counts.general === 5) completedSeries++;
    if (counts.prodigy === 4) completedSeries++;
    if (counts.pharma === 5) completedSeries++;
  
    let discountPercent = 0;
    if (completedSeries === 3) discountPercent = 0.7;
    else if (completedSeries === 2) discountPercent = 0.62;
    else if (completedSeries === 1) discountPercent = 0.6;
    else if (eligibleItems.length >= 5) discountPercent = 0.5;
  
    const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
    const eligibleSubtotal = eligibleItems.reduce((sum, item) => sum + item.price, 0);
    const excludedSubtotal = ineligibleItems.reduce((sum, item) => sum + item.price, 0);
    const discount = eligibleSubtotal * discountPercent;
    const total = eligibleSubtotal - discount + excludedSubtotal;
  
    return { subtotal, discount, total, discountPercent };
};

// =========================================
// 4. RENDER ORDER SUMMARY & REMOVE BTNS
// =========================================
const renderOrder = () => {
    const list = document.getElementById("checkoutEventList");
    list.replaceChildren(); // Clears the list before re-rendering
    
    cart.forEach((item) => {
        const row = document.createElement("div");
        row.className = "checkout-event-row";

        const details = document.createElement("div");
        details.className = "checkout-event-details";

        const name = document.createElement("strong");
        name.textContent = item.name;

        const category = document.createElement("span");
        category.textContent = `${item.category} Series`;
        details.append(name, category);

        // Container for price and remove button
        const rightSide = document.createElement("div");
        rightSide.style.display = "flex";
        rightSide.style.alignItems = "center";
        rightSide.style.gap = "1.2rem";
        rightSide.style.flexShrink = "0"; // Prevents the button from being squished off-screen

        const price = document.createElement("strong");
        price.textContent = formatINR(item.price);
        price.style.fontFamily = "'Orbitron', sans-serif";

        // Create Remove Button
        const removeBtn = document.createElement("button");
        removeBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
        removeBtn.style.background = "none";
        removeBtn.style.border = "none";
        removeBtn.style.color = "#ff4757";
        removeBtn.style.fontSize = "1.2rem";
        removeBtn.style.cursor = "pointer";
        removeBtn.style.padding = "5px"; // Gives it a better click area
        removeBtn.style.transition = "transform 0.2s, color 0.2s";
        removeBtn.setAttribute("aria-label", `Remove ${item.name}`);

        // Hover effects
        removeBtn.addEventListener("mouseenter", () => {
            removeBtn.style.transform = "scale(1.15)";
            removeBtn.style.color = "#ff6b81";
        });
        removeBtn.addEventListener("mouseleave", () => {
            removeBtn.style.transform = "scale(1)";
            removeBtn.style.color = "#ff4757";
        });

        // Click handler to remove item
        removeBtn.addEventListener("click", () => {
            cart = cart.filter((cItem) => cItem.id !== item.id);
            localStorage.setItem("vortex_cart", JSON.stringify(cart));

            if (cart.length === 0) {
                alert("Your cart is empty! Redirecting to events...");
                window.location.href = "index.html#events";
            } else {
                renderOrder(); // Redraws the list instantly
            }
        });

        rightSide.append(price, removeBtn);
        row.append(details, rightSide);
        list.appendChild(row);
    });

    const billing = getCartBilling();
    document.getElementById("checkoutSubtotal").textContent = formatINR(billing.subtotal);
    document.getElementById("checkoutDiscountLabel").textContent = `Discount (${billing.discountPercent * 100}%)`;
    document.getElementById("checkoutDiscount").textContent = `-${formatINR(billing.discount)}`;
    document.getElementById("checkoutTotal").textContent = formatINR(billing.total);
};

// Initial Render
renderOrder();

// =========================================
// 5. FORM LOGIC & SUBMISSION
// =========================================
const collegeSelect = document.getElementById("collegeSelect");
const otherCollegeGroup = document.getElementById("otherCollegeGroup");
const otherCollegeInput = document.getElementById("otherCollege");

if (collegeSelect) {
    collegeSelect.addEventListener("change", (e) => {
        if (e.target.value === "Other") {
            otherCollegeGroup.style.display = "block";
            otherCollegeInput.required = true;
        } else {
            otherCollegeGroup.style.display = "none";
            otherCollegeInput.required = false;
            otherCollegeInput.value = "";
        }
    });
}

const checkoutForm = document.getElementById("checkoutForm");
if (checkoutForm) {
    checkoutForm.addEventListener("submit", (e) => {
        e.preventDefault(); 
        
        let finalCollege = collegeSelect.value;
        if (finalCollege === "Other") {
            finalCollege = otherCollegeInput.value.trim();
        }

        const participantData = {
            name: document.getElementById("fullName").value.trim(),
            phone: document.getElementById("phone").value.trim(),
            email: document.getElementById("email").value.trim(),
            college: finalCollege,
            year: document.getElementById("yearSelect").value,
            collegeId: document.getElementById("collegeId").value.trim(),
            cart: cart,
            billing: getCartBilling()
        };

        localStorage.setItem("vortex_checkout_data", JSON.stringify(participantData));
        window.location.href = "payment.html";
    });
}