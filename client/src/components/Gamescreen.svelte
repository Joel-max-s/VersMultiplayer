<script>
   import { LoreIpsum } from "../stores";
   import Button from "./Button.svelte";

   const handleSubmit = () => null
</script>

<p class="versText">
    {$LoreIpsum}
</p>
<p class="zeit">Hier steht später die Zeit die noch übrig ist (vllt mit Balken?)</p>
<progress id="fortschritt" max='100' value="20"></progress>
<form on:submit|preventDefault={handleSubmit}>
    <div class="input-group">
        <select name="cars" id="cars">
            <option value="Buch">Buch</option>
            <option value="saab">Saab</option>
            <option value="mercedes">Mercedes</option>
            <option value="audi">Audi</option>
          </select>
          <select name="cars" id="cars">
            <option value="Kapitel">Kapitel</option>
            <option value="saab">Saab</option>
            <option value="mercedes">Mercedes</option>
            <option value="audi">Audi</option>
          </select>
          <select name="cars" id="cars">
            <option value="Vers1">Vers</option>
            <option value="Vers2">Vers</option>
            <option value="Vers3">Vers</option>
            <option value="Vers4">Vers</option>
            <option value="Vers5">Vers</option>
            <option value="Vers6">Vers</option>
            <option value="Vers7">Vers</option>
            <option value="Vers8">Vers</option>
            <option value="Vers9">Vers</option>
            <option value="Vers10">Vers</option>
            <option value="Vers11">Vers</option>
            <option value="Vers12">Vers</option>
            <option value="Vers13">Vers</option>
            <option value="Vers14">Vers</option>
            <option value="Vers15">Vers</option>
            <option value="Vers16">Vers</option>
            <option value="Vers17">Vers</option>
            <option value="Vers18">Vers</option>
            <option value="Vers19">Vers</option>
            <option value="Vers20">Vers</option>
          </select>
          <Button type="submit">Send</Button>
    </div>
</form>

<style>
    #fortschritt {
        width: 100%;
        height: calc(1vw + 1vh);
    }

    p {
      font-size: calc(1.5vw + 2vh);
    }


</style>