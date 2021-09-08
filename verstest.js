/*
    TODOS:
    bessere Dateistruktur und Dateinamen
    Timer ablaufen lassen --> Timer fixen das der nicht doppelt so schnell ablaufen kann
    Automatische nächste Runde -> aber nur wenn in einstellungen konfiguriert oder in Playlist so vorgesehen
    tool zum einfacheren erstellen von Playlisten
    bei spielern statt neue HTML-Datei zu fetchen, das davor einfach unsichtbar machen
    (bei Playlist bücherauswahl im Generieren dings richtig anzeigen)
    (playlist verifizieren)
    spieler anders anzeigen wenn sie verbunden sind oder die verbindung getrennt ist --> maximal andere Farbe, aber eigentlich sinnlos
    mehrere Spiele die sich nicht behindern parallel laufen lassen (lobby system --> uff das wird glaube hart --> später wenn ich mal bock habe)
    ❌ evtl Ton bei präsentator
    ❌ Wenn viele Spieler da sind mehrere Tabellen nebeneinander generieren
*/

// Konstanten für den server und socket.io
const express = require('express');
const app = express();
const router = express.Router();
const path = require('path');
const http = require('http').Server(app);
const io = require('socket.io')(http);
const fs = require('fs');
const { setInterval } = require('timers');
const port = process.env.PORT || 4000;

// die Bibel als JSON-Datei
var rawdata = fs.readFileSync('de_schlachter-min.json');
// die Bibel als Javascript-Klassenobjekt
var my_JSON_object = JSON.parse(rawdata);
// zeigt an welcher Vers gerade gesucht werden muss
var aktiverVers = ''
// die socket-ID vom versgernerator
var generatorId = '';
// liste mit allen Spielerobjekten
var spieler = [];
// vers wird so gespeichert [Buchnummer, Kapitel, Vers]
var versAlsListe = [];
// standardauswahl der Bücher
var gewaehlteBuecher = spans(0, 65);
// mögliche Bücher aus denen die Verse stammen können
var auswahlmoeglichkeiten = ['AT', 'NT', 'Tora', 'geschichte', 'Lehre', 'Propheten', 'gPropheten', 'kPropheten', 'Evangelien', 'Apg', 'paul', 'aBriefe', 'off'];
var timeLeft = 0;
var abgeschlossenCounter = 0;
var zeitBonus = 0.5;
var playlistelem = {zeit: null, auswahl: [0,1,2,3,4], versL: [0,0,0], versS: ''};
var playlist = [];//JSON.parse(fs.readFileSync('samplePlaylist.json'));
var playListactive = true;

// Dateistruktur des Servers
app.use(express.static('public'));
var publicPath = path.join(__dirname , "public/")
app.get('/', (req, res) => {
    res.sendFile(publicPath + '/versAnzeigen.html');
});
app.get('/generieren', (req, res) => {
    res.sendFile(publicPath + '/versGenerieren.html');
});
app.get('/datenschutz', (req, res) => {
    res.sendFile(publicPath + '/datenschutz.html');
});
app.get('test', (req, res) => {
    res.sendFile(publicPath + 'test.html');
});

// alle aktivitäten die der socket machen muss
io.on('connection', (socket) => {
    // wenn sich ein spieler mit der webseite verbindet
    socket.on('player connected', msg => {
        if (!spieler.some(e => e.id == msg.id)) {
            msg.points = 0;
            spieler.push(msg)
        }
        else {
            spieler.filter(obj => {
                if (obj.id === msg.id) {
                    obj.connected = true;
                    console.log(obj.name, 'is back');
                }
            })
            //socket.broadcast.to(generatorId).emit('spieler income', spieler);
            io.emit('spieler income', spieler);
        }
    })

    // wenn ein Spieler seinen Namen eingegeben hat
    socket.on('spieler income', msg => {
        spieler.filter(obj => {
            if (obj.id === msg.id) {
                obj.name = msg.name;
                obj.team = msg.team;
                obj.socketid = msg.socketid;
                obj.temp = { abstand: -1, punkte: 0 };
                obj.connected = true;
                console.log(msg.name, "logged in", "he is in team", msg.team)
            }
        });
        //socket.broadcast.to(generatorId).emit('spieler income', spieler);
        io.emit('spieler income', spieler);
    });

    // wenn der Generator den Button "vers Generieren" gedrückt hat
    socket.on('vers income', msg => {
        if(playListactive && playlist.length > 0) {
            var elem = playlist.shift();
            if(elem.zeit > 0) {
                startTimer(elem.zeit.toString(), io.sockets.sockets.get(generatorId));
            }
            if(elem.auswahl == []) {
                elem.auswahl = spans(0,65);
            }
            if(elem.versL == []) {
                var temp = vers({aktiv: false, config: elem.auswahl});
                elem.versL = temp.liste.sort();
                elem.versS = temp.text;
            }
            else {
                elem.versS = toVers(elem.versL)
                console.log(elem.versS);
            }
            aktiverVers = elem.versS;
            versAlsListe = elem.versL;
            gewaehlteBuecher = elem.auswahl;
            console.log('Es sind noch', playlist.length, 'Verse in der Playlist');
        }
        else {
            aktiverVers = vers().text
        }
        abgeschlossenCounter = 0;
        zeitBonus = 0.5;
        for (var i = 0; i < spieler.length; i++) {
            spieler[i].temp = { abstand: -1, punkte: 0 };
            spieler[i].allowdToSend = true;
        }
        io.emit('vers income', aktiverVers);
        io.emit('Ausgewaehlt', gewaehlteBuecher);
    });

    // wenn spieler einen tipp abgeschickt haben
    socket.on('tipp income', msg => {
        if (versAlsListe.length <= 2) {
            return;
        }
        //socket.emit('tipp income', { abstand: distance, r: versAlsListe });
        for (var i = 0; i < spieler.length; i++) {
            if (spieler[i].id === msg.id && spieler[i].allowdToSend === true) {
                var auswertung = check(msg.data, msg.name);
                spieler[i].temp = auswertung;
                spieler[i].allowdToSend = false;
                abgeschlossenCounter++;
                console.log(abgeschlossenCounter, 'von', spieler.length, 'haben ihren tipp abgeschickt');
                return;
            }
        }
    });

    // wenn die Seite beim Spieler fertig geladen ist wird der gerade aktive Vers mit geschickt
    socket.on('loaded', msg => {
        socket.emit('loaded', aktiverVers);
        socket.emit('Ausgewaehlt', gewaehlteBuecher);
        socket.emit('spieler income', spieler);
    });

    // initialisierung des Generators
    socket.on('init generator', msg => {
        generatorId = msg;
        console.log(generatorId);
        socket.emit('spieler income', spieler.filter(obj => {
            obj.name != ''
        }));
    });

    // die spieler bekommen die Bücher aus denen man auswählen kann
    socket.on('getAuswahlmoeglichkeiten', msg => {
        socket.emit('getAuswahlmoeglichkeiten', auswahlmoeglichkeiten);
        console.log(auswahlmoeglichkeiten);
    });

    // der generator bestimmt aus welchen Bibelbüchern ausgewählt werden darf
    socket.on('Ausgewaehlt', msg => {
        generateBuecherList(msg);
        // io.emit('Ausgewaehlt', gewaehlteBuecher);
    });

    // ergebnis an spieler schicken
    socket.on('abschluss', msg => {
        abschluss(socket);
    });

    // ein Timer wird gestartet
    socket.on('startTimer', msg => {
        startTimer(msg, socket);
    });

    // Timer erhöhen
    socket.on('increaseTime', msg => {
        increaseTimer(msg);
    });

    //wenn ein Spieler die Verbindung verliert
    socket.on('disconnect', msg => {
        for (var i = 0; i < spieler.length; i++) {
            if (spieler[i].socketid == socket.id) {
                console.log(spieler[i].name, "disconnected")
                spieler[i].connected = false;
                //socket.broadcast.to(generatorId).emit('abschluss', spieler);
                io.emit('abschluss', spieler);
                return;
            }
        }
    });

    // wenn eine Playlist gesendet wurde
    socket.on('send Playlist', msg => {
        playListactive = true;
        playlist = msg;
    });

    //Punkte zurück setzen
    socket.on('resetPoints', msg => {
        for(var i = 0; i < spieler.length; i++) {
            spieler[i].points = 0;
        }
        //socket.emit('abschluss', spieler);
        io.emit('abschluss', spieler);
    });
});

http.listen(port, () => {
    console.log(`Socket.IO server running at http://localhost:${port}/`);
});

function increaseTimer(msg) {
    if (timeLeft > 0 && msg != null) {
        timeLeft += parseInt(msg);
    }
}

function startTimer(msg, socket) {
    if (msg != null && parseInt(msg) > 0 && msg != '') {
        timeLeft = parseInt(msg);
        io.emit('timer', timeLeft + ' Sekunden');
        var interval = 1000;
        var test = setInterval(() => {
            timeLeft--;
            if (timeLeft <= 0) {
                console.log("Zeit ist abgelaufen")
                clearInterval(test);
                abschluss(socket);
            }
            io.emit('timer', timeLeft + ' Sekunden');
        }, interval);
    }
    else {
        io.emit('timer', 'keine Zeitbegrenzung');
    }
}

function abschluss(socket) {
    if(timeLeft > 0) {
        timeLeft = 0;
        return;
    }
    for (var i = 0; i < spieler.length; i++) {
        spieler[i].allowdToSend = false;
        spieler[i].points += spieler[i].temp.punkte;
        socket.broadcast.to(spieler[i].socketid).emit('tipp income', { auswertung: spieler[i].temp, r: versAlsListe });
    }
    //socket.emit('abschluss', spieler);
    io.emit('abschluss', spieler);
}

// generiert den zufälligen Vers
function vers({aktiv = true, config = gewaehlteBuecher} = {}) {
    console.log(aktiv, config);
    let Buchnummer = config[getRandomInt(config.length)];
    let Kapitel = getRandomInt(Object.keys(my_JSON_object[Buchnummer].chapters).length);
    let Vers = getRandomInt(Object.keys(my_JSON_object[Buchnummer].chapters[Kapitel]).length);
    var tempList = [Buchnummer, Kapitel, Vers];
    versAlsListe = aktiv ? tempList : versAlsListe;
    var versS = toVers(tempList);
    console.log(String(versS));
    return { liste: tempList, text: versS };
}

// den Abstand zwischen eingesendetem und aktiven Vers ausrechnen
function check(ist, name) {
    var auswertung = getPunkte(ist, versAlsListe);
    console.log(name, "hat", toVersLString(ist), "getippt. \t Richtig wäre:", toVersLString(versAlsListe));
    return auswertung;
}

// // den abstand zwischen zwei Bibelstellen berechnen
// function getAbstand(ist, soll) {
//     var indexI = get1DIndex(ist);
//     var indexS = get1DIndex(soll);
//     return (Math.abs(indexI - indexS));
// }

// berechnet die Punkte die ein Spieler bekommt (abhängig vom Ergebnis und Zeit)
function getPunkte(ist, soll) {
    var indexI = getAbstand(ist);
    var indexS = getAbstand(soll);
    var entfernung = Math.abs(indexI - indexS);
    var FistPossible = getAbstand([gewaehlteBuecher[0], 0, 0])
    var lastBook = gewaehlteBuecher[gewaehlteBuecher.length - 1];
    var lastKap = my_JSON_object[lastBook].chapters.length - 1;
    var lastVers = my_JSON_object[lastBook].chapters[lastKap].length - 1;
    var LastPossible = getAbstand([lastBook, lastKap, lastVers]);
    var distanceFirst = Math.abs(indexS - FistPossible);
    var distanceLast = Math.abs(LastPossible - indexS);
    var biggestPossibleDistance = distanceFirst > distanceLast ? distanceFirst : distanceLast;
    var gewicht = 4000 / biggestPossibleDistance;
    var points = 4000 - (gewicht * entfernung)
    points = (entfernung == 0) ? points * (1.5 + (2 * zeitBonus)) : points * (0.5 + zeitBonus);
    points = Math.ceil(points);
    zeitBonus = (entfernung == 0) ? zeitBonus * 0.7 : zeitBonus;
    return ({ abstand: entfernung, punkte: points });
}

// den Abstand zwischen 1. Mose 1,1 und der geforderten Stelle berechnen
function getAbstand(l) {
    var punkte = 0;
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
    // console.log(kap)
    return punkte;
}

// function generatePlaylist() {
//     for (var i = 0; i < playlistConfig.length; i++) {
//         playlistConfig[i].auswahl = (playlistConfig[i].auswahl === null) ? spans(0, 65) : playlistConfig[i].auswahl;
//         playlistConfig[i].vers = (playlistConfig[i].vers === null) ? vers(playlistConfig[i].auswahl) : playlistConfig[i].vers;
//     }
// }

// auswahlmöglichkeiten für den Generator
function generateBuecherList(auswahl) {
    switch (auswahl) {
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
    return (gewaehlteBuecher);
}

// Hilfsfunktion macht eine Liste von i nach j
function spans(i, j) {
    var list = [];
    for (let index = i; index <= j; index++) {
        list.push(index);
    }
    return list;
}

// macht aus einem Vers als Liste einen String
function toVersLString(x) {
    return my_JSON_object[x[0]].name + " " + (x[1] + 1).toString() + "," + (x[2] + 1).toString()
}

function toVers(x) {
    return my_JSON_object[x[0]].chapters[x[1]][x[2]];
}

// Generiert eine zufällige Zahl zwischen 0 und number
function getRandomInt(number) {
    return Math.floor(Math.random() * number);
}
