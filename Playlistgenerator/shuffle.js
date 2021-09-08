var fs = require('fs')

var a = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
var b = ["a", "b", "c", "d"]
var p = [{ "zeit": "45", "auswahl": [44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56], "versL": [44, 7, 27], "versS": "" }, { "zeit": "45", "auswahl": [44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56], "versL": [49, 3, 3], "versS": "" }, { "zeit": "45", "auswahl": [0, 1, 2, 3, 4], "versL": [0, 0, 0], "versS": "" }, { "zeit": "45", "auswahl": [39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65], "versL": [48, 1, 7], "versS": "" }, { "zeit": "45", "auswahl": [44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56], "versL": [47, 4, 21], "versS": "" }, { "zeit": "45", "auswahl": [57, 58, 59, 60, 61, 62, 63, 64], "versL": [61, 0, 8], "versS": "" }, { "zeit": "45", "auswahl": [39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65], "versL": [44, 2, 22], "versS": "" }, { "zeit": "45", "auswahl": [39, 40, 41, 42], "versL": [42, 13, 5], "versS": "" }, { "zeit": "45", "auswahl": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38], "versL": [5, 0, 8], "versS": "" }, { "zeit": "45", "auswahl": [22, 23, 24, 25, 26], "versL": [22, 39, 30], "versS": "" }, { "zeit": "45", "auswahl": [44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56], "versL": [44, 5, 22], "versS": "" }, { "zeit": "45", "auswahl": [39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65], "versL": [54, 2, 15], "versS": "" }, { "zeit": "45", "auswahl": [39, 40, 41, 42], "versL": [39, 10, 27], "versS": "" }, { "zeit": "45", "auswahl": [57, 58, 59, 60, 61, 62, 63, 64], "versL": [57, 10, 0], "versS": "" }, { "zeit": "45", "auswahl": [44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56], "versL": [46, 4, 20], "versS": "" }, { "zeit": "45", "auswahl": [39, 40, 41, 42], "versL": [42, 10, 24], "versS": "" }, { "zeit": "45", "auswahl": [39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65], "versL": [42, 0, 0], "versS": "" }, { "zeit": "45", "auswahl": [39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65], "versL": [42, 12, 34], "versS": "" }]


function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array
}

console.log(shuffleArray(a))
console.log(shuffleArray(b))

fs.appendFile('shuffled.txt', JSON.stringify(shuffleArray(p)), function (err) {
    if (err) throw err;
    console.log('Saved!');
});

