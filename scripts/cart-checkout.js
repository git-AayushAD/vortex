import eventsData from "../data/eventsData.js";

// =========================================
// 1. CONFIGURATION & HELPERS
// =========================================

const VALID_CATEGORIES = ["general", "prodigy", "pharma"];
const EXCLUDED_DISCOUNT_EVENT_ID = "sridp";

const formatINR = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const getEventById = (id) => eventsData.find((event) => event.id === id);

const getEventPrice = (event) => {
  const price = Number(event?.price);

  return Number.isFinite(price) && price >= 0 ? price : null;
};

const getCartIcon = () => document.querySelector(".fa-cart-shopping");

let cart = [];
let previousDiscountPercent = 0;
let cartInitialized = false;

const initializedTabs = new WeakSet();

// =========================================
// 2. LOAD AND NORMALIZE SAVED CART
// =========================================

function loadSavedCart() {
  try {
    const storedCart = JSON.parse(localStorage.getItem("vortex_cart") || "[]");

    if (!Array.isArray(storedCart)) {
      cart = [];
      return;
    }

    const seenIds = new Set();

    cart = storedCart
      .filter(
        (item) =>
          item &&
          typeof item.id === "string" &&
          VALID_CATEGORIES.includes(item.category),
      )
      .map((item) => {
        const event = getEventById(item.id);

        // Always use trusted event data rather than saved values.
        if (!event || event.cat !== item.category) {
          return null;
        }

        const price = getEventPrice(event);

        if (price === null || seenIds.has(event.id)) {
          return null;
        }

        seenIds.add(event.id);

        return {
          id: event.id,
          name: event.name,
          category: event.cat,
          price,
        };
      })
      .filter(Boolean);
  } catch {
    cart = [];
  }
}

function saveCart() {
  try {
    localStorage.setItem("vortex_cart", JSON.stringify(cart));
  } catch (error) {
    console.error("Unable to save the cart:", error);
  }
}

// =========================================
// 3. CART SIDEBAR
// =========================================

function initializeCartSidebar() {
  const cartToggleBtn = document.getElementById("cartToggleBtn");
  const closeCartBtn = document.getElementById("closeCartBtn");
  const cartSidebar = document.getElementById("cartSidebar");

  if (cartToggleBtn && !cartToggleBtn.dataset.cartBound) {
    cartToggleBtn.dataset.cartBound = "true";

    cartToggleBtn.addEventListener("click", () => {
      cartSidebar?.classList.add("active");
    });
  }

  if (closeCartBtn && !closeCartBtn.dataset.cartBound) {
    closeCartBtn.dataset.cartBound = "true";

    closeCartBtn.addEventListener("click", () => {
      cartSidebar?.classList.remove("active");
    });
  }
}

// =========================================
// 4. EVENT RENDERING
// =========================================

function renderCategory(categoryId, containerId) {
  const items = eventsData.filter((event) => event.cat === categoryId);

  const container = document.getElementById(containerId);

  if (!container) return;

  container.replaceChildren();

  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "event-card";
    card.id = `card-${item.id}`;

    const info = document.createElement("div");
    info.className = "event-info";

    const title = document.createElement("h3");
    title.textContent = item.name;

    const description = document.createElement("p");
    description.textContent = item.desc;

    const price = document.createElement("div");
    price.className = "event-price";

    const eventPrice = getEventPrice(item);

    price.textContent =
      eventPrice === null ? "Price unavailable" : formatINR(eventPrice);

    info.append(title, description, price);

    const wrapper = document.createElement("div");
    wrapper.className = "interactive-btn-wrapper";

    const label = document.createElement("span");
    label.className = "default-label";
    label.textContent = "OPTIONS";

    const actions = document.createElement("div");
    actions.className = "revealed-actions";

    const infoButton = document.createElement("button");
    infoButton.className = "action-btn btn-info";
    infoButton.textContent = "Info";
    infoButton.type = "button";

    const cartButton = document.createElement("button");
    cartButton.className = "action-btn btn-cart";
    cartButton.id = `btn-${item.id}`;
    cartButton.type = "button";

    const alreadyAdded = cart.some((cartItem) => cartItem.id === item.id);

    cartButton.textContent = alreadyAdded ? "Added" : "Add to Cart";

    if (alreadyAdded) {
      cartButton.classList.add("added");
    }

    if (eventPrice === null) {
      cartButton.disabled = true;
      cartButton.textContent = "Unavailable";
    }

    cartButton.addEventListener("click", () => {
      window.handleAddToCart(item.id);
    });

    actions.append(infoButton, cartButton);
    wrapper.append(label, actions);
    card.append(info, wrapper);
    container.appendChild(card);
  });
}

function initializeEventsTab() {
  renderCategory("general", "grid-general");
  renderCategory("prodigy", "grid-prodigy");
  renderCategory("pharma", "grid-pharma");
}

// =========================================
// 5. DISCOUNT CALCULATION
// =========================================

function getCartBilling() {
  const eligibleItems = cart.filter(
    (item) => item.id !== EXCLUDED_DISCOUNT_EVENT_ID,
  );

  const ineligibleItems = cart.filter(
    (item) => item.id === EXCLUDED_DISCOUNT_EVENT_ID,
  );

  const counts = {
    general: 0,
    prodigy: 0,
    pharma: 0,
  };

  eligibleItems.forEach((item) => {
    if (Object.hasOwn(counts, item.category)) {
      counts[item.category]++;
    }
  });

  let completedSeries = 0;

  if (counts.general === 5) completedSeries++;
  if (counts.prodigy === 4) completedSeries++;
  if (counts.pharma === 5) completedSeries++;

  let discountPercent = 0;
  let message = "Add more events to unlock series discounts!";

  if (completedSeries === 3) {
    discountPercent = 0.7;
    message = "All 3 series complete — 70% discount applied!";
  } else if (completedSeries === 2) {
    discountPercent = 0.62;
    message = "2 series complete — 62% discount applied!";
  } else if (completedSeries === 1) {
    discountPercent = 0.6;
    message = "1 full series complete — 60% discount applied!";
  } else if (eligibleItems.length >= 5) {
    discountPercent = 0.5;
    message = "5+ eligible events — 50% discount applied!";
  } else if (eligibleItems.length > 0) {
    const remaining = Math.max(0, 5 - eligibleItems.length);

    message = `Add ${remaining} more eligible event(s) for 50% off.`;
  }

  // Use each event's own price.
  const subtotal = cart.reduce((sum, item) => sum + item.price, 0);

  const eligibleSubtotal = eligibleItems.reduce(
    (sum, item) => sum + item.price,
    0,
  );

  const excludedSubtotal = ineligibleItems.reduce(
    (sum, item) => sum + item.price,
    0,
  );

  const discount = eligibleSubtotal * discountPercent;

  const total = eligibleSubtotal - discount + excludedSubtotal;

  return {
    subtotal,
    eligibleSubtotal,
    excludedSubtotal,
    discount,
    total,
    discountPercent,
    message,
  };
}

// =========================================
// 6. FLYING CART ANIMATION
// =========================================

function createFlyingParticle(startRect, endRect, color, callback) {
  const particle = document.createElement("div");

  particle.className = "flying-particle";
  particle.style.background = color;

  const startX = startRect.left + startRect.width / 2 - 7;
  const startY = startRect.top + startRect.height / 2 - 7;

  particle.style.left = "0px";
  particle.style.top = "0px";
  particle.style.transform = `translate(${startX}px, ${startY}px) scale(1)`;

  document.body.appendChild(particle);

  void particle.offsetWidth;

  const endX = endRect.left + endRect.width / 2 - 7;
  const endY = endRect.top + endRect.height / 2 - 7;

  particle.style.transform = `translate(${endX}px, ${endY}px) scale(0.3)`;

  particle.style.opacity = "0.3";

  setTimeout(() => {
    particle.remove();
    callback?.();
  }, 600);
}

// =========================================
// 7. CART SUMMARY
// =========================================

function calculateCartTotals() {
  const billing = getCartBilling();

  const subtotal = document.getElementById("cartSubtotal");
  const discountLabel = document.getElementById("discountLabel");
  const discountAmount = document.getElementById("cartDiscount");
  const total = document.getElementById("cartTotal");
  const message = document.getElementById("discountMsg");

  if (subtotal) subtotal.textContent = formatINR(billing.subtotal);

  if (discountLabel) {
    discountLabel.textContent = `Discount (${billing.discountPercent * 100}%)`;
  }

  if (discountAmount) {
    discountAmount.textContent = `-${formatINR(billing.discount)}`;
  }

  if (total) total.textContent = formatINR(billing.total);

  if (message) {
    message.textContent = billing.message;

    if (billing.discountPercent > previousDiscountPercent) {
      const discountContainer = document.getElementById("discountContainer");

      discountContainer?.classList.remove("celebrate-animation");

      if (discountContainer) {
        void discountContainer.offsetWidth;
        discountContainer.classList.add("celebrate-animation");
      }

      message.style.color = "var(--success-green)";

      setTimeout(() => {
        message.style.color = "var(--primary-cyan)";
      }, 1200);
    }
  }

  previousDiscountPercent = billing.discountPercent;
}

// =========================================
// 8. CHECKOUT BILLING
// =========================================

function renderCheckoutBilling() {
  const list = document.getElementById("checkoutEventList");

  if (!list) return;

  const eventCount = document.getElementById("checkoutEventCount");

  if (eventCount) {
    eventCount.textContent = `${cart.length} event${cart.length === 1 ? "" : "s"}`;
  }

  list.replaceChildren();

  if (cart.length === 0) {
    const emptyMessage = document.createElement("p");

    emptyMessage.className = "checkout-empty";
    emptyMessage.textContent =
      "Your cart is empty. Add events before checkout.";

    list.appendChild(emptyMessage);
  } else {
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

      details.append(name, category);
      row.append(details, price);
      list.appendChild(row);
    });
  }

  const billing = getCartBilling();

  const subtotal = document.getElementById("checkoutSubtotal");
  const discountLabel = document.getElementById("checkoutDiscountLabel");
  const discount = document.getElementById("checkoutDiscount");
  const total = document.getElementById("checkoutTotal");
  const message = document.getElementById("checkoutDiscountMsg");

  if (subtotal) subtotal.textContent = formatINR(billing.subtotal);

  if (discountLabel) {
    discountLabel.textContent = `Discount (${billing.discountPercent * 100}%)`;
  }

  if (discount) {
    discount.textContent = `-${formatINR(billing.discount)}`;
  }

  if (total) total.textContent = formatINR(billing.total);

  if (message) message.textContent = billing.message;

  const checkoutBtn = document.querySelector(".checkout-btn");

  if (checkoutBtn) {
    checkoutBtn.disabled = cart.length === 0;
  }
}

// =========================================
// 9. UPDATE CART UI
// =========================================

function updateCartUI() {
  const cartCount = document.getElementById("cartCount");
  const list = document.getElementById("cartItemsList");

  if (cartCount) cartCount.textContent = cart.length;

  if (list) {
    list.replaceChildren();

    if (cart.length === 0) {
      const empty = document.createElement("p");

      empty.style.color = "var(--text-muted)";
      empty.style.textAlign = "center";
      empty.style.marginTop = "2rem";
      empty.textContent = "Cart is empty.";

      list.appendChild(empty);
    } else {
      cart.forEach((item) => {
        const row = document.createElement("div");
        row.className = "cart-item";

        const details = document.createElement("div");
        details.className = "item-details";

        const name = document.createElement("h4");
        name.textContent = item.name;

        const category = document.createElement("p");
        category.textContent = `${item.category} Series`;

        details.append(name, category);

        const right = document.createElement("div");

        right.style.display = "flex";
        right.style.alignItems = "center";
        right.style.gap = "1rem";

        const price = document.createElement("span");
        price.style.fontFamily = "'Orbitron'";
        price.style.fontSize = "0.85rem";
        price.textContent = formatINR(item.price);

        const removeButton = document.createElement("button");
        removeButton.className = "remove-item";
        removeButton.type = "button";
        removeButton.setAttribute(
          "aria-label",
          `Remove ${item.name} from cart`,
        );

        const icon = document.createElement("i");
        icon.className = "fa-solid fa-trash";

        removeButton.appendChild(icon);

        removeButton.addEventListener("click", () => {
          window.handleRemoveFromCart(item.id);
        });

        right.append(price, removeButton);
        row.append(details, right);
        list.appendChild(row);
      });
    }
  }

  // Update buttons only for event cards that are currently loaded.
  eventsData.forEach((event) => {
    const button = document.getElementById(`btn-${event.id}`);

    if (!button) return;

    const added = cart.some((item) => item.id === event.id);

    button.textContent = added ? "Added" : "Add to Cart";
    button.classList.toggle("added", added);
  });

  calculateCartTotals();
  renderCheckoutBilling();
}

// =========================================
// 10. ADD TO CART
// =========================================

window.handleAddToCart = (id) => {
  if (cart.some((item) => item.id === id)) return;

  const event = getEventById(id);

  if (!event || !VALID_CATEGORIES.includes(event.cat)) return;

  const price = getEventPrice(event);

  if (price === null) {
    console.error(`Invalid price for event: ${id}`);
    return;
  }

  const button = document.getElementById(`btn-${id}`);

  // If the Events tab is not currently loaded, don't depend on its button.
  const startRect = button?.getBoundingClientRect();
  const cartIcon = getCartIcon();
  const endRect = cartIcon?.getBoundingClientRect();

  const addItem = () => {
    // Check again in case another action added this event.
    if (cart.some((item) => item.id === id)) return;

    cart.push({
      id: event.id,
      name: event.name,
      category: event.cat,
      price,
    });

    saveCart();
    updateCartUI();
  };

  if (button) {
    button.textContent = "Adding...";
    button.classList.add("added");
  }

  if (startRect && endRect) {
    createFlyingParticle(startRect, endRect, "var(--primary-cyan)", addItem);
  } else {
    addItem();
  }
};

// =========================================
// 11. REMOVE FROM CART
// =========================================

window.handleRemoveFromCart = (id) => {
  const card = document.getElementById(`card-${id}`);
  const cartIcon = getCartIcon();

  if (card && cartIcon) {
    createFlyingParticle(
      cartIcon.getBoundingClientRect(),
      card.getBoundingClientRect(),
      "#ff4757",
    );
  }

  cart = cart.filter((item) => item.id !== id);

  saveCart();
  updateCartUI();
};

// =========================================
// 12. CHECKOUT NAVIGATION
// =========================================

function openTab(tabId) {
  if (typeof window.showVortexTab === "function") {
    window.showVortexTab(tabId);
    return;
  }

  document.querySelector(`.nav-tab[data-target="${tabId}"]`)?.click();
}

function initializeCheckoutNavigation() {
  const checkoutBtn = document.querySelector(".checkout-btn");
  const checkoutBackBtn = document.getElementById("checkoutBackBtn");

  if (checkoutBtn && !checkoutBtn.dataset.checkoutBound) {
    checkoutBtn.dataset.checkoutBound = "true";

    checkoutBtn.addEventListener("click", () => {
      if (cart.length === 0) {
        document.getElementById("cartSidebar")?.classList.add("active");

        const message = document.getElementById("discountMsg");

        if (message) {
          message.textContent =
            "Please add at least one event before checking out.";
        }

        return;
      }

      document.getElementById("cartSidebar")?.classList.remove("active");

      openTab("checkout");
    });
  }

  if (checkoutBackBtn && !checkoutBackBtn.dataset.checkoutBound) {
    checkoutBackBtn.dataset.checkoutBound = "true";

    checkoutBackBtn.addEventListener("click", () => {
      openTab("events");
    });
  }
}

// =========================================
// 13. CHECKOUT VALIDATION
// =========================================

window.isValidVortexRollNumber = (rollNumber) => {
  return /^[A-Za-z0-9][A-Za-z0-9 /-]{2,39}$/.test(
    String(rollNumber || "").trim(),
  );
};

function initializeCheckoutForm(container) {
  const checkoutForm = container.querySelector("#checkoutForm");

  if (!checkoutForm || initializedTabs.has(checkoutForm)) return;

  initializedTabs.add(checkoutForm);

  const checkoutStatus = container.querySelector("#checkoutStatus");

  const setFieldError = (fieldId, message) => {
    const field = container.querySelector(`#${fieldId}`);
    const error = container.querySelector(`[data-error-for="${fieldId}"]`);

    if (error) error.textContent = message;

    if (field) {
      field.setAttribute("aria-invalid", message ? "true" : "false");
    }
  };

  const clearCheckoutErrors = () => {
    [
      "checkoutName",
      "checkoutEmail",
      "checkoutRoll",
      "checkoutYear",
      "checkoutBranch",
    ].forEach((id) => setFieldError(id, ""));

    if (checkoutStatus) {
      checkoutStatus.textContent = "";
      checkoutStatus.className = "checkout-status";
    }
  };

  const validateCheckout = () => {
    clearCheckoutErrors();

    let valid = true;

    const nameField = container.querySelector("#checkoutName");
    const emailField = container.querySelector("#checkoutEmail");
    const rollField = container.querySelector("#checkoutRoll");
    const yearField = container.querySelector("#checkoutYear");
    const branchField = container.querySelector("#checkoutBranch");

    const name = nameField?.value.trim() || "";
    const email = emailField?.value.trim() || "";
    const roll = rollField?.value.trim() || "";
    const year = yearField?.value || "";
    const branch = branchField?.value.trim() || "";

    const namePattern = /^[\p{L}][\p{L}\p{M} .'-]*$/u;

    if (name.length < 2 || name.length > 100 || !namePattern.test(name)) {
      setFieldError("checkoutName", "Enter a valid full name.");
      valid = false;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    if (email.length > 254 || !emailPattern.test(email)) {
      setFieldError(
        "checkoutEmail",
        "Enter a valid email address, such as name@example.com.",
      );

      valid = false;
    }

    if (!window.isValidVortexRollNumber(roll)) {
      setFieldError("checkoutRoll", "Enter a valid roll/enrollment number.");

      valid = false;
    }

    const allowedYears = ["FY", "SY", "TY", "Final Year", "Master's", "PhD"];

    if (!allowedYears.includes(year)) {
      setFieldError("checkoutYear", "Select your academic year or programme.");

      valid = false;
    }

    // Branch is optional only if the HTML field is absent.
    if (branchField && !branch) {
      setFieldError("checkoutBranch", "Enter your branch.");
      valid = false;
    }

    if (cart.length === 0) {
      if (checkoutStatus) {
        checkoutStatus.textContent =
          "Your cart is empty. Please add an event before checking out.";

        checkoutStatus.classList.add("error");
      }

      valid = false;
    }

    return valid;
  };

  [
    "checkoutName",
    "checkoutEmail",
    "checkoutRoll",
    "checkoutYear",
    "checkoutBranch",
  ].forEach((id) => {
    const field = container.querySelector(`#${id}`);

    field?.addEventListener("input", () => {
      setFieldError(id, "");
    });

    field?.addEventListener("change", () => {
      setFieldError(id, "");
    });
  });

  // =========================================
  // 14. REGISTRATION SUBMISSION
  // =========================================

  // Placeholder until your backend endpoint is connected.
  window.submitVortexRegistration = async (registration) => {
    // console.log("Validated registration payload:", registration);
    // async function payWithRazorpay(registration) {
    // console.log("hello world");
    // console.log(registration);
    try {
      // Step 1: Create the order through your Express backend
      const response = await fetch(
        "http://localhost:5000/api/registrations/create-order",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(registration),
        },
      );

      const order = await response.json();

      if (!response.ok) {
        throw new Error(order.message || "Could not create order.");
      }

      // Step 2: Configure Razorpay using the backend response
      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Vortex 14.0",
        description: "Event Registration",
        order_id: order.orderId,

        prefill: {
          name: registration.name,
          email: registration.email,
        },

        theme: {
          color: "#3399cc",
        },

        // Step 3: Send payment details to your verification API
        handler: async function (paymentResponse) {
          try {
            console.log("Razorpay payment response:", paymentResponse);

            const verifyResponse = await fetch(
              "http://localhost:5000/api/registrations/verify-payment",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  razorpay_order_id: paymentResponse.razorpay_order_id,
                  razorpay_payment_id: paymentResponse.razorpay_payment_id,
                  razorpay_signature: paymentResponse.razorpay_signature,
                }),
              },
            );

            // Parse the response BEFORE accessing result.success
            const result = await verifyResponse.json();

            if (!verifyResponse.ok || !result.success) {
              throw new Error(result.message || "Payment verification failed.");
            }

            console.log("Confirmed registration:", result);
            console.log("Receipt data:", result.receipt);

            // Lock checkout fields
            container
              .querySelectorAll("input, select, textarea")
              .forEach((input) => {
                input.disabled = true;
              });

            // Disable purchase and cart editing buttons
            container
              .querySelectorAll(
                "[data-checkout-edit], [data-cart-edit], #checkoutPayButton",
              )
              .forEach((button) => {
                button.disabled = true;
              });

            // Update the correct status element
            const status = container.querySelector("#checkoutStatus");

            if (status) {
              status.textContent =
                "Payment confirmed! Your receipt is ready below.";
            }

            // Generate and display the receipt download link
            if (result.receipt) {
              downloadReceipt(result.receipt);
              localStorage.setItem("vortex_cart", JSON.stringify("[]"));
              updateCartUI();
              checkoutStatus.textContent =
                "Registration submitted successfully.";

              checkoutStatus.classList.add("success");
              const submitButton = document.getElementById("checkoutSubmitBtn");
              submitButton.disabled = true;
            } else {
              console.error(
                "Receipt data is missing. Check the backend response.",
              );

              alert(
                "Payment verified, but receipt data was not returned by the server.",
              );
            }
          } catch (error) {
            console.error("Verification error:", error);

            alert(
              "Payment may have completed, but confirmation could not be verified. Please check your registration status before attempting another payment.",
            );
          }
        },

        modal: {
          ondismiss: function () {
            console.log("Razorpay Checkout closed.");
          },
        },
      };

      // Step 4: Open Razorpay Checkout
      const razorpayInstance = new window.Razorpay(options);

      razorpayInstance.on("payment.failed", function (paymentError) {
        console.error("Payment failed:", paymentError.error);

        alert(
          paymentError.error.description || "Payment failed. Please try again.",
        );
      });

      razorpayInstance.open();
    } catch (error) {
      console.error("Checkout error:", error);
      alert(error.message || "Unable to start checkout.");
    }
    // }

    // throw new Error(
    //   "Registration submission is not connected to the backend yet.",
    // );
  };

  checkoutForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!validateCheckout()) return;

    const billing = getCartBilling();

    const registration = {
      name: container.querySelector("#checkoutName").value.trim(),

      email: container
        .querySelector("#checkoutEmail")
        .value.trim()
        .toLowerCase(),

      rollNumber: container.querySelector("#checkoutRoll").value.trim(),

      academicYear: container.querySelector("#checkoutYear").value,

      branch: container.querySelector("#checkoutBranch")?.value.trim() || "",

      events: cart.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        price: item.price,
      })),

      billing: {
        subtotal: billing.subtotal,
        discountPercent: billing.discountPercent * 100,
        discount: billing.discount,
        total: billing.total,
      },
    };

    const submitButton = container.querySelector("#checkoutSubmitBtn");

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Submitting...";
    }

    if (checkoutStatus) {
      checkoutStatus.textContent = "";
      checkoutStatus.className = "checkout-status";
    }

    try {
      await window.submitVortexRegistration(registration);

      // if (checkoutStatus) {
      //   checkoutStatus.textContent = "Registration submitted successfully.";

      //   checkoutStatus.classList.add("success");
      // }
    } catch (error) {
      if (checkoutStatus) {
        checkoutStatus.textContent =
          error?.message || "Unable to submit registration. Please try again.";

        checkoutStatus.classList.add("error");
      }
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML =
          'Submit Registration <i class="fa-solid fa-arrow-right"></i>';
      }
    }
  });

  renderCheckoutBilling();
}

// =========================================
// 15. LAZY-LOADED TAB INITIALIZATION
// =========================================

function handleTabLoaded(event) {
  const { tabId, container } = event.detail || {};

  if (!tabId || !container) return;

  if (tabId === "events") {
    initializeEventsTab();
    updateCartUI();
  }

  if (tabId === "checkout") {
    initializeCheckoutForm(container);
    renderCheckoutBilling();
  }
}

function initializeCartCheckout() {
  if (cartInitialized) return;

  cartInitialized = true;

  loadSavedCart();

  initializeCartSidebar();
  initializeCheckoutNavigation();

  document.addEventListener("vortex:tab-loaded", handleTabLoaded);

  // Support loading this script after a tab's HTML is already present.
  if (document.getElementById("grid-general")) {
    initializeEventsTab();
  }

  const checkoutContainer = document.getElementById("checkout");

  if (checkoutContainer?.querySelector("#checkoutForm")) {
    initializeCheckoutForm(checkoutContainer);
  }

  updateCartUI();
  renderCheckoutBilling();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeCartCheckout, {
    once: true,
  });
} else {
  initializeCartCheckout();
}

// for donwloading the reciept
function escapeHTML(value = "") {
  return String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char],
  );
}

function formatINR2(amount = 0) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(Number(amount) || 0);
}

function downloadReceipt(registration) {
  const purchaseId = registration.registrationId;
  const events = registration.events || [];
  const billing = registration.billing || {};

  const eventRows = events
    .map(
      (event, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHTML(event.name)}</td>
      <td>${escapeHTML(event.category || "—")}</td>
      <td>${formatINR2(event.price)}</td>
    </tr>
  `,
    )
    .join("");

  const receiptHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vortex Purchase Receipt - ${escapeHTML(purchaseId)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: Arial, sans-serif;
      background: #f3f4f6;
      color: #202124;
      margin: 0;
      padding: 30px 15px;
    }
    .receipt {
      max-width: 800px;
      margin: auto;
      padding: 35px;
      background: white;
      border: 1px solid #ddd;
      border-radius: 12px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      flex-wrap: wrap;
      border-bottom: 2px solid #222;
      padding-bottom: 20px;
    }
    h1 { margin: 0 0 8px; }
    h2 {
      font-size: 17px;
      margin-top: 28px;
      border-bottom: 1px solid #ddd;
      padding-bottom: 8px;
    }
    .muted { color: #666; font-size: 13px; }
    .details {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
    }
    .detail {
      padding: 12px;
      background: #f7f7f7;
      border-radius: 6px;
      overflow-wrap: anywhere;
    }
    .detail small {
      display: block;
      color: #666;
      margin-bottom: 5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }
    th, td {
      padding: 12px 8px;
      border-bottom: 1px solid #ddd;
      text-align: left;
    }
    th { background: #f3f4f6; }
    .totals {
      max-width: 350px;
      margin: 20px 0 0 auto;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      padding: 7px 0;
    }
    .grand-total {
      border-top: 2px solid #222;
      margin-top: 6px;
      padding-top: 12px;
      font-size: 19px;
      font-weight: bold;
    }
    .status {
      display: inline-block;
      padding: 7px 12px;
      border-radius: 20px;
      background: #dcfce7;
      color: #166534;
      font-weight: bold;
    }
    .actions {
      text-align: center;
      margin-top: 25px;
    }
    button {
      padding: 11px 20px;
      cursor: pointer;
      margin: 5px;
    }
    @media (max-width: 550px) {
      .receipt { padding: 20px 14px; }
      .details { grid-template-columns: 1fr; }
      th, td { padding: 9px 5px; font-size: 13px; }
    }
    @media print {
      body { background: white; padding: 0; }
      .receipt { border: none; border-radius: 0; padding: 10px; }
      .actions { display: none; }
    }
  </style>
</head>
<body>
  <main class="receipt">
    <div class="header">
      <div>
        <h1>VORTEX 14.0</h1>
        <p class="muted">Event Registration Purchase Receipt</p>
      </div>
      <div>
        <span class="status">PAYMENT SUCCESSFUL</span>
        <p><strong>Purchase ID:</strong><br>
        ${escapeHTML(purchaseId)}</p>
      </div>
    </div>

    <h2>Student Details</h2>
    <div class="details">
      <div class="detail"><small>Full Name</small>${escapeHTML(registration.name)}</div>
      <div class="detail"><small>Email</small>${escapeHTML(registration.email)}</div>
      <div class="detail"><small>Roll / Enrollment Number</small>${escapeHTML(registration.rollNumber)}</div>
      <div class="detail"><small>Academic Year</small>${escapeHTML(registration.academicYear)}</div>
      <div class="detail"><small>Branch / Department</small>${escapeHTML(registration.branch || "—")}</div>
      <div class="detail"><small>Purchase Date</small>${escapeHTML(registration.paidAt || "—")}</div>
    </div>

    <h2>Purchased Events</h2>
    <table>
      <thead>
        <tr>
          <th>#</th><th>Event</th><th>Category</th><th>Price</th>
        </tr>
      </thead>
      <tbody>
        ${eventRows || '<tr><td colspan="4">No events listed</td></tr>'}
      </tbody>
    </table>

    <h2>Billing Summary</h2>
    <div class="totals">
      <div class="total-row">
        <span>Subtotal</span><span>${formatINR2(billing.subtotal)}</span>
      </div>
      <div class="total-row">
        <span>Discount (${escapeHTML(billing.discountPercent ?? 0)}%)</span>
        <span>− ${formatINR2(billing.discount)}</span>
      </div>
      <div class="total-row grand-total">
        <span>Total Paid</span><span>${formatINR2(billing.total)}</span>
      </div>
    </div>

    <h2>Payment Details</h2>
    <div class="details">
      <div class="detail"><small>Payment Status</small>Paid</div>
      <div class="detail"><small>Payment Method</small>Razorpay</div>
      <div class="detail"><small>Order ID</small>${escapeHTML(registration.orderId)}</div>
      <div class="detail"><small>Payment ID</small>${escapeHTML(registration.paymentId)}</div>
    </div>

    <p class="muted" style="margin-top:30px">
      Please keep this receipt for your records. The Purchase ID is your
      unique Vortex registration reference.
    </p>

    <div class="actions">
      <button onclick="window.print()">Print / Save as PDF</button>
    </div>
  </main>
</body>
</html>`;
  const blob = new Blob([receiptHTML], {
    type: "text/html;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);

  const downloadLink = document.querySelector("#downloadReceiptLink");

  if (downloadLink) {
    downloadLink.href = url;
    downloadLink.download = `Vortex-Receipt-${purchaseId}.html`;
    downloadLink.style.display = "inline-block";
    downloadLink.textContent = "Download Receipt";
  } else {
    // Fallback if the link is not present in the page
    const link = document.createElement("a");
    link.href = url;
    link.download = `Vortex-Receipt-${purchaseId}.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
}
