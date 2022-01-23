<script>
    import { verse, socket, bible } from "../stores";
    import Button from "./Button.svelte";

    const handleSubmit = () => null;

    //probably refactor
    $socket.on("startedVerse", (v) => {
        console.log(v);
        $verse = v;
    });

    $socket.on("bibleProps", (props) => {
        bible.update(() => props)
        fillBooks()
        console.log(bible)
    })

    

    

    function fillBooks() {
        console.log('fillBooks')
        clearSelect(document.getElementById("selectBook"));
        clearSelect(document.getElementById("selectChapter"));
        clearSelect(document.getElementById("selectVerse"));
        var select = document.getElementById("selectBook");
        for (let book in $bible) {
            var opt = $bible[book].name;
            var el = document.createElement("option");
            el.textContent = opt;
            el.value = book;
            select.appendChild(el);
        }
        var bOption = document.getElementById("bookOption");
        bOption.value = 0;
    }

    function generateKapitel() {
        console.log('fillChapter')

        clearSelect(document.getElementById("selectChapter"));
        clearSelect(document.getElementById("selectVerse"));
        var book = document.getElementById("selectBook").value;
        var verse = document.getElementById("selectChapter");
        for (let i = 0; i < $bible[book].chapterLength.length; i++) {
            var opt = i + 1;
            var el = document.createElement("option");
            el.textContent = opt;
            el.value = i;
            verse.appendChild(el);
        }
    }

    function generateVers() {
        console.log('fillVerse')

        clearSelect(document.getElementById("selectVerse"));
        var buch = document.getElementById("selectBook").value;
        var kapitel = document.getElementById("selectChapter").value;
        var vers = document.getElementById("selectVerse");
        for (let i = 0; i < $bible[buch].chapterLength[kapitel]; i++) {
            var opt = i + 1;
            var el = document.createElement("option");
            el.textContent = opt;
            el.value = i;
            vers.appendChild(el);
        }
    }

    function clearSelect(selected) {
        for (var i = selected.length; i > 0; i--) {
            selected.remove(i);
        }
    }
</script>

<p class="versText">
    {$verse}
</p>
<p class="zeit">
    Hier steht später die Zeit die noch übrig ist (vllt mit Balken?)
</p>
<progress id="fortschritt" max="100" value="20" />
<form on:submit|preventDefault={handleSubmit}>
    <div class="input-group">
        <select name="cars" id="selectBook" on:change={() => generateKapitel()}>
            <option value="0" id="bookOption">Buch</option>
        </select>
        <select name="cars" id="selectChapter" on:change={() => generateVers()}>
            <option value="0">Kapitel</option>
        </select>
        <select name="cars" id="selectVerse">
            <option value="0">Vers</option>
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
