let MaxRectsBin = require("./MaxRectsBin");

const list = [
    MaxRectsBin
];

function getPackerByType(type) {
    for(let item of list) {
        if(item.type == type) {
            return item;
        }
    }
    return null;
}

module.exports.getPackerByType = getPackerByType;
module.exports.list = list;