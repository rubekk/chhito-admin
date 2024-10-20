<script>
    import { onMount } from 'svelte';
    import { browser } from "$app/environment";
    import { writable } from 'svelte/store';
    import { db, rtdb } from '$lib/firebaseConfig';
    import { collection, getDocs, getDoc, doc } from 'firebase/firestore';
    import { ref, set, onValue } from 'firebase/database';
    import 'leaflet/dist/leaflet.css';

    let orderId = '';
    let userLocation = null;
    let riderLocation = null;
    let map;
    let L;
    let userMarker = null;
    let riderMarker = null;
    let intervalId = null; // Variable to store the interval ID
    let trackingActive = false; // Variable to track if the tracking is active

    const fetchOrderLocation = async (id) => {
        const orderDoc = doc(db, 'orders', id);
        const orderSnapshot = await getDoc(orderDoc);
        if (orderSnapshot.exists()) {
            userLocation = orderSnapshot.data().orderLocationCoords;
            // Start tracking the rider's location after fetching order details
            startRiderLocationTracking(id);
        } else {
            alert('Order not found.');
        }
    };

    const startRiderLocationTracking = (orderId) => {
        // Create a reference to the rider's location in Realtime Database
        const riderRef = ref(rtdb, `riders/${orderId}`);
        
        // Update the rider's location every 15 seconds
        const updateRiderLocation = () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((position) => {
                    const { latitude, longitude } = position.coords;
                    set(riderRef, { location: [latitude, longitude] }); // Store the rider's location
                });
            }
        };

        // Set an interval to update the rider's location
        intervalId = setInterval(updateRiderLocation, 15000); // Update every 15 seconds

        // Subscribe to rider's location updates from Firebase
        onValue(riderRef, (snapshot) => {
            if (snapshot.exists()) {
                riderLocation = snapshot.val().location; // Fetch rider location
                updateMap();
            }
        });

        trackingActive = true; // Set tracking active
    };

    const stopRiderLocationTracking = () => {
        if (intervalId) {
            clearInterval(intervalId); // Clear the interval
            intervalId = null; // Reset interval ID
        }
        trackingActive = false; // Set tracking inactive
    };

    const updateMap = () => {
        if (map) {
            if (userMarker) {
                map.removeLayer(userMarker); // Remove previous user marker
            }
            if (riderMarker) {
                map.removeLayer(riderMarker); // Remove previous rider marker
            }

            // Add new markers
            if (userLocation) {
                userMarker = L.marker([userLocation[0], userLocation[1]]).addTo(map).bindPopup("User Location").openPopup();
            }
            if (riderLocation) {
                riderMarker = L.marker([riderLocation[0], riderLocation[1]]).addTo(map).bindPopup("Rider Location").openPopup();
            }

            // Center map to user location if available
            if (userLocation) {
                map.setView([userLocation[0], userLocation[1]], 14);
            }
        }
    };

    const trackOrder = () => {
        if (orderId) {
            // Request geolocation here, only in response to user gesture
            navigator.geolocation.getCurrentPosition((position) => {
                const { latitude, longitude } = position.coords;
                userLocation = [latitude, longitude]; // Save user location
                
                // Now, fetch the order location and start tracking rider
                fetchOrderLocation(orderId);
            }, (error) => {
                alert('Geolocation permission denied or not available.');
            });
        } else {
            alert('Please enter a valid Order ID.');
        }
    };

    const confirmDelivery = () => {
        stopRiderLocationTracking(); // Stop tracking rider location
        alert('Order has been confirmed as delivered.');
        // You can also add any other logic here to update the order status in Firestore if needed
    };

    onMount(async () => {
        if (browser) {
            L = await import('leaflet');
            map = L.map('map').setView([27.665371, 85.331184], 14); // Default view
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            }).addTo(map);
        }
    });
</script>

<div class="tracker">
    <h1>Order Tracker</h1>
    <input type="text" placeholder="Enter Order ID" bind:value={orderId} />
    <button on:click={trackOrder}>Track Order</button>
    <button on:click={confirmDelivery} disabled={!trackingActive}>Confirm Delivery</button>
    <div id="map" style="height: 400px; margin-top: 20px;"></div>
</div>

<style>
    .tracker {
        max-width: 600px;
        margin: auto;
        text-align: center;
        padding: 20px;
    }

    input {
        padding: 10px;
        width: calc(100% - 22px);
        border: 1px solid #ccc;
        border-radius: 5px;
    }

    button {
        padding: 10px 20px;
        margin-top: 10px;
        border: none;
        border-radius: 5px;
        background-color: #28a745;
        color: white;
        cursor: pointer;
    }

    button:hover {
        background-color: #218838;
    }

    button:disabled {
        background-color: #ccc; /* Change color for disabled state */
        cursor: not-allowed; /* Change cursor for disabled button */
    }
</style>
