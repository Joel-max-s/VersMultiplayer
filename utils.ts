import * as fs from "fs";

export function getRandomNumber(max: number){
    return Math.floor(Math.random() * Math.floor(max))
}

export function getBible(bibleName? : String) {
    const rawdata = (() => {
        switch (bibleName) {
            case "Schlachter": return fs.readFileSync("de_schlachter-min.json");
            default : return fs.readFileSync("de_schlachter-min.json");
        }
    })();

    return JSON.parse(rawdata.toString());
}

export function getLengthfromObject(obj : Object) {
    return Object.keys(obj).length;
}