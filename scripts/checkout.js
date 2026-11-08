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
try {
  cart = JSON.parse(localStorage.getItem("vortex_cart") || "[]");
} catch { cart = []; }

// Security check: Verify prices against eventsData so users can't edit LocalStorage to get free tickets
cart = cart.map((item) => {
  const eventRecord = eventsData.find((e) => e.id === item.id);
  return { ...item, price: eventRecord ? parsePrice(eventRecord.price) : 0 };
});

// If cart is empty, kick them back to the home page
if (cart.length === 0) {
    alert("Your cart is empty! Redirecting to events...");
    window.location.href = "index.html#events";
}

// =========================================
// 3. DISCOUNT MATH (Exact same logic as index.js)
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
// 4. RENDER ORDER SUMMARY
// =========================================
const renderOrder = () => {
    const list = document.getElementById("checkoutEventList");
    
    cart.forEach((item) => {
        const row = document.createElement("div");
        row.className = "checkout-event-row";

        const details = document.createElement("div");
        details.className = "checkout-event-details";

        const name = document.createElement("strong");
        name.textContent = item.name;

        const category = document.createElement("span");
        category.textContent = `${item.category} Series`;

        const price = document.createElement("strong");
        price.textContent = formatINR(item.price);
        price.style.fontFamily = "'Orbitron', sans-serif";

        details.append(name, category);
        row.append(details, price);
        list.appendChild(row);
    });

    const billing = getCartBilling();
    document.getElementById("checkoutSubtotal").textContent = formatINR(billing.subtotal);
    document.getElementById("checkoutDiscountLabel").textContent = `Discount (${billing.discountPercent * 100}%)`;
    document.getElementById("checkoutDiscount").textContent = `-${formatINR(billing.discount)}`;
    document.getElementById("checkoutTotal").textContent = formatINR(billing.total);
};

renderOrder();

// =========================================
// 5. FORM LOGIC & SUBMISSION
// =========================================
const collegeSelect = document.getElementById("collegeSelect");
const otherCollegeGroup = document.getElementById("otherCollegeGroup");
const otherCollegeInput = document.getElementById("otherCollege");

// Show/Hide the "Other" college text box
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

document.getElementById("checkoutForm").addEventListener("submit", (e) => {
    e.preventDefault();
    
    // Determine the final college name
    let finalCollege = collegeSelect.value;
    if (finalCollege === "Other") {
        finalCollege = otherCollegeInput.value.trim();
    }

    // Compile the final payload
    const participantData = {
        name: document.getElementById("fullName").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        email: document.getElementById("email").value.trim(),
        college: finalCollege,
        cart: cart,
        billing: getCartBilling()
    };

    // Save details locally so the payment page can access them
    localStorage.setItem("vortex_checkout_data", JSON.stringify(participantData));

    // Redirect to the placeholder payment gateway
    window.location.href = "payment.html";
});