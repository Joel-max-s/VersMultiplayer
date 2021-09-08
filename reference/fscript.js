const animation = document.querySelector('ul.digits');
var counter = 0;
var verse = [];
var stelle = '';
var versAlsListe = [];
var request = new XMLHttpRequest();
request.open("GET", "de_schlachter-min.json", false);
//request.open("GET", "en_kjv.json", false);
request.send(null);
var my_JSON_object = JSON.parse(request.responseText);
hideElements(true);
var gewaehlteBuecher = [];
generateBuecherList();

/**for(var i = 0; i < my_JSON_object.length; i++) {
    alleBuecher.push(i);
}**/



function generateBuecherList() {
    const queryString = window.location.search;
    console.log(queryString);
    const urlParams = new URLSearchParams(queryString);
    const option = urlParams.get('buecher');
    console.log(option);

    switch (option) {
        case "AT":
            gewaehlteBuecher = spans(0,38);
            break;
        case "NT":
            gewaehlteBuecher = spans(39,65);
            break;
        case "Tora":
            gewaehlteBuecher = spans(0,4);
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
            gewaehlteBuecher = spans(0,65);
            break;
    }
}

function spans(i, j) {
    var list = [];
    for (let index = i; index <= j; index++) {
        list.push(index);
    }
    return list;
}


function hideElements(hide) {
    var status = hide ? 'hidden' : 'visible';
    document.getElementById('versZeigen').style.visibility = status;
    document.getElementById('versAbschicken').style.visibility = status;
    document.getElementById('verswaehlen').style.visibility = status;
    document.getElementById('kapitelwaehlen').style.visibility = status;
    document.getElementById('buchwaehlen').style.visibility = status;
}

function getRandomInt(number) {
    return Math.floor(Math.random() * number);
}

function vers(stellenModus) {
    /**let Buchnummer = getRandomInt(Object.keys(my_JSON_object).length);
    let Buch = my_JSON_object[Buchnummer].name;
    let Kapitel = getRandomInt(Object.keys(my_JSON_object[Buchnummer].chapters).length);
    let Vers = getRandomInt(Object.keys(my_JSON_object[Buchnummer].chapters[Kapitel]).length);
    versAlsListe = [Buchnummer, Kapitel, Vers];
    if (stellenModus)
        console.log(String(Buch + " " + (Kapitel + 1) + ", " + (Vers + 1)));
    else
        console.log(String(my_JSON_object[Buchnummer].chapters[Kapitel][Vers]));
    return [Buch + " " + (Kapitel + 1) + "," + (Vers + 1), my_JSON_object[Buchnummer].chapters[Kapitel][Vers]];**/
    let Buchnummer = gewaehlteBuecher[getRandomInt(gewaehlteBuecher.length)];
    let Buch = my_JSON_object[Buchnummer].name;
    let Kapitel = getRandomInt(Object.keys(my_JSON_object[Buchnummer].chapters).length);
    let Vers = getRandomInt(Object.keys(my_JSON_object[Buchnummer].chapters[Kapitel]).length);
    versAlsListe = [Buchnummer, Kapitel, Vers];
    if (stellenModus)
        console.log(String(Buch + " " + (Kapitel + 1) + ", " + (Vers + 1)));
    else
        console.log(String(my_JSON_object[Buchnummer].chapters[Kapitel][Vers]));
    return [Buch + " " + (Kapitel + 1) + "," + (Vers + 1), my_JSON_object[Buchnummer].chapters[Kapitel][Vers]];
}

function fillList() {
    let zufallsZahl = getRandomInt(30) + 20;
    for (var i = 0; i < zufallsZahl; i++) {
        let bibelVers = vers(false);
        verse.push(bibelVers[1]);
        stelle = bibelVers[0];
    }
    console.log(verse[zufallsZahl - 1]);
}

function removeElementsByClass(className) {
    const elements = document.getElementsByClassName(className);
    while (elements.length > 0) {
        elements[0].parentNode.removeChild(elements[0]);
    }
}

function countLines(counter) {
    var el = document.getElementById(counter);
    var divHeight = el.offsetHeight;
    var lineHeight = parseFloat(getComputedStyle(el).fontSize);
    var lines = Math.floor(divHeight / lineHeight);
    return (lines);
}

function makeAnimation() {
    clearSelect(document.getElementById('buchwaehlen'));
    clearSelect(document.getElementById('kapitelwaehlen'));
    clearSelect(document.getElementById('verswaehlen'));
    hideElements(true);
    fillBuecher(gewaehlteBuecher);
    document.getElementById('versZeigen').style.visibility = 'hidden';
    removeElementsByClass('temp');
    verse = [];
    fillList();
    lineCount = 0;
    for (let i = 0; i < verse.length; i++) {
        document.getElementById('Test').innerHTML += "<li class='temp'> <span id='" + i + "'>" + verse[i] + "</span></li>";
        lineCount += countLines(i);
    }
    console.log(lineCount);
    let sheet = document.styleSheets[0];
    sheet.insertRule('@keyframes luckie{ 100%{ margin-top: -' + (lineCount - countLines(verse.length - 1)) + 'em; }}', sheet.cssRules.length);
    document.getElementById('counter').style.height = countLines(verse.length - 1) + "em";
    animation.addEventListener('animationend', () => {
        hideElements(false);
    });
}

function startAnimation() {
    makeAnimation();
    animation.style.animation = 'none';
    animation.offsetHeight;
    animation.style.animation = null;
}

function showVers() {
    alert('Der Vers steht in\n' + stelle);
}

function fillBuecher() {
    var select = document.getElementById('buchwaehlen');
    for (var i = 0; i < gewaehlteBuecher.length; i++) {
        var opt = my_JSON_object[gewaehlteBuecher[i]].name;
        var el = document.createElement("option");
        el.textContent = opt;
        el.value = gewaehlteBuecher[i];
        select.appendChild(el);
    }
    var bOption = document.getElementById('BuchOption');
    bOption.value = gewaehlteBuecher[0];
    /*for (var i = 0; i < my_JSON_object.length; i++) {
        var opt = my_JSON_object[i].name;
        var el = document.createElement("option");
        el.textContent = opt;
        el.value = i;
        select.appendChild(el);
    }*/
}

function generateKapitel() {
    clearSelect(document.getElementById('kapitelwaehlen'));
    clearSelect(document.getElementById('verswaehlen'));
    var buch = document.getElementById('buchwaehlen').value;
    console.log(buch);
    var vers = document.getElementById('kapitelwaehlen');
    for (var i = 0; i < my_JSON_object[buch].chapters.length; i++) {
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
    for (var i = 0; i < my_JSON_object[buch].chapters[kapitel].length; i++) {
        var opt = i + 1;
        var el = document.createElement("option");
        el.textContent = opt;
        el.value = i;
        vers.appendChild(el);
    }
}

function checkifRightSelected() {
    var buchnummer = document.getElementById('buchwaehlen').value
    var buch = my_JSON_object[buchnummer].name;
    var kapitel = document.getElementById('kapitelwaehlen').value;
    var vers = document.getElementById('verswaehlen').value;
    var selected = String(buch + " " + (parseInt(kapitel) + 1) + ', ' + (parseInt(vers) + 1));
    var ist = [parseInt(buchnummer), parseInt(kapitel), parseInt(vers)];
    

    console.log(stelle);
    console.log(selected);
    console.log(ist);
    if (selected == String(stelle)) {
        alert('Du hast die richtige Bibelstelle gefunden');
    }
    else {
        alert('Probiere es erneut, die Bibelstelle war falsch.\n' +
            'Die Richtige Bibelstelle hätte in ' + stelle + ' gestanden\n' +
            'Du warst ' + getAbstand(ist, versAlsListe) + ' Verse entfernt');
    }
}

function clearSelect(selected) {
    for (var i = selected.length; i > 0; i--) {
        selected.remove(i);
    }
}

function getAbstand(ist, soll) {
    var indexI = get1DIndex(ist);
    var indexS = get1DIndex(soll);
    return (Math.abs(indexI - indexS));
}

function get1DIndex(l) {
    //Die Punkte sind noch komisch noch mal anpassen
    var punkte = 0;
    //kap ist die anzahl der Verse von Anfang bis zu der gesuchten Bibelstelle
    var kap = 0;
    for (var i = 0; i <= l[0]; i++) {
        if (i == l[0]) {
            for (var j = 0; j <= l[1]; j++) {
                if (j == l[1]) {
                    punkte += l[2];
                }
                else {
                    punkte += my_JSON_object[i].chapters[j].length
                }
                kap++
            }
        }
        else {
            for (var j = 0; j < my_JSON_object[i].chapters.length; j++) {
                punkte += my_JSON_object[i].chapters[j].length
                kap++
            }
        }
    }
    console.log(kap)
    return punkte;
}