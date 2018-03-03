let JsonHash = require('./JsonHash');
let JsonArray = require('./JsonArray');
let Css = require('./Css');
let OldCss = require('./OldCss');
let Pixi = require('./Pixi');
let PhaserHash = require('./PhaserHash');
let PhaserArray = require('./PhaserArray');
let Unreal = require('./Unreal');
let XML = require('./XML');
let Starling = require('./Starling');
let Cocos2d = require('./Cocos2d');

const list = [
    JsonHash,
    JsonArray,
    Css,
    OldCss,
    Pixi,
    PhaserHash,
    PhaserArray,
    Unreal,
    XML,
    Starling,
    Cocos2d
];

function getExporterByType(type) {
    type = type.toLowerCase();
    
    for(let item of list) {
        if(item.type.toLowerCase() == type) {
            return item;
        }
    }
    return null;
}

module.exports.getExporterByType = getExporterByType;
module.exports.list = list;