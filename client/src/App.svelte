<script>
	import Login from "./components/Login.svelte";
	import Gamescreen from "./components/Gamescreen.svelte";
	import { User } from "./stores";
</script>


<main class="container">
	{#if !$User.loggedIn}
	<div class="login">
		<Login/>
	</div>
		
	{:else}
	<div class="gamescreen">
		<Gamescreen />
		<div class="break"></div>
		<p>{$User.username}</p>
	</div>
	{/if}
</main>

<style>

	.container {
		display: flex;
		flex-direction: column;
		align-content: center;
		justify-content: center;
	}
	
	.login {
		align-self: center;
		padding-top: 30vh;
		max-width: 30em;
		width: 100%;
	}

	.gamescreen {
		align-self: center;
		max-width: 95%;
		width: 100%;
	}
	
	.break {
		flex-basis: 100%;
		height: 0;
	}
</style>