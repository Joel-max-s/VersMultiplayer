/** TODOs: 
wenn kein Buch ausgewählt ist nix eintragen
Tabelle zum Playlist anzeigen (später auch bearbeiten)
besseres Layout und Design */

var counter = 0;
var verse = [];
var stelle = '';
var versAlsListe = [];
var request = new XMLHttpRequest();
request.open("GET", "de_schlachter-min.json", false);
request.send(null);
var bibel = JSON.parse(request.responseText);
var playlist = []
var auswahlmoeglichkeiten = [['AT', 'Altes Testament'], ['NT', 'Neues Testament'], ["Tora", "5 Bücher Mose"], ['geschichte', 'Geschichtsbücher'], ['Lehre', 'Lehrbücher'], ['Propheten', 'alle Propheten'], ['gPropheten', 'große Propheten'], ['kPropheten', 'kleine Propheten'], ['Evangelien', 'Evangelien'], ['Apg', 'Apostelgeschichte'], ['paul', 'Paulusbriefe'], ['aBriefe', 'andere Briefe'], ['off', 'Offenbarung']]


// Select all checkboxes with the name 'settings' using querySelectorAll.
let gewaehlteBuecher = []

fillBookSelector()
fillBuecher()
fillAuswahlmoeglichkeiten()


function getBooks() {
    var alleBuecher = []
    for (var i = 0; i < bibel.length; i++) {
        alleBuecher.push(bibel[i].name)
    }
    return alleBuecher
}

function fillBookSelector() {
    const bookSelector = document.getElementById("selectBooks")
    var allBooks = getBooks()
    for (var i = 0; i < allBooks.length; i++) {
        var div = document.createElement("div")
        div.className = "bookOpt"
        bookSelector.appendChild(div)
        var oneBook = document.createElement("input")
        oneBook.type = "checkBox"
        oneBook.id = i
        oneBook.value = i
        oneBook.name = "selectBooks"
        div.appendChild(oneBook)
        var label = document.createElement("label")
        label.htmlFor = oneBook.value //allBooks[i].toString().toLowerCase()
        label.innerText = allBooks[i]
        div.appendChild(label)
    }

    // Use Array.forEach to add an event listener to each checkbox.
    var checkboxes = document.querySelectorAll("input[type=checkbox][name=selectBooks]");
    checkboxes.forEach(checkbox => checkbox.addEventListener('change', () => fillBuecher()))
}

function fillBuecher() {
    var checkboxes = document.querySelectorAll("input[type=checkbox][name=selectBooks]");
    checkboxes.forEach(function (checkbox) {
        gewaehlteBuecher =
            Array.from(checkboxes) // Convert checkboxes to an array to use filter and map.
                .filter(i => i.checked) // Use Array.filter to remove unchecked checkboxes.
                .map(i => parseInt(i.value)) // Use Array.map to extract only the checkbox values from the array of objects.
    });

    var select = document.getElementById('buchwaehlen');

    var temp = document.getElementsByClassName('book');
    while (temp[0]) {
        temp[0].parentNode.removeChild(temp[0]);
    }

    for (var i = 0; i < gewaehlteBuecher.length; i++) {
        var opt = bibel[gewaehlteBuecher[i]].name;
        var el = document.createElement("option");
        el.textContent = opt;
        el.value = gewaehlteBuecher[i];
        el.className = 'book';
        select.appendChild(el);
    }
    var bOption = document.getElementById('BuchOption');
    bOption.value = gewaehlteBuecher[0];
}

function generateKapitel() {
    clearSelect(document.getElementById('kapitelwaehlen'));
    clearSelect(document.getElementById('verswaehlen'));
    var buch = document.getElementById('buchwaehlen').value;
    console.log(buch);
    var vers = document.getElementById('kapitelwaehlen');
    for (var i = 0; i < bibel[buch].chapters.length; i++) {
        var opt = i + 1;
        var el = document.createElement("option");
        el.textContent = opt;
        el.value = i;
        vers.appendChild(el);
    }
}

function generateVers() {
    clearSelect(document.getElementById('verswaehlen'));
    var buch = document.getElementById('buchwaehlen').value;
    var kapitel = document.getElementById('kapitelwaehlen').value;
    console.log(vers);
    var vers = document.getElementById('verswaehlen');
    for (var i = 0; i < bibel[buch].chapters[kapitel].length; i++) {
        var opt = i + 1;
        var el = document.createElement("option");
        el.textContent = opt;
        el.value = i;
        vers.appendChild(el);
    }
}

function addToPlaylist() {
    var time = document.getElementById('PlayTime').value
    var selection = gewaehlteBuecher
    var versAsL = [parseInt(document.getElementById('buchwaehlen').value), parseInt(document.getElementById('kapitelwaehlen').value), parseInt(document.getElementById('verswaehlen').value)]
    const pElem = { "zeit": time, "auswahl": selection, "versL": versAsL, "versS": "" }
    console.log(pElem)
    playlist.push(pElem)
    CreateTableFromJSON()
}

function clearSelect(selected) {
    for (var i = selected.length; i > 0; i--) {
        selected.remove(i);
    }
}

function downloadPlaylist() {
    var filename = "ply.json"
    var text = JSON.stringify(playlist)
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

function selAll(all) {
    var checkboxes = document.querySelectorAll("input[type=checkbox][name=selectBooks]");
    checkboxes.forEach(function (checkbox) {
        checkbox.checked = all;
    });
    fillBuecher()
}

function shufflePlaylist() {
    playlist = shuffleArray(playlist)
    CreateTableFromJSON()
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array
}

function fillAuswahlmoeglichkeiten() {
    var select = document.getElementById('buecherwaehlen');
    for (var i = 0; i < auswahlmoeglichkeiten.length; i++) {
        // console.log(i);
        var opt = auswahlmoeglichkeiten[i][1];
        var el = document.createElement("option");
        el.textContent = opt;
        el.value = auswahlmoeglichkeiten[i][0];
        select.appendChild(el);
    }
}

function generateBuecherList() {
    option = document.getElementById('buecherwaehlen').value
    switch (option) {
        case "AT":
            gewaehlteBuecher = spans(0, 38);
            break;
        case "NT":
            gewaehlteBuecher = spans(39, 65);
            break;
        case "Tora":
            gewaehlteBuecher = spans(0, 4);
            break;
        case "geschichte":
            gewaehlteBuecher = spans(5, 16);
            break;
        case "Lehre":
            gewaehlteBuecher = spans(17, 21);
            break;
        case "Propheten":
            gewaehlteBuecher = spans(22, 38);
            break;
        case "gPropheten":
            gewaehlteBuecher = spans(22, 26);
            break;
        case "kPropheten":
            gewaehlteBuecher = spans(27, 38);
            break;
        case "Evangelien":
            gewaehlteBuecher = spans(39, 42);
            break;
        case "Apg":
            gewaehlteBuecher = spans(43, 43);
            break;
        case "paul":
            gewaehlteBuecher = spans(44, 56);
            break;
        case "aBriefe":
            gewaehlteBuecher = spans(57, 64);
            break;
        case "off":
            gewaehlteBuecher = spans(65, 65);
            break;
        default:
            gewaehlteBuecher = spans(0, 65);
            break;
    }
    console.log(gewaehlteBuecher)
    var checkboxes = document.querySelectorAll("input[type=checkbox][name=selectBooks]")
    for (var i = 0; i < checkboxes.length; i++) {
        checkboxes[i].checked = gewaehlteBuecher.includes(i)
    }
    fillBuecher()
}

function spans(i, j) {
    var list = [];
    for (let index = i; index <= j; index++) {
        list.push(index);
    }
    return list;
}

function CreateTableFromJSON() {
    var header = ['Stelle', 'Vers', 'Zeit', 'Erlaubte Bücher']

    // CREATE DYNAMIC TABLE.
    var table = document.createElement("table");

    // CREATE HTML TABLE HEADER ROW USING THE EXTRACTED HEADERS ABOVE.
    var tr = table.insertRow(-1);                   // TABLE ROW.

    for (var i = 0; i < header.length; i++) {
        var th = document.createElement("th");      // TABLE HEADER.
        th.innerHTML = header[i];
        tr.appendChild(th);
    }

    // ADD JSON DATA TO THE TABLE AS ROWS.
    for (var i = 0; i < playlist.length; i++) {

        tr = table.insertRow(-1);

        for (var j = 0; j < header.length; j++) {
            var tabCell = tr.insertCell(-1)
            var temp
            switch (j) {
                case 0:
                    temp = bibel[playlist[i].versL[0]].name + " " + (playlist[i].versL[1] + 1) + "," + (playlist[i].versL[2] + 1)
                    break
                case 1:
                    var buch = playlist[i].versL[0]
                    var kapitel = playlist[i].versL[1]
                    var vers = playlist[i].versL[2]
                    temp = bibel[buch].chapters[kapitel][vers]
                    break
                case 2:
                    temp = playlist[i].zeit
                    break
                case 3:
                    temp = ""
                    for (var k = 0; k < playlist[i].auswahl.length; k++) {
                        temp += bibel[playlist[i].auswahl[k]].name
                        if (k < playlist[i].auswahl.length - 1) {
                            temp += ", "
                        }
                    }
                    break
            }
            tabCell.innerHTML = temp
        }
    }

    // FINALLY ADD THE NEWLY CREATED TABLE WITH JSON DATA TO A CONTAINER.
    var divContainer = document.getElementById("showData");
    divContainer.innerHTML = "";
    divContainer.appendChild(table);
}