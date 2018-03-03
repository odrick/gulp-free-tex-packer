let XML = require('./XML');
let xmlBuilder = require('xmlbuilder');

class Starling extends XML {

    constructor() {
        super();
    }

    run(data, options) {

        let {rects, config} = this.prepare(data, options);

        let root = xmlBuilder.create("TextureAtlas", {version: '1.0', encoding: 'UTF-8'});

        root.att("imagePath", config.imageName);
        root.att("width", config.imageWidth);
        root.att("height", config.imageWidth);

        let info = [];
        info.push("");
        info.push("Created with " + this.appInfo.displayName + " v" + this.appInfo.version + " " + this.appInfo.url);
        info.push("");
        root.com(info.join("\n"));

        for(let item of rects) {

            let node = root.ele("SubTexture");
            node.att("name", item.name);
            node.att("x", item.frame.x);
            node.att("y", item.frame.y);

            if(item.rotated) {
                node.att("rotated", true);
                node.att("width", item.frame.h);
                node.att("height", item.frame.w);
            }
            else {
                node.att("width", item.frame.w);
                node.att("height", item.frame.h);
            }
            
            node.att("frameX", -item.spriteSourceSize.x);
            node.att("frameY", -item.spriteSourceSize.y);
            node.att("frameWidth", item.sourceSize.w);
            node.att("frameHeight", item.sourceSize.h);
        }

        return this.getXMLString(root);
    }

    static get type() {
        return "Starling";
    }

    static get description() {
        return "Starling format";
    }

    static get fileExt() {
        return "xml";
    }
    
}

module.exports = Starling;