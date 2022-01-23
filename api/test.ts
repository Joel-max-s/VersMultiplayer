import { getBible } from "./utils";

const bible = getBible()
// console.log(bible)

let smallBible = []
for(let book of bible) {
    let chap = []
    for(let c of book.chapters) {
        chap.push(c.length)
    }
    const temp = {
        name: book.name,
        chapterLength: chap
    }
    smallBible.push(temp)
}

console.log(smallBible)
console.log(bible)