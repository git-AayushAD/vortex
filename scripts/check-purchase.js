const form = document.getElementById("checkPurchaseForm");

const purchaseIdInput = document.getElementById("purchaseIdInput");
const purchaseEmailInput = document.getElementById("purchaseEmailInput");
const statusElement = document.getElementById("purchaseLookupStatus");
const resultContainer = document.getElementById("purchaseResult");
const submitButton = document.getElementById("checkPurchaseBtn");

const API_BASE_URL = "http://localhost:5000/api/registrations";

function formatINR(amount = 0) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(Number(amount) || 0);
}

function setText(id, value) {
  document.getElementById(id).textContent =
    value === null || value === undefined || value === "" ? "—" : String(value);
}

function displayRegistration(registration) {
  const billing = registration.billing || {};

  setText("resultPurchaseId", registration.registrationId);
  setText("resultPaymentStatus", registration.paymentStatus);
  setText("resultName", registration.name);
  setText("resultEmail", registration.email);
  setText("resultRoll", registration.rollNumber);
  setText("resultYear", registration.academicYear);
  setText("resultBranch", registration.branch);

  setText("resultSubtotal", formatINR(billing.subtotal));
  setText("resultDiscount", formatINR(billing.discount));
  setText("resultTotal", formatINR(billing.total));

  setText("resultOrderId", registration.orderId);
  setText("resultPaymentId", registration.paymentId);

  setText(
    "resultPaidAt",
    registration.paidAt
      ? new Date(registration.paidAt).toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        })
      : "—",
  );

  const eventsContainer = document.getElementById("resultEvents");
  eventsContainer.replaceChildren();

  if (!registration.events?.length) {
    const message = document.createElement("p");
    message.textContent = "No events found for this registration.";
    eventsContainer.appendChild(message);
  } else {
    const table = document.createElement("table");
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    ["Event", "Category", "Price"].forEach((heading) => {
      const th = document.createElement("th");
      th.textContent = heading;
      th.style.textAlign = "left";
      th.style.padding = "10px";
      headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    registration.events.forEach((eventItem) => {
      const row = document.createElement("tr");

      [
        eventItem.name,
        eventItem.category || "—",
        formatINR(eventItem.price),
      ].forEach((value) => {
        const td = document.createElement("td");
        td.textContent = value ?? "—";
        td.style.padding = "10px";
        td.style.borderTop = "1px solid #ddd";
        row.appendChild(td);
      });

      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    eventsContainer.appendChild(table);
  }

  resultContainer.hidden = false;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault(); // Prevent page reload

  const purchaseId = purchaseIdInput.value.trim();
  const email = purchaseEmailInput.value.trim().toLowerCase();

  if (!purchaseId || !email) {
    statusElement.textContent =
      "Please enter both your Purchase ID and registered email.";
    return;
  }

  resultContainer.hidden = true;
  statusElement.textContent = "Looking up your registration...";
  submitButton.disabled = true;

  try {
    const url = new URL(
      `${API_BASE_URL}/purchase/${encodeURIComponent(purchaseId)}`,
    );

    url.searchParams.set("email", email);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Could not find your registration.");
    }

    displayRegistration(data.registration);

    statusElement.textContent =
      "Your confirmed registration was found successfully.";
  } catch (error) {
    console.error("Purchase lookup failed:", error);

    statusElement.textContent =
      error.message ||
      "Unable to retrieve your registration. Please try again.";
  } finally {
    submitButton.disabled = false;
  }
});
