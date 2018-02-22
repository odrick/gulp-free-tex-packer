let JsonHash = require('./JsonHash');
let JsonArray = require('./JsonArray');
let Css = require('./Css');
let OldCss = require('./OldCss');
let Pixi = require('./Pixi');
let PhaserHash = require('./PhaserHash');
let PhaserArray = require('./PhaserArray');
let Unreal = require('./Unreal');

const list = [
    JsonHash,
    JsonArray,
    Css,
    OldCss,
    Pixi,
    PhaserHash,
    PhaserArray,
    Unreal
];

function getExporterByType(type) {
    for(let item of list) {
        if(item.type == type) {
            return item;
        }
    }
    return null;
}

module.exports.getExporterByType = getExporterByType;
module.exports.list = list;