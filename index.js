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

function getErrorDescription(txt) {
    return appInfo.name + ": " + txt;
}

module.exports = function(options) {
    options = options || {};
    options = Object.assign({}, options);
    
    options.textureName = options.textureName || "pack-result";
    options.width = options.width || 2048;
    options.height = options.height || 2048;
    options.fixedSize = options.fixedSize || false;
    options.padding = options.padding || 0;
    options.allowRotation = options.allowRotation || true;
    options.detectIdentical = options.detectIdentical || true;
    options.allowTrim = options.allowTrim || true;
    options.removeFileExtension = options.removeFileExtension || false;
    options.prependFolderName = options.prependFolderName || true;
    options.textureFormat = options.textureFormat || "png";
    options.base64Export = options.base64Export || false;
    options.scale = options.scale || 1;
    options.tinify = options.tinify || false;
    options.tinifyKey = options.tinifyKey || "";

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
            this.emit("error", new Error(getErrorDescription("Streaming not supported")));
            cb();
            return;
        }

        if (!firstFile) firstFile = file;

        Jimp.read(file.contents, (err, image) => {
            if (err) {
                console.warn("texture-packer: Error reading " + file.relative);
            }
            else {
                //to support Free texture packer data
                image.name = fixPath(file.relative);
                image._base64 = file.contents.toString("base64");
                image.width = image.bitmap.width;
                image.height = image.bitmap.height;

                files.push({file: file, image: image});
            }

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
                this.emit("error", new Error("texture-packer: " + error.description));
                cb();
            })
    }

    return through.obj(bufferContents, endStream);
};