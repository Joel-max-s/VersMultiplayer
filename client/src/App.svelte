<script>
	import Login from "./components/Login.svelte";
	import Gamescreen from "./components/Gamescreen.svelte";
	import Adminscreen from "./components/AdminScreen.svelte";
	import { User, socket } from "./stores";
	
	const client = io()
	$socket = client
</script>


<main class="container">
	{#if !$User.loggedIn}
	<div class="login">
		<Login/>
	</div>
		
	{:else if $User.type==="user"}
	<div class="gamescreen">
		<Gamescreen />
		<div class="break"></div>
		<p>{$User.username}, {$User.type}</p>
	</div>
	
	{:else if $User.type==="admin"}
	<div class="adminscreen">
		<Adminscreen />
		<div class="break"></div>
		<p>{$User.type}</p>
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