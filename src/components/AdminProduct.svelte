<script>
    import { onMount } from "svelte";
    import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";
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
    let editingProductId = null;
    let isEditing = false;
    let currentImageUrl = "";

    onMount(async () => {
        await fetchProducts();
    });

    const fetchProducts = async () => {
        const querySnapshot = await getDocs(collection(db, "products"));
        products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    };

    const handleImageChange = (e) => {
        imageFile = e.target.files[0];
    };

    const uploadProduct = async () => {
        if (!productName || !price || !category || !stock || (!imageFile && !isEditing)) {
            uploadStatus = "Please fill all fields and select an image.";
            return;
        }

        try {
            let imageUrl = currentImageUrl;

            // Upload a new image if a new file is selected
            if (imageFile) {
                const storageRef = ref(storage, `products/${imageFile.name}`);
                await uploadBytes(storageRef, imageFile);
                imageUrl = await getDownloadURL(storageRef);
            }

            if (isEditing) {
                // Update the existing product
                const productRef = doc(db, "products", editingProductId);
                await updateDoc(productRef, {
                    productName,
                    price: Number(price),
                    discountedPrice: Number(discountedPrice),
                    category,
                    stock: Number(stock),
                    imageUrl
                });
                uploadStatus = "Product updated successfully!";
            } else {
                // Add a new product
                await addDoc(collection(db, "products"), {
                    productName,
                    price: Number(price),
                    discountedPrice: Number(discountedPrice),
                    category,
                    stock: Number(stock),
                    imageUrl,
                    featured: false,
                    dailyEssential: false
                });
                uploadStatus = "Product uploaded successfully!";
            }

            resetForm();
            await fetchProducts();
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

    const toggleFeatured = async (product) => {
        const productRef = doc(db, "products", product.id);
        await updateDoc(productRef, { featured: !product.featured });
        await fetchProducts();
    };

    const toggleDailyEssential = async (product) => {
        const productRef = doc(db, "products", product.id);
        await updateDoc(productRef, { dailyEssential: !product.dailyEssential });
        await fetchProducts();
    };

    // Separate arrays for featured and daily essential products
    $: featuredProducts = products.filter(product => product.featured);
    $: dailyEssentials = products.filter(product => product.dailyEssential);
</script>

<div class="admin-panel">
    <h1>{isEditing ? 'Edit Product' : 'Upload Product'}</h1>
    <div class="form">
        <input type="text" bind:value={productName} placeholder="Product Name" />
        <input type="text" bind:value={price} placeholder="Price" />
        <input type="text" bind:value={discountedPrice} placeholder="Discounted Price" />
        <input type="text" bind:value={category} placeholder="Category" />
        <input type="text" bind:value={stock} placeholder="Stock" />
        <input type="file" on:change={handleImageChange} />
        {#if currentImageUrl}
            <div class="current-image">
                <p>Current Image:</p>
                <img src={currentImageUrl} alt="Current product image" />
            </div>
        {/if}
        <button on:click={uploadProduct}>{isEditing ? 'Update Product' : 'Upload Product'}</button>
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
                        <td><img src={product.imageUrl} alt={product.productName} /></td>
                        <td>{product.productName}</td>
                        <td>Rs. {product.price}</td>
                        <td>Rs. {product.discountedPrice}</td>
                        <td>{product.category}</td>
                        <td>{product.stock}</td>
                        <td>
                            <button class="edit-btn" on:click={() => editProduct(product)}>Edit</button>
                            <button class="toggle-btn" on:click={() => toggleFeatured(product)}>
                                {product.featured ? 'Remove from Featured' : 'Add to Featured'}
                            </button>
                            <button class="toggle-btn" on:click={() => toggleDailyEssential(product)}>
                                {product.dailyEssential ? 'Remove from Daily Essentials' : 'Add to Daily Essentials'}
                            </button>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>

    <div class="featured-products">
        <h2>Featured Products</h2>
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
                        <td><img src={product.imageUrl} alt={product.productName} /></td>
                        <td>{product.productName}</td>
                        <td>Rs. {product.price}</td>
                        <td>Rs. {product.discountedPrice}</td>
                        <td>{product.category}</td>
                        <td>{product.stock}</td>
                        <td>
                            <button class="edit-btn" on:click={() => editProduct(product)}>Edit</button>
                            <button class="toggle-btn" on:click={() => toggleFeatured(product)}>
                                Remove
                            </button>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>

    <div class="daily-essentials">
        <h2>Daily Essentials</h2>
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
                {#each dailyEssentials as product}
                    <tr>
                        <td><img src={product.imageUrl} alt={product.productName} /></td>
                        <td>{product.productName}</td>
                        <td>Rs. {product.price}</td>
                        <td>Rs. {product.discountedPrice}</td>
                        <td>{product.category}</td>
                        <td>{product.stock}</td>
                        <td>
                            <button class="edit-btn" on:click={() => editProduct(product)}>Edit</button>
                            <button class="toggle-btn" on:click={() => toggleDailyEssential(product)}>
                                Remove
                            </button>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
</div>

<style>
    .admin-panel {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
    }

    h1, h2 {
        text-align: center;
    }

    .form {
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: 400px;
        margin: 0 auto 20px;
    }

    input[type="text"], input[type="file"], button {
        padding: 10px;
        font-size: 16px
    }

button {
    background-color: #4CAF50;
    color: white;
    border: none;
    cursor: pointer;
    font-weight: bold;
}

button:hover {
    background-color: #45a049;
}

.product-list,
.featured-products,
.daily-essentials {
    margin-top: 30px;
}

table {
    width: 100%;
    border-collapse: collapse;
}

table, th, td {
    border: 1px solid #ddd;
}

th, td {
    padding: 10px;
    text-align: left;
}

th {
    background-color: #f2f2f2;
}

.edit-btn, .toggle-btn {
    padding: 5px 10px;
    cursor: pointer;
    background-color: #2196F3;
    color: white;
    border: none;
    margin: 2px;
}

.toggle-btn {
    background-color: #f39c12;
}

.edit-btn:hover, .toggle-btn:hover {
    opacity: 0.8;
}

img {
    max-width: 100px;
    max-height: 100px;
}

.current-image {
    text-align: center;
}

.current-image img {
    max-width: 150px;
    max-height: 150px;
    margin-top: 10px;
}

p {
    color: #4CAF50;
    text-align: center;
}
</style>
