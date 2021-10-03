// generiert den zufälligen Vers
export function vers({aktiv = true, config = gewaehlteBuecher} = {}) {
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