<script>
    import { goto } from "$app/navigation";
    import AdminProduct from "./../components/AdminProduct.svelte";
    import AdminOrder from "./../components/AdminOrder.svelte";

    const gotoOrders = () => goto("/orders");
</script>

<button on:click={gotoOrders}>View Orders</button>
<AdminProduct />