const animation = document.querySelector('ul.digits');
var tabelleVorhanden = false;
var spieler = [];
var counter = 0;
var stellen = [];
var wurzen = ['Arthur', 'Emil', 'Jakob', 'Joel', 'Jenny', 'Jonathan', 'Maria', 'Naemi', 'Nika', 'Samuel', 'Thea', 'Viktor']
var request = new XMLHttpRequest();
request.open("GET", "de_schlachter-min.json", false);
request.send(null);
var my_JSON_object = JSON.parse(request.responseText);

function addName() {
    let sp = String(document.getElementById("insertName").value);
    document.getElementById("insertName").value = '';
    if (sp != "") {
        if(sp == 'wurzen') {
            for(var i = 0; i < wurzen.length; i++) {
                spieler.push([wurzen[i], 0])
            }
        }
        else {
            spieler.push([sp, 0])
        }
    }
    console.log(spieler);
    if (tabelleVorhanden) {
        removeTable();
    }
    if (spieler.length != 0) {
        generateTable();
    }
}

function sortNames() {
    spieler = spieler.sort(function(a,b) {
        return b[1] - a[1];
    });
}

function removeTable() {
    var tbl = document.getElementById("tables");
    tbl.remove();
    tabelleVorhanden = false;
}

function generateTable() {
    sortNames();
    var body = document.body,
        tbl = document.createElement('table');
    tbl.id = 'tables';
    var header = tbl.createTHead();
    var tr = header.insertRow();
    for (var i = 0; i < 3; i++) {
        var th = document.createElement('th');
        switch (i) {
            case 0:
                th.innerHTML = "Spieler";
                break;
            case 1:
                th.innerHTML = "Punke";
                break;
            case (2):
                th.innerHTML = "";
                break;
        }
        tr.appendChild(th);
    }
    var body = tbl.createTBody();
    for (var i = 0; i < spieler.length; i++) {
        var tr = tbl.insertRow();
        for (var j = 0; j < 3; j++) {
            var td = tr.insertCell();
            switch (j) {
                case 0:
                    td.innerHTML += "<span>" + (spieler[i][0]) + "</span>";
                    break;
                case 1:
                    td.innerHTML += "<span id='" + String(spieler[i][0] + i) + "'>"+ spieler[i][1] +"</span>";
                    break;
                case 2:
                    var tbl2 = document.createElement('table');
                    var t2row = tbl2.insertRow();
                    var tcell1 = t2row.insertCell();
                    tcell1.style.border = 0;
                    var tcell2 = t2row.insertCell();
                    tcell2.style.border = 0;
                    var tcell3 = t2row.insertCell();
                    tcell3.style.border = 0;
                    tcell1.innerHTML = "<button class='tblbtn' title='einen Punkt hinzufügen' onclick='addpoint(" + i + ")'>+</button>";
                    tcell2.innerHTML = "<button class='tblbtn' title='einen Punkt abziehen' onclick='subpoint(" + i + ")'>-</button>";
                    tcell3.innerHTML = "<button class='tblbtn' title='den Spieler löschen' onclick='remplayer(" + i + ")'>del</button>";
                    td.appendChild(tbl2);
                    break;
            }
        }
    }
    document.getElementById('afterTable').before(tbl);
    tabelleVorhanden = true;
}

function addpoint(player) {
    spieler[player][1]++;
    removeTable();
    generateTable();
    //document.getElementById(String(spieler[player][0] + player)).innerHTML = spieler[player][1];
}

function subpoint(player) {
    spieler[player][1]--;
    removeTable();
    generateTable();
    //document.getElementById(String(spieler[player][0] + player)).innerHTML = spieler[player][1];
}

function remplayer(player) {
    spieler.splice(player, 1);
    removeTable();
    if (spieler.length != 0) {
        generateTable();
    }
}

function getRandomInt(number) {
    return Math.floor(Math.random() * number);
}

function vers() {
    let Buchnummer = getRandomInt(Object.keys(my_JSON_object).length);
    let Buch = my_JSON_object[Buchnummer].name;
    let Kapitel = getRandomInt(Object.keys(my_JSON_object[Buchnummer].chapters).length);
    let Vers = getRandomInt(Object.keys(my_JSON_object[Buchnummer].chapters[Kapitel]).length);
    console.log(String(Buch + " " + (Kapitel + 1) + ", " + (Vers + 1)));
    return Buch + " " + (Kapitel + 1) + ", " + (Vers + 1);
}

function fillList() {
    let zufallsZahl = getRandomInt(100) + 50;
    for (var i = 0; i < zufallsZahl; i++) {
        stellen.push(vers());
    }
}

function removeElementsByClass(className) {
    const elements = document.getElementsByClassName(className);
    while (elements.length > 5) {
        elements[0].parentNode.removeChild(elements[0]);
    }
}

function makeAnimation() {
    removeElementsByClass('temp');
    stellen = [];
    fillList();
    for (let i = 0; i < stellen.length; i++) {
        document.getElementById('Test').innerHTML += "<li class='temp'> <span id='" + i + "'>" + stellen[i] + "</span></li>\n";
    }
    let sheet = document.styleSheets[0];
    console.log(stellen.length)
    sheet.insertRule('@keyframes luckie{ 100%{ margin-top: -' + stellen.length + 'em; }}', sheet.cssRules.length);
    animation.addEventListener('animationend', () => {
        document.getElementById(stellen.length - 3).style.backgroundColor = 'LightGreen';
    });
}

function startAnimation() {
    makeAnimation();
    animation.style.animation = 'none';
    animation.offsetHeight;
    animation.style.animation = null;
}