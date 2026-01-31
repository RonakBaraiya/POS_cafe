const containers = document.querySelectorAll(".btn-container");
let order = {}; // local copy

document.querySelector(".ord-btn").addEventListener("click", () => {
  const orderId = document.querySelector(".order-id input").value;
  const orderItemsDiv = document.querySelector(".order-items").innerHTML;

  fetch("/place-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      order_id: orderId,
      order_html: orderItemsDiv,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        alert("Order sent to kitchen");

        // clear order panel
        document.querySelector(".order-items").innerHTML = "";
        document.querySelector(".total-bill").innerText = "Bill : $0.00";

        // 🔴 RESET ALL ITEM BUTTON STATES
        containers.forEach((container) => {
          container.querySelector(".indec-button").style.display = "none";
          container.querySelector(".button").style.display = "block";
          container.querySelector(".qty").textContent = "1";
        });

        // clear local order object
        order = {};
      }
    });
});

containers.forEach((container) => {
  const addbtn = container.querySelector(".button");
  const indecbtn = container.querySelector(".indec-button");
  const minus = container.querySelector(".minus");
  const plus = container.querySelector(".plus");
  const qty = container.querySelector(".qty");
  const itemid = container.dataset.id;
  const itemName = container
    .closest(".c-item")
    .querySelector(".item-info h3").textContent;
  const itemPrice = container
    .closest(".c-item")
    .querySelector(".price")
    .textContent.replace("$", "");

  addbtn.style.display = "block";
  indecbtn.style.display = "none";

  const updateOrderPanel = (orderData) => {
    const panel = document.querySelector(".order-items");
    panel.innerHTML = "";
    Object.entries(orderData).forEach(([id, item]) => {
      const row = document.createElement("div");
      row.classList.add("order-row");
      row.innerHTML = `
        <span class="order-name">${item.name}</span>
        <span class="order-price">$${item.price}</span>
        <span class="order-qty">× ${item.qty}</span>
        <button class="order-remove" data-id="${id}">✕</button>
      `;
      panel.appendChild(row);
    });

    let total = 0;
    Object.values(orderData).forEach((item) => {
      total += item.price * item.qty;
    });

    document.querySelector(".total-bill").innerText =
      "Bill : $" + total.toFixed(2);

    // remove handler
    panel.querySelectorAll(".order-remove").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        fetch("/item-clicked", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            item_id: id,
            current_qty: 0,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.allowed) {
              updateOrderPanel(data.order);
              // reset buttons
              const container = document.querySelector(
                `.btn-container[data-id='${id}']`,
              );
              if (container) {
                container.querySelector(".indec-button").style.display = "none";
                container.querySelector(".button").style.display = "block";
                container.querySelector(".qty").textContent = "1";
              }
            }
          });
      });
    });
  };

  addbtn.addEventListener("click", () => {
    let counter = 1;
    qty.textContent = "1";

    fetch("/item-clicked", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        item_id: itemid,
        current_qty: counter,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.allowed) {
          updateOrderPanel(data.order);
          addbtn.style.display = "none";
          indecbtn.style.display = "flex";
        } else {
          alert("Stock limit reached!");
        }
      });
  });

  plus.addEventListener("click", () => {
    let counter = parseInt(qty.textContent);
    counter += 1;
    qty.textContent = counter;

    fetch("/item-clicked", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        item_id: itemid,
        current_qty: counter,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.allowed) {
          updateOrderPanel(data.order);
        } else {
          alert("Stock limit reached!");
          qty.textContent = counter - 1;
        }
      });
  });

  minus.addEventListener("click", () => {
    let counter = parseInt(qty.textContent);
    counter -= 1;
    qty.textContent = counter;

    fetch("/item-clicked", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        item_id: itemid,
        current_qty: counter,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.allowed) {
          updateOrderPanel(data.order);
          if (counter === 0) {
            indecbtn.style.display = "none";
            addbtn.style.display = "block";
            qty.textContent = "1";
          }
        }
      });
  });
});

const readyContainer = document.querySelector(".order-ready");

// connect socket
const socket = io();

// listen for ready orders
socket.on("order_ready", (data) => {
  const orderDiv = document.createElement("div");
  orderDiv.textContent = `Order #${data.order_id} - Ready`;
  readyContainer.appendChild(orderDiv);
});
