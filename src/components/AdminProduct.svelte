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

    <div class="form-section">
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
            <div class="input-group file-input">
                <input type="file" accept="image/*" on:change={handleImageChange} />
            </div>
        </div>

        <div class="button-group">
            {#if editingProductId}
                <button class="update-btn" on:click={updateProduct}>Update Product</button>
            {:else}
                <button class="upload-btn" on:click={uploadProduct}>Upload Product</button>
            {/if}
        </div>

        <div class="status">
            <p>{uploadStatus}</p>
        </div>
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
                    <td><img src={product.imageUrl} alt={product.productName} /></td>
                    <td>{product.productName}</td>
                    <td>Rs. {product.price}</td>
                    <td>Rs. {product.discountedPrice}</td>
                    <td>{product.category}</td>
                    <td>{product.stock}</td>
                    <td>
                        <button class="edit-btn" on:click={() => editProduct(product)}>Edit</button>
                    </td>
                </tr>
            {/each}
        </tbody>
    </table>
</div>

<style>
    /* Updated styling */
    .admin-panel {
        max-width: 700px;
        margin: 3rem auto;
        padding: 2.5rem;
        background: linear-gradient(135deg, #f0f4f8, #dfe9f3);
        border-radius: 15px;
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
        text-align: center;
        font-family: 'Arial', sans-serif;
        color: #34495e;
    }

    h1 {
        color: #34495e;
        font-size: 2rem;
        font-weight: 700;
        margin-bottom: 2rem;
    }

    .form-section {
        padding: 0 1.5rem;
    }

    .input-group, .file-input {
        margin-bottom: 1.5rem;
    }

    .input-row {
        display: flex;
        gap: 1rem;
        justify-content: space-between;
        align-items: center;
    }

    input[type="text"], input[type="number"], input[type="file"] {
        width: 100%;
        padding: 0.8rem;
        border-radius: 8px;
        border: 1px solid #cdd1d4;
        background: #fefefe;
        transition: all 0.3s ease;
        font-size: 1rem;
    }

    input[type="text"]:focus, input[type="number"]:focus, input[type="file"]:focus {
        outline: none;
        border-color: #3498db;
        box-shadow: 0 0 8px rgba(52, 152, 219, 0.3);
    }

    .button-group {
        margin-top: 1.5rem;
    }

    .upload-btn, .update-btn {
        background-color: #3498db;
        color: #fff;
        padding: 0.8rem 2.5rem;
        font-size: 1.1rem;
        border: none;
        border-radius: 30px;
        cursor: pointer;
        transition: background 0.3s ease, transform 0.2s;
    }

    .upload-btn:hover, .update-btn:hover {
        background-color: #2980b9;
        transform: translateY(-2px);
    }

    .status p {
        font-size: 1rem;
        color: green;
        margin-top: 1.2rem;
    }

    .product-list {
        max-width: 900px;
        margin: 2.5rem auto;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        font-family: 'Arial', sans-serif;
    }

    th, td {
        padding: 0.75rem;
        text-align: left;
        border: 1px solid #ddd;
        font-size: 0.9rem;
    }

    th {
        background-color: #3498db;
        color: #fff;
        text-transform: uppercase;
    }

    tr:nth-child(even) {
        background-color: #f9f9f9;
    }

    img {
        width: 50px;
        height: 50px;
        border-radius: 8px;
        display: block;
        margin: 0 auto;
    }

    .edit-btn {
        background-color: #e67e22;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 8px;
        cursor: pointer;
        transition: background 0.3s ease;
    }

    .edit-btn:hover {
        background-color: #d35400;
    }
</style>
