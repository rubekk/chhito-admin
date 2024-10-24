<script>
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
  import { db } from "$lib/firebaseConfig";
  import { writable } from "svelte/store";
  import "leaflet/dist/leaflet.css";

  let orders = writable([]);
  let selectedLocation = null;
  let map;
  let L;
  let currentMarker = null;

  async function fetchOrders() {
    const querySnapshot = await getDocs(collection(db, "orders"));
    let ordersArray = [];
    querySnapshot.forEach((doc) => {
      ordersArray.push({ id: doc.id, ...doc.data() });
    });

    ordersArray.sort((a, b) => {
      const dateA = new Date(`${a.orderDate} ${a.orderTime}`);
      const dateB = new Date(`${b.orderDate} ${b.orderTime}`);

      if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
        console.error("Invalid Date in Order:", dateA, dateB);
        return 0;
      }
      return dateB - dateA;
    });

    orders.set(ordersArray);
  }

  function showLocation(coords) {
    selectedLocation = coords;
    if (map) {
      const [lat, lng] = coords;
      if (currentMarker) {
        map.removeLayer(currentMarker);
      }
      currentMarker = L.marker([lat, lng])
        .addTo(map)
        .bindPopup("User Location")
        .openPopup();
      map.setView([lat, lng], 16);
    }
  }

  async function updateOrderStatus(orderId, status) {
    try {
      const orderDocRef = doc(db, "orders", orderId);
      await updateDoc(orderDocRef, {
        status: status,
      });
      fetchOrders();
      alert(`Order marked as ${status}!`);
    } catch (error) {
      console.error("Error updating order: ", error);
      alert("Failed to update order status. Please try again.");
    }
  }

  async function updateDeliveryTime(orderId, newTime) {
    try {
      const orderDocRef = doc(db, "orders", orderId);
      await updateDoc(orderDocRef, {
        orderDeliveryTime: newTime,
      });
      fetchOrders();
      alert(`Delivery time updated to ${newTime}!`);
    } catch (error) {
      console.error("Error updating delivery time: ", error);
      alert("Failed to update delivery time. Please try again.");
    }
  }

  function calculateEstimatedDeliveryTime(order) {
        const orderDateTimeString = `${order.orderDate} ${order.orderTime}`;
        const orderDate = new Date(orderDateTimeString);
        const deliveryDuration = parseInt(order.orderDeliveryTime) || 0;
        const estimatedDelivery = new Date(orderDate.getTime() + deliveryDuration * 60000);

        return estimatedDelivery.toLocaleTimeString('en-US', {
            timeZone: 'Asia/Kathmandu',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    }

  onMount(async () => {
    if (browser) {
      L = await import("leaflet");
    }

    fetchOrders();

    map = L.map("map").setView([27.665371, 85.331184], 2);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
  });
</script>

<h1>Orders</h1>

{#if $orders.length === 0}
  <p>No orders found.</p>
{:else}
  {#each $orders as order}
    <div class="order-card">
      <div class="order-header">
        <span class="order-id">Order ID: {order.id}</span>
        <span>Order by {order.orderUsername}</span>
      </div>
      <div class="order-info">
        <div class="order-details">
          <strong>Phone:</strong>
          {order.orderPhoneNumber}
        </div>
        <div class="order-details">
          <strong>Email:</strong>
          {order.orderEmail}
        </div>
        <div class="order-details">
          <strong>Order Date:</strong>
          {order.orderDate} - {order.orderDay}
        </div>
        <div class="order-details">
          <strong>Order Time:</strong>
          {order.orderTime}
        </div>
        <div class="order-details">
          <strong>Estimated Delivery Time:</strong>
          {calculateEstimatedDeliveryTime(order)}
        </div>
        <div class="order-details">
          <strong>Delivery Time:</strong>
          <input
            type="text"
            bind:value={order.orderDeliveryTime}
            on:blur={() =>
              updateDeliveryTime(order.id, order.orderDeliveryTime)}
          />
        </div>
        <div class="order-details">
          <strong>Distance:</strong>
          {order.orderDistance} km
        </div>
        <div class="order-details">
          <strong>Location:</strong>
          {order.orderLocation}
        </div>
      </div>

      <button
        class="view-location-btn"
        on:click={() => showLocation(order.orderLocationCoords)}
        >View Location</button
      >

      <table class="products-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Price (Rs)</th>
            <th>Quantity</th>
            <th>Total (Rs)</th>
          </tr>
        </thead>
        <tbody>
          {#each order.orderProducts as product}
            <tr>
              <td>{product.productName}</td>
              <td>{product.discountedPrice}</td>
              <td>{product.quantity}</td>
              <td>{product.discountedPrice * product.quantity}</td>
            </tr>
          {/each}
        </tbody>
      </table>

      <div class="total-value">
        Total Order Value: Rs. {order.orderProducts.reduce(
          (total, product) =>
            total + product.discountedPrice * product.quantity,
          0,
        )}
      </div>

      <div class="status-controls">
        <label>
          <input
            type="checkbox"
            checked={order.status === "pending"}
            on:change={() => updateOrderStatus(order.id, "pending")}
          />
          Pending
        </label>
        <label>
          <input
            type="checkbox"
            checked={order.status === "packed"}
            on:change={() => updateOrderStatus(order.id, "packed")}
          />
          Packed
        </label>
        <label>
          <input
            type="checkbox"
            checked={order.status === "on the way"}
            on:change={() => updateOrderStatus(order.id, "on the way")}
          />
          On the Way
        </label>
        <label>
          <input
            type="checkbox"
            checked={order.status === "delivered"}
            on:change={() => updateOrderStatus(order.id, "delivered")}
          />
          Delivered
        </label>
      </div>

      <div class="status">
        Status: <span class={order.status === "delivered" ? "delivered" : ""}
          >{order.status}</span
        >
      </div>
    </div>
  {/each}
{/if}

<div id="map"></div>

<style>
  h1 {
    text-align: center;
    margin-bottom: 20px;
    font-size: 2rem;
    color: #333;
  }

  .order-card {
    background-color: #f9f9f9;
    border-radius: 10px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    padding: 16px;
    margin: 0 auto 20px;
    width: 95%;
    max-width: 700px;
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease;
    position: relative;
  }

  .order-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  }

  .order-header {
    display: flex;
    justify-content: space-between;
    font-weight: bold;
    font-size: 16px;
    margin-bottom: 12px;
    color: #2c3e50;
  }

  .order-id {
    color: #7f8c8d;
    font-size: 14px;
  }

  .order-info {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 16px;
    font-size: 14px;
  }

  .order-details {
    background-color: #ecf0f1;
    border-radius: 6px;
    padding: 8px;
    font-size: 13px;
  }

  table.products-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 12px;
  }

  .products-table th,
  .products-table td {
    padding: 10px;
    border: 1px solid #bdc3c7;
    text-align: left;
  }

  .total-value {
    font-weight: bold;
    margin-top: 10px;
    text-align: right;
  }

  .status-controls {
    margin-top: 10px;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .status {
    font-size: 14px;
    margin-top: 8px;
  }

  .delivered {
    color: green;
    font-weight: bold;
  }

  #map {
    height: 400px;
    margin-top: 20px;
  }

  .view-location-btn {
    background-color: #3498db;
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
    margin-bottom: 12px;
  }

  .view-location-btn:hover {
    background-color: #2980b9;
  }
</style>
