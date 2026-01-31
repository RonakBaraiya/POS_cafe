// auth.js
document.addEventListener("DOMContentLoaded", () => {
  const counterBtn = document.querySelector(".counter-btn");
  const kitchenBtn = document.querySelector(".kitchen-btn");

  const setRoleAndRedirect = async (role) => {
    try {
      const res = await fetch("/set-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (data.ok) {
        // redirect based on role
        if (role === "counter") window.location.href = "/counter";
        if (role === "kitchen") window.location.href = "/kitchen";
      } else {
        alert("Role not allowed");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  counterBtn.addEventListener("click", () => setRoleAndRedirect("counter"));
  kitchenBtn.addEventListener("click", () => setRoleAndRedirect("kitchen"));
});
