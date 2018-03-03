let Exporter = require('./Exporter');
let prettyData = require('pretty-data');
let xmlBuilder = require('xmlbuilder');

class XML extends Exporter {
    run(data, options) {

        let {rects, config} = this.prepare(data, options);

        let root = xmlBuilder.create("TextureAtlas", {version: '1.0', encoding: 'UTF-8'});

        root.att("imagePath", config.imageName);
        root.att("width", config.imageWidth);
        root.att("height", config.imageWidth);
        root.att("scale", config.scale);
        root.att("format", config.format);
        
        let info = [];
        info.push("");
        info.push("Created with " + this.appInfo.displayName + " v" + this.appInfo.version + " " + this.appInfo.url);
        info.push("Format:");
        info.push("n  => name");
        info.push("x  => x pos");
        info.push("y  => y pos");
        info.push("w  => width");
        info.push("h  => height");
        info.push("pX => x pos of the pivot point");
        info.push("pY => y pos of the pivot point");
        info.push("oX => x-corner offset");
        info.push("oY => y-corner offset");
        info.push("oW => original width");
        info.push("oH => original height");
        info.push("r => 'y' if sprite is rotated");

        root.com(info.join("\n"));

        for(let item of rects) {

            let node = root.ele("sprite");
            node.att("n", item.name);
            node.att("x", item.frame.x);
            node.att("y", item.frame.y);
            node.att("w", item.frame.w);
            node.att("h", item.frame.h);
            node.att("pX", 0.5);
            node.att("pY", 0.5);
            
            if(item.trimmed) {
                node.att("oX", item.spriteSourceSize.x);
                node.att("oY", item.spriteSourceSize.y);
                node.att("oW", item.sourceSize.w);
                node.att("oH", item.sourceSize.h);
            }
            
            if(item.rotated) {
                node.att("r", "y");
            }
        }
        
        return this.getXMLString(root);
    }

    getXMLString(xml) {
        return prettyData.pd.xml(xml.end());
    }

    static get type() {
        return "XML";
    }

    static get description() {
        return "Plain XML format";
    }

    static get fileExt() {
        return "xml";
    }
}

module.exports = XML;