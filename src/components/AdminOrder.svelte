<script>
    import { onMount } from "svelte";
    import { browser } from "$app/environment";
    import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
    import { db } from "$lib/firebaseConfig"; // Import your Firebase configuration
    import { writable } from "svelte/store";
    import "leaflet/dist/leaflet.css";
  
    let orders = writable([]);
    let selectedLocation = null;
    let map;
    let L;
    let currentMarker = null; // Store the current marker
  
    // Fetch orders from Firestore
    async function fetchOrders() {
      const querySnapshot = await getDocs(collection(db, "orders"));
      let ordersArray = [];
      querySnapshot.forEach((doc) => {
        ordersArray.push({ id: doc.id, ...doc.data() });
      });
      orders.set(ordersArray);
    }
  
    // Show location on the map
    function showLocation(coords) {
      selectedLocation = coords;
      if (map) {
        const [lat, lng] = coords;
        // Remove the previous marker if it exists
        if (currentMarker) {
          map.removeLayer(currentMarker);
        }
        // Add new marker to the map
        currentMarker = L.marker([lat, lng]).addTo(map).bindPopup("User Location").openPopup();
        map.setView([lat, lng], 16); // Set the view to the user's location
      }
    }
  
    // Mark order as delivered
    async function markAsDelivered(orderId) {
      try {
        const orderDocRef = doc(db, "orders", orderId);
        await updateDoc(orderDocRef, {
          status: "delivered"
        });
        fetchOrders();
        alert("Order marked as delivered!");
      } catch (error) {
        console.error("Error updating order: ", error);
        alert("Failed to update order status. Please try again.");
      }
    }
  
    // Mark order as pending
    async function markAsPending(orderId) {
      try {
        const orderDocRef = doc(db, "orders", orderId);
        await updateDoc(orderDocRef, {
          status: "pending"
        });
        fetchOrders();
        alert("Order marked as pending!");
      } catch (error) {
        console.error("Error updating order: ", error);
        alert("Failed to update order status. Please try again.");
      }
    }
  
    onMount(async () => {
      if (browser) {
        L = await import("leaflet");
      }
  
      fetchOrders();
  
      // Initialize the map
      map = L.map("map").setView([27.665371, 85.331184], 2); // Default view
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
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
          <div class="order-details">Phone: {order.orderPhoneNumber}</div>
          <div class="order-details">Email: {order.orderEmail}</div>
          <div class="order-details">Order Date: {order.orderDate} - {order.orderDay}</div>
          <div class="order-details">Order Time: {order.orderTime}</div>
          <div class="order-details">Delivery Time: {order.orderDeliveryTime}</div>
          <div class="order-details">Distance: {order.orderDistance} km</div>
          <div class="order-details">Location: {order.orderLocation}</div>
        </div>
  
        <button class="view-location-btn" on:click={() => showLocation(order.orderLocationCoords)}>View Location</button>
  
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
                <td>{product.price}</td>
                <td>{product.quantity}</td>
                <td>{product.price * product.quantity}</td>
              </tr>
            {/each}
          </tbody>
        </table>
  
        <div class="total-value">
          Total Order Value: Rs. {order.orderProducts.reduce(
            (total, product) => total + product.price * product.quantity,
            0
          )}
        </div>
  
        {#if order.status === "delivered"}
          <div class="status delivered">Status: Delivered</div>
          <button class="pending-btn" on:click={() => markAsPending(order.id)}>Mark as Pending</button>
        {:else}
          <button class="deliver-btn" on:click={() => markAsDelivered(order.id)}>Mark as Delivered</button>
        {/if}
      </div>
    {/each}
  {/if}
  
  <div id="map"></div>
  
  <style>
    .order-card {
      background-color: #fff;
      border-radius: 12px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      padding: 16px;
      margin-bottom: 20px;
      font-family: Arial, sans-serif;
      transition: transform 0.2s ease;
    }
  
    .order-header {
      display: flex;
      justify-content: space-between;
      font-weight: bold;
      font-size: 16px;
      margin-bottom: 12px;
    }
  
    .order-id {
      color: #6c757d;
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
      background-color: #f8f9fa;
      border-radius: 6px;
      padding: 8px;
    }
  
    table.products-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }
  
    .products-table th, .products-table td {
      padding: 8px;
      border: 1px solid #dee2e6;
      text-align: left;
    }
  
    .products-table th {
      background-color: #e9ecef;
      font-weight: bold;
    }
  
    .total-value {
      font-size: 16px;
      font-weight: bold;
      margin-top: 12px;
      text-align: right;
    }
  
    .view-location-btn {
      background-color: #007bff;
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 6px;
      cursor: pointer;
      margin-top: 10px;
    }
  
    .deliver-btn, .pending-btn {
      background-color: #28a745;
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 6px;
      cursor: pointer;
    }
  
    .status {
      font-size: 14px;
      margin-top: 12px;
      padding: 6px 10px;
      border-radius: 6px;
      font-weight: bold;
    }
  
    .delivered {
      background-color: #28a745;
      color: white;
    }
  
    #map {
      height: 300px;
      margin-top: 16px;
    }
  
    button:hover {
      opacity: 0.9;
    }
  </style>
  