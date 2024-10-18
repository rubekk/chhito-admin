<script>
    import { goto } from "$app/navigation";
    import AdminOrder from "./../../components/AdminOrder.svelte";

    const goBack = () => goto("/");
</script>

<button on:click={goBack}>Back</button>
<AdminOrder />