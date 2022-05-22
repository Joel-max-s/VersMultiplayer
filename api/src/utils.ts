import * as fs from "fs";
import * as path from "path";

export function getRandomNumber(max: number){
    return Math.floor(Math.random() * max)
}

export function getBible(bibleName? : String) {
    const biblePath = path.resolve('api/bibles')
    console.log(biblePath)
    const rawdata = (() => {
        switch (bibleName) {
            case "Schlachter": return fs.readFileSync(path.join(biblePath, 'de_schlachter.json'));
            default : return fs.readFileSync(path.join(biblePath, 'de_schlachter.json'));
        }
    })();

    return JSON.parse(rawdata.toString());
}

export function getLengthfromObject(obj : Object) {
    return Object.keys(obj).length;
}

export function spans(i: number, j: number) {
    var list : Array<number> = [];
    for (let index = i; index <= j; index++) {
        list.push(index);
    }
    return list;
}

export function generateBooksList(sel: string = "") {
    switch (sel) {
        case "AT": return spans(0, 38);
        case "NT": return spans(39, 65);
        case "Tora": return spans(0, 4);
        case "geschichte": return spans(5, 16);
        case "Lehre": return spans(17, 21);
        case "Propheten": return spans(22, 38);
        case "gPropheten": return spans(22, 26);
        case "kPropheten": return spans(27, 38);
        case "Evangelien": return spans(39, 42);
        case "Apg": return spans(43, 43);
        case "paul": return spans(44, 56);
        case "aBriefe": return spans(57, 64);
        case "off": return spans(65, 65);
        default:
            return spans(0, 65);
    }
}