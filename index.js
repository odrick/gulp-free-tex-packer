let through = require("through2");
let path = require("path");
let Jimp = require("jimp");
let getPackerByType = require("./packers/index").getPackerByType;
let getExporterByType = require("./exporters/index").getExporterByType;
let FilesProcessor = require("./FilesProcessor");
let appInfo = require('./package.json');

function fixPath(path) {
    return path.split("\\").join("/");
}

function getExtFromPath(path) {
	return path.split(".").pop();
}

function getErrorDescription(txt) {
    return appInfo.name + ": " + txt;
}

const SUPPORTED_EXT = ["png", "jpg", "jpeg"];

module.exports = function(options) {
    options = options || {};
    options = Object.assign({}, options);
    
    options.textureName = options.textureName === undefined ? "pack-result" : options.textureName;
    options.width = options.width === undefined ? 2048 : options.width;
    options.height = options.height === undefined ? 2048 : options.height;
    options.fixedSize = options.fixedSize === undefined ? false : options.fixedSize;
    options.padding = options.padding === undefined ? 0 : options.padding;
    options.allowRotation = options.allowRotation === undefined ? true : options.allowRotation;
    options.detectIdentical = options.detectIdentical === undefined ? true : options.detectIdentical;
    options.allowTrim = options.allowTrim === undefined ? true : options.allowTrim;
    options.removeFileExtension = options.removeFileExtension === undefined ? false : options.removeFileExtension;
    options.prependFolderName = options.prependFolderName === undefined ? true : options.prependFolderName;
    options.textureFormat = options.textureFormat === undefined ? "png" : options.textureFormat;
    options.base64Export = options.base64Export === undefined ? false : options.base64Export;
    options.scale = options.scale === undefined ? 1 : options.scale;
    options.tinify = options.tinify === undefined ? false : options.tinify;
    options.tinifyKey = options.tinifyKey === undefined ? "" : options.tinifyKey;

    if(!options.packer) options.packer = "MaxRectsBin";
    if(!options.packerMethod) options.packerMethod = "BestShortSideFit";
    if(!options.exporter) options.exporter = "JsonHash";

    let packer = getPackerByType(options.packer);
    if(!packer) {
        throw new Error(getErrorDescription("Unknown packer " + options.packer));
    }

    let packerMethod = packer.methods[options.packerMethod];
    if(!packerMethod) {
        throw new Error(getErrorDescription("Unknown packer method " + options.packerMethod));
    }

    let exporter = getExporterByType(options.exporter);
    if(!exporter) {
        throw new Error(getErrorDescription("Unknown exporter " + options.exporter));
    }

    options.packer = packer;
    options.packerMethod = packerMethod;
    options.exporter = exporter;

    let files = [];
    let firstFile = null;

    function bufferContents(file, enc, cb) {
        if (file.isNull()) {
            cb();
            return;
        }

        if (file.isStream()) {
            console.error(getErrorDescription("Streaming not supported"));
            cb();
            return;
        }

        if (!firstFile) firstFile = file;
		
		if(SUPPORTED_EXT.indexOf(getExtFromPath(file.relative)) < 0) {
			cb();
            return;
		}
		
		Jimp.read(file.contents, (err, image) => {
			if (err) {
				console.error(getErrorDescription("Error reading " + file.relative));
				cb();
				return;
			}
			
			image.name = fixPath(file.relative);
			image._base64 = file.contents.toString("base64");
			image.width = image.bitmap.width;
			image.height = image.bitmap.height;
			files.push({file: file, image: image});
			cb();
		});
    }

    function endStream(cb) {
        if (!files.length) {
            cb();
            return;
        }

        let images = {};
        for(let file of files) images[file.image.name] = file.image;

        FilesProcessor.start(images, options, 
            (res) => {
                for(let item of res) {
                    let file = firstFile.clone({contents: false});
                    file.path = path.join(firstFile.base, item.name);
                    file.contents = item.buffer;
                    this.push(file);
                }
                cb();
            },
            (error) => {
				console.error(getErrorDescription(error.description));
                cb();
            });
    }

    return through.obj(bufferContents, endStream);
};