let XML = require('./XML');
let xmlBuilder = require('xmlbuilder');

class Cocos2d extends XML {
    
    constructor() {
        super();
    }
    
    run(data, options) {

        let {rects, config} = this.prepare(data, options);

        let root = xmlBuilder.create("plist", {version: '1.0', encoding: 'UTF-8'}, {pubID: '-//Apple Computer//DTD PLIST 1.0//EN', sysID: 'http://www.apple.com/DTDs/PropertyList-1.0.dtd'});
        root.att("version", "1.0");
        
        let rootDict = root.ele("dict");
        
        let node = rootDict.ele("key");
        node.txt("frames");
        
        let framesDict = rootDict.ele("dict");

        for(let item of rects) {
            node = framesDict.ele("key");
            node.txt(item.name);
            
            let itemDict = framesDict.ele("dict");

            this.addValue(itemDict, "aliases", "array");
            //FIXME: wtf?
            this.addValue(itemDict, "spriteOffset", "string", (item.trimmed ? "{-1,0}" : "{0,0}"));
            this.addValue(itemDict, "spriteSize", "string", "{"+item.frame.w+","+item.frame.h+"}");
            this.addValue(itemDict, "spriteSourceSize", "string", "{"+item.sourceSize.w+","+item.sourceSize.h+"}");
            this.addValue(itemDict, "textureRect", "string", "{" + "{"+item.frame.x+","+item.frame.y+"}" + "," + "{"+item.frame.w+","+item.frame.h+"}" + "}");
            this.addValue(itemDict, "textureRotated", (item.rotated ?  "true" : "false"));
        }

        node = rootDict.ele("key");
        node.txt("metadata");

        let metaDict = rootDict.ele("dict");

        this.addValue(metaDict, "format", "integer", 3);
        this.addValue(metaDict, "pixelFormat", "string", config.format);
        this.addValue(metaDict, "premultiplyAlpha", "false");
        this.addValue(metaDict, "realTextureFileName", "string", config.imageName);
        this.addValue(metaDict, "size", "string", "{"+config.imageWidth+","+config.imageHeight+"}");
        this.addValue(metaDict, "textureFileName", "string", config.imageName);

        //let header = '<!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">';
        return this.getXMLString(root);
    }
    
    addValue(root, name, type, value) {
        let key = root.ele("key");
        key.txt(name);
        
        let val = root.ele(type);
        if(value !== undefined) val.txt(value);
    }

    static get type() {
        return "Cocos2d";
    }

    static get description() {
        return "cocos2d format";
    }

    static get fileExt() {
        return "plist";
    }
    
}

module.exports = Cocos2d;