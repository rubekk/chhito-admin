<script>
    import { onMount } from "svelte";
    import { collection, addDoc, getDocs, updateDoc, doc, getDoc } from "firebase/firestore";
    import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
    import {  db, storage } from "$lib/firebaseConfig";

    let productName = "";
    let price = "";
    let discountedPrice = "";
    let imageFile = null;
    let category = "";
    let stock = "";
    let uploadStatus = "";
    let products = [];
    let editingProductId = null;

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
        if (!productName || !price || !category || !stock || !imageFile) {
            uploadStatus = "Please fill all fields and select an image.";
            return;
        }

        try {
            const storageRef = ref(storage, `products/${imageFile.name}`);
            await uploadBytes(storageRef, imageFile);
            const imageUrl = await getDownloadURL(storageRef);

            await addDoc(collection(db, "products"), {
                productName,
                price: Number(price),
                discountedPrice: Number(discountedPrice),
                category,
                stock: Number(stock),
                imageUrl
            });

            uploadStatus = "Product uploaded successfully!";
            resetForm();
            await fetchProducts(); 
        } catch (error) {
            uploadStatus = "Failed to upload product: " + error.message;
        }
    };

    const resetForm = () => {
        productName = "";
        price = "";
        discountedPrice = "";
        imageFile = null;
        category = "";
        stock = "";
        uploadStatus = "";
        editingProductId = null;
    };

    const editProduct = (product) => {
        productName = product.productName;
        price = product.price;
        discountedPrice = product.discountedPrice;
        category = product.category;
        stock = product.stock;
        editingProductId = product.id;
    };

    const updateProduct = async () => {
        if (!editingProductId) return;

        try {
            let imageUrl;

            if (imageFile) {
                const storageRef = ref(storage, `products/${imageFile.name}`);
                await uploadBytes(storageRef, imageFile);
                imageUrl = await getDownloadURL(storageRef);
            } else {
                const productRef = doc(db, "products", editingProductId);
                const productSnapshot = await getDoc(productRef);
                imageUrl = productSnapshot.data().imageUrl;
            }

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
            resetForm();
            await fetchProducts(); 
        } catch (error) {
            uploadStatus = "Failed to update product: " + error.message;
        }
    };
</script>

<div class="admin-panel">
    <h1>Admin Panel - Upload Product</h1>

    <div class="input-group">
        <input type="text" placeholder="Product Name" bind:value={productName} />
    </div>

    <div class="input-row">
        <div class="input-group">
            <input type="number" placeholder="Price" bind:value={price} />
        </div>
        <div class="input-group">
            <input type="number" placeholder="Discounted Price" bind:value={discountedPrice} />
        </div>
    </div>

    <div class="input-group">
        <input type="text" placeholder="Category" bind:value={category} />
    </div>

    <div class="input-row">
        <div class="input-group">
            <input type="number" placeholder="Stock" bind:value={stock} />
        </div>
        <div class="input-group">
            <input type="file" accept="image/*" on:change={handleImageChange} />
        </div>
    </div>

    <div class="button-group">
        {#if editingProductId}
            <button on:click={updateProduct}>Update Product</button>
        {:else}
            <button on:click={uploadProduct}>Upload Product</button>
        {/if}
    </div>

    <div class="status">
        <p>{uploadStatus}</p>
    </div>
</div>

<div class="product-list">
    <h2>Product List</h2>
    <table>
        <thead>
            <tr>
                <th>Product Image</th>
                <th>Product Name</th>
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
                    <td><img src={product.imageUrl} alt={product.productName} style="width: 60px; height: auto;" /></td>
                    <td>{product.productName}</td>
                    <td>Rs. {product.price}</td>
                    <td>Rs. {product.discountedPrice}</td>
                    <td>{product.category}</td>
                    <td>{product.stock}</td>
                    <td>
                        <button on:click={() => editProduct(product)}>Edit</button>
                    </td>
                </tr>
            {/each}
        </tbody>
    </table>
</div>


<style>
    .admin-panel {
        max-width: 600px;
        margin: 3rem auto;
        padding: 2rem;
        background-color: #f7f7f7;
        border-radius: 12px;
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
        font-family: 'Roboto', sans-serif;
        color: #333;
    }

    h1 {
        text-align: center;
        color: #2c3e50;
        margin-bottom: 2.5rem;
        font-size: 1.8rem;
        font-weight: bold;
    }

    .input-group {
        margin-bottom: 1.25rem;
    }

    .input-row {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
    }
    input {
        width: 100%;
        padding: 0.9rem;
        font-size: 1rem;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-sizing: border-box;
        transition: border-color 0.3s ease;
        background-color: #fff;
        color: #333;
    }
    input:focus {
        border-color: #2980b9;
        outline: none;
        box-shadow: 0 0 8px rgba(41, 128, 185, 0.3);
    }
    .button-group {
        text-align: center;
    }
    button {
        padding: 0.75rem 2.5rem;
        background-color: #e74c3c;
        color: #fff;
        border: none;
        border-radius: 50px;
        cursor: pointer;
        font-size: 1.1rem;
        font-weight: bold;
        transition: background-color 0.3s ease, transform 0.2s ease;
    }
    button:hover {
        background-color: #c0392b;
        transform: scale(1.05);
    }
    .status p {
        text-align: center;
        font-size: 1rem;
        color: green;
        margin-top: 1.5rem;
    }

    .product-list {
        max-width: 1000px;
        margin: 2rem auto;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        font-size: 1rem;
        font-family: 'Roboto', sans-serif;
    }

    th, td {
        padding: 0.75rem 1rem;
        text-align: left;
        border: 1px solid #ddd;
    }

    th {
        background-color: #2980b9;
        color: white;
    }

    img {
        max-width: 100%;
        height: auto;
        border-radius: 4px;
    }

    td img {
        display: block;
        margin: 0 auto;
    }

    td button {
        background-color: #3498db;
        color: #fff;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        border: none;
        cursor: pointer;
    }

    td button:hover {
        background-color: #2980b9;
    }
</style>
