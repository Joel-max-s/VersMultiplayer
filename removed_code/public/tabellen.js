function generateTable() {
    sortNames();
    var body = document.body,
        tbl = document.createElement('table');
    tbl.id = 'tables';
    var header = tbl.createTHead();
    var tr = header.insertRow();
    for (var i = 0; i < 2; i++) {
        var th = document.createElement('th');
        switch (i) {
            case 0:
                th.innerHTML = "Spieler";
                break;
            case 1:
                th.innerHTML = "Punkte";
                break;
        }
        tr.appendChild(th);
    }
    var body = tbl.createTBody();
    for (var i = 0; i < spieler.length; i++) {
        if (spieler[i].name != '') {
            var colname, colpoints;
            // if (!spieler[i].connected) {
            //     colname = "<span style='color:red'>" + (spieler[i].name) + "</span>";
            //     colpoints = "<span id='" + String(spieler[i].name + i) + "' style='color:red'>" + spieler[i].points + "</span>";
            // }
            // else {
                var color = "black";
                console.log(spieler[i].team);
                switch(parseInt(spieler[i].team)) {
                    case 1: color = "green"; break;
                    case 2: color = "orange"; break;
                    case 3: color = "blue"; break;
                    case 4: color = "red"; break;
                }
                colname = "<span style='color:" + color + "'>" + (spieler[i].name) + "</span>";
                colpoints = "<span id='" + String(spieler[i].name + i) + "' style='color:" + color + "'>" + spieler[i].points + "</span>";
            // }
            var tr = tbl.insertRow();
            for (var j = 0; j < 2; j++) {
                var td = tr.insertCell();
                switch (j) {
                    case 0:
                        td.innerHTML += colname;
                        break;
                    case 1:
                        td.innerHTML += colpoints;
                        break;
                }
            }
        }
    }
    document.getElementById('afterTable').before(tbl);
}

function sortNames() {
    spieler = spieler.sort(function (a, b) {
        return b.points - a.points;
    });
}

function removeTable() {
    var tbl = document.getElementById("tables");
    tbl.remove();
}