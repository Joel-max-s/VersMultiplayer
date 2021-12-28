const pElem = {
    "time": 100,
    "selection": [
        {
            "book" : 5,
            "chapters": [
                {
                    "chapter": 23,
                    "verses" : [0,1,2,3,4,5]
                },
                {
                    "chapter": 27
                }
            ] 
        },
        {
            "book": 23
        }
    ] 
}

function printPlaylist(p) {
    console.log("time:", p.time)

    for (let e of p.selection) {
        if(e.hasOwnProperty('chapters')) {
            for (let c of e.chapters) {
                if(c.hasOwnProperty('verses')) {
                    console.log('B:' + e.book + ' C:' + c.chapter + ' V:' + c.verses)
                } else {
                    console.log('B:' + e.book + ' C:' + c.chapter)
                }
            }
        } else {
            console.log('B:' + e.book)
        }
    }
}

printPlaylist(pElem)