<script>
    import { onMount } from "svelte";
    import {
        collection,
        addDoc,
        getDocs,
        updateDoc,
        doc,
        getDoc,
        deleteDoc,
    } from "firebase/firestore";
    import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
    import { db, storage } from "$lib/firebaseConfig";

    let productName = "";
    let price = "";
    let discountedPrice = "";
    let imageFile = null;
    let category = "";
    let stock = "";
    let uploadStatus = "";
    let products = [];
    let featuredProducts = [];
    let dailyEssentialProducts = [];
    let editingProductId = null;
    let isEditing = false;
    let currentImageUrl = "";

    onMount(async () => {
        await fetchProducts();
        await fetchFeaturedProducts();
        await fetchDailyEssentialProducts();
    });

    const fetchProducts = async () => {
        const querySnapshot = await getDocs(collection(db, "products"));
        products = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
    };

    const fetchFeaturedProducts = async () => {
        const featuredSnapshot = await getDocs(
            collection(db, "featuredProducts"),
        );
        const featuredIds = featuredSnapshot.docs.map(
            (doc) => doc.data().productId,
        );

        featuredProducts = await Promise.all(
            featuredIds.map(async (id) => {
                const productDoc = await getDoc(doc(db, "products", id));
                return { id, ...productDoc.data() };
            }),
        );
    };

    const fetchDailyEssentialProducts = async () => {
        const dailyEssentialsSnapshot = await getDocs(
            collection(db, "dailyEssentials"),
        );
        const dailyEssentialIds = dailyEssentialsSnapshot.docs.map(
            (doc) => doc.data().productId,
        );

        dailyEssentialProducts = await Promise.all(
            dailyEssentialIds.map(async (id) => {
                const productDoc = await getDoc(doc(db, "products", id));
                return { id, ...productDoc.data() };
            }),
        );
    };

    const handleImageChange = (e) => {
        imageFile = e.target.files[0];
    };

    const uploadProduct = async () => {
        if (
            !productName ||
            !price ||
            !category ||
            !stock ||
            (!imageFile && !isEditing)
        ) {
            uploadStatus = "Please fill all fields and select an image.";
            return;
        }

        try {
            let imageUrl = currentImageUrl;

            if (imageFile) {
                const storageRef = ref(storage, `products/${imageFile.name}`);
                await uploadBytes(storageRef, imageFile);
                imageUrl = await getDownloadURL(storageRef);
            }

            if (isEditing) {
                const productRef = doc(db, "products", editingProductId);
                await updateDoc(productRef, {
                    productName,
                    price: Number(price),
                    discountedPrice: Number(discountedPrice),
                    category,
                    stock: Number(stock),
                    imageUrl,
                });
                uploadStatus = "Product updated successfully!";
            } else {
                await addDoc(collection(db, "products"), {
                    productName,
                    price: Number(price),
                    discountedPrice: Number(discountedPrice),
                    category,
                    stock: Number(stock),
                    imageUrl,
                });
                uploadStatus = "Product uploaded successfully!";
            }

            resetForm();
            await fetchProducts();
            await fetchFeaturedProducts();
            await fetchDailyEssentialProducts();
        } catch (error) {
            uploadStatus = "Failed to upload product: " + error.message;
        }
    };

    const editProduct = (product) => {
        editingProductId = product.id;
        productName = product.productName;
        price = product.price;
        discountedPrice = product.discountedPrice;
        category = product.category;
        stock = product.stock;
        currentImageUrl = product.imageUrl;
        isEditing = true;
    };

    const resetForm = () => {
        productName = "";
        price = "";
        discountedPrice = "";
        imageFile = null;
        category = "";
        stock = "";
        currentImageUrl = "";
        uploadStatus = "";
        editingProductId = null;
        isEditing = false;
    };

    const addToFeatured = async (productId) => {
        try {
            await addDoc(collection(db, "featuredProducts"), { productId });
            await fetchFeaturedProducts();
        } catch (error) {
            console.error("Failed to add to featured products:", error);
        }
    };

    const removeFromFeatured = async (productId) => {
        try {
            const featuredSnapshot = await getDocs(
                collection(db, "featuredProducts"),
            );
            const docToDelete = featuredSnapshot.docs.find(
                (doc) => doc.data().productId === productId,
            );
            if (docToDelete) {
                await deleteDoc(doc(db, "featuredProducts", docToDelete.id));
                await fetchFeaturedProducts();
            }
        } catch (error) {
            console.error("Failed to remove from featured products:", error);
        }
    };

    const isProductFeatured = (productId) => {
        return featuredProducts.some((product) => product.id === productId);
    };

    const addToDailyEssentials = async (productId) => {
        try {
            await addDoc(collection(db, "dailyEssentials"), { productId });
            await fetchDailyEssentialProducts();
        } catch (error) {
            console.error("Failed to add to daily essentials:", error);
        }
    };

    const removeFromDailyEssentials = async (productId) => {
        try {
            const dailyEssentialsSnapshot = await getDocs(
                collection(db, "dailyEssentials"),
            );
            const docToDelete = dailyEssentialsSnapshot.docs.find(
                (doc) => doc.data().productId === productId,
            );
            if (docToDelete) {
                await deleteDoc(doc(db, "dailyEssentials", docToDelete.id));
                await fetchDailyEssentialProducts();
            }
        } catch (error) {
            console.error("Failed to remove from daily essentials:", error);
        }
    };

    const isProductInDailyEssentials = (productId) => {
        return dailyEssentialProducts.some(
            (product) => product.id === productId,
        );
    };
</script>

<div class="admin-panel">
    <h1>{isEditing ? "Edit Product" : "Upload Product"}</h1>
    <div class="form">
        <input
            type="text"
            bind:value={productName}
            placeholder="Product Name"
        />
        <input type="number" bind:value={price} placeholder="Price" />
        <input
            type="number"
            bind:value={discountedPrice}
            placeholder="Discounted Price"
        />
        <input type="text" bind:value={category} placeholder="Category" />
        <input type="number" bind:value={stock} placeholder="Stock" />
        <input type="file" on:change={handleImageChange} />
        {#if currentImageUrl}
            <div class="current-image">
                <p>Current Image:</p>
                <img src={currentImageUrl} alt="Current product image" />
            </div>
        {/if}
        <button on:click={uploadProduct}
            >{isEditing ? "Update Product" : "Upload Product"}</button
        >
        <p>{uploadStatus}</p>
    </div>

    <div class="product-list">
        <h2>Product List</h2>
        <table>
            <thead>
                <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Discounted Price</th>
                    <th>Category</th>
                    <th>Stock</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {#each products as product}
                    <tr>
                        <td
                            ><img
                                src={product.imageUrl}
                                alt={product.productName}
                            /></td
                        >
                        <td>{product.productName}</td>
                        <td>Rs. {product.price}</td>
                        <td>Rs. {product.discountedPrice}</td>
                        <td>{product.category}</td>
                        <td>{product.stock}</td>
                        <td>
                            <button
                                class="edit-btn"
                                on:click={() => editProduct(product)}
                                >Edit</button
                            >
                            <button
                                class="edit-btn"
                                on:click={() => addToFeatured(product.id)}
                                disabled={isProductFeatured(product.id)}
                                >Add to Featured</button
                            >
                            <button
                                class="edit-btn"
                                on:click={() =>
                                    addToDailyEssentials(product.id)}
                                disabled={isProductInDailyEssentials(
                                    product.id,
                                )}>Add to Daily Essentials</button
                            >
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>

    <div class="featured-product-list">
        <h2>Featured Products List</h2>
        <table>
            <thead>
                <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Discounted Price</th>
                    <th>Category</th>
                    <th>Stock</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {#each featuredProducts as product}
                    <tr>
                        <td
                            ><img
                                src={product.imageUrl}
                                alt={product.productName}
                            /></td
                        >
                        <td>{product.productName}</td>
                        <td>Rs. {product.price}</td>
                        <td>Rs. {product.discountedPrice}</td>
                        <td>{product.category}</td>
                        <td>{product.stock}</td>
                        <td>
                            <button
                                class="edit-btn"
                                on:click={() => editProduct(product)}
                                >Edit</button
                            >
                            <button
                                class="edit-btn"
                                on:click={() => removeFromFeatured(product.id)}
                                >Remove</button
                            >
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>

    <div class="daily-essential-list">
        <h2>Daily Essentials List</h2>
        <table>
            <thead>
                <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Discounted Price</th>
                    <th>Category</th>
                    <th>Stock</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {#each dailyEssentialProducts as product}
                    <tr>
                        <td
                            ><img
                                src={product.imageUrl}
                                alt={product.productName}
                            /></td
                        >
                        <td>{product.productName}</td>
                        <td>Rs. {product.price}</td>
                        <td>Rs. {product.discountedPrice}</td>
                        <td>{product.category}</td>
                        <td>{product.stock}</td>
                        <td>
                            <button
                                class="edit-btn"
                                on:click={() => editProduct(product)}
                                >Edit</button
                            >
                            <button
                                class="edit-btn"
                                on:click={() =>
                                    removeFromDailyEssentials(product.id)}
                                >Remove</button
                            >
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
</div>

<style>
    .admin-panel {
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
        background-color: #f2f2f2; /* Lighter background color */
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    h1,
    h2 {
        text-align: center;
        font-size: 24px;
        margin-bottom: 15px; /* Reduced margin */
        color: #333;
    }

    .form {
        display: grid;
        grid-template-columns: 1fr;
        gap: 8px; /* Reduced gap */
        margin-bottom: 20px; /* Reduced margin */
    }

    input[type="text"],
    input[type="number"],
    input[type="file"] {
        padding: 8px; /* Reduced padding */
        font-size: 14px; /* Smaller font size */
        border: 1px solid #ccc;
        border-radius: 4px;
    }

    button {
        padding: 10px; /* Adjusted padding */
        font-size: 14px; /* Smaller font size */
        background-color: #4caf50;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        width: 100%; /* Full width */
        margin-top: 10px; /* Added margin for spacing */
    }

    button[disabled] {
        background-color: #999;
    }

    .product-list,
    .featured-product-list {
        margin-top: 30px; /* Reduced margin */
    }

    table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 15px; /* Reduced margin */
    }

    th,
    td {
        border: 1px solid #ddd;
        padding: 8px; /* Reduced padding */
        text-align: left;
        font-size: 14px; /* Smaller font size */
    }

    img {
        width: 50px; /* Smaller image size */
        height: 50px; /* Smaller image size */
        object-fit: cover;
    }

    .edit-btn,
    .add-btn,
    .remove-btn {
        background-color: #2196f3; /* Blue background for edit and add buttons */
        color: white;
        padding: 6px 12px; /* Adjusted padding */
        font-size: 12px; /* Smaller font size */
        border: none; /* Removed border */
        border-radius: 4px; /* Rounded corners */
        cursor: pointer;
        margin: 5px; /* Added margin for spacing */
    }

    .add-btn {
        background-color: #4caf50; /* Green background for add button */
    }

    .remove-btn {
        background-color: #f44336; /* Red background for remove button */
    }

    .current-image img {
        max-width: 80px; /* Adjusted max-width */
        margin-top: 10px;
    }
</style>
