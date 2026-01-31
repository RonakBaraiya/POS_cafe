const container = document.querySelector(".orders");

// create order card
function createOrderCard(order) {
  const card = document.createElement("div");
  card.className = "order-card";

  card.innerHTML = `
    <h3>Order #${order.order_id}</h3>
    <div class="items">${order.order_items}</div>
    <button class="ready">Ready</button>
  `;

  // hide remove buttons inside order items
  card
    .querySelectorAll(".order-remove")
    .forEach((btn) => (btn.style.display = "none"));

  // ready button click
  card.querySelector(".ready").addEventListener("click", () => {
    fetch("/order-ready", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: order.order_id }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          card.remove(); // remove from kitchen UI
          // emit to counter to notify ready order
          socket.emit("order_ready_for_counter", { order_id: order.order_id });
        }
      });
  });

  return card;
}

// initial load
fetch("/api/kitchen-orders")
  .then((res) => res.json())
  .then((orders) => {
    orders.forEach((order) => container.appendChild(createOrderCard(order)));
  });

// socket.io
const socket = io();

// receive new orders
socket.on("new_order", (order) => {
  container.appendChild(createOrderCard(order));
});
