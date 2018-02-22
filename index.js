let through = require("through2");
let path = require("path");
let Jimp = require("jimp");
let PackProcessor = require("./PackProcessor");
let getPackerByType = require("./packers/index").getPackerByType;
let TextureRenderer = require("./utils/TextureRenderer");
let getExporterByType = require("./exporters/index").getExporterByType;
let tinify = require("tinify");
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

    function tinifyImage(buffer, callback) {
        if(!options.tinify) {
            callback(buffer);
            return;
        }

        tinify.key = options.tinifyKey;

        tinify.fromBuffer(buffer).toBuffer(function(err, result) {
            if (err) throw err;
            callback(result);
        });
    }

    function processPackResultItem(fName, item, callback) {
        let files = [];

        let pixelFormat = options.textureFormat == "png" ? "RGBA8888" : "RGB888";
        let mime = options.textureFormat == "png" ? Jimp.MIME_PNG : Jimp.MIME_JPEG;

        item.buffer.getBuffer(mime, (err, srcBuffer) => {
            tinifyImage(srcBuffer, (buffer) => {
                let opts = {
                    imageName: fName + "." + options.textureFormat,
                    imageData: buffer.toString("base64"),
                    format: pixelFormat,
                    textureFormat: options.textureFormat,
                    imageWidth: item.buffer.bitmap.width,
                    imageHeight: item.buffer.bitmap.height,
                    removeFileExtension: options.removeFileExtension,
                    prependFolderName: options.prependFolderName,
                    base64Export: options.base64Export,
                    scale: options.scale
                };

                let file = firstFile.clone({contents: false});
                file.path = path.join(firstFile.base, fName + "." + exporter.fileExt);
                file.contents = new Buffer(new exporter().run(item.data, opts));
                files.push(file);

                if(!options.base64Export) {
                    file = firstFile.clone({contents: false});
                    file.path = path.join(firstFile.base, fName + "." + options.textureFormat);
                    file.contents = buffer;
                    files.push(file);
                }

                callback(files);
            });
        });
    }

    function endStream(cb) {
        if (!files.length) {
            cb();
            return;
        }

        let images = {};
        for(let file of files) images[file.image.name] = file.image;

        PackProcessor.pack(images, options,
            (res) => {
                let packResult = [];
                let readyParts = 0;

                for(let data of res) {
                    new TextureRenderer(data, options, (renderResult) => {
                        packResult.push({
                            data: renderResult.data,
                            buffer: renderResult.buffer
                        });

                        if(packResult.length >= res.length) {

                            let ix = 0;
                            for(let item of packResult) {

                                let fName = options.textureName + (packResult.length > 1 ? "-" + ix : "");

                                processPackResultItem(fName, item, (files) => {
                                    for(let f of files) {
                                        this.push(f);
                                    }

                                    readyParts++;

                                    if(readyParts >= packResult.length) {
                                        cb();
                                    }
                                });

                                ix++;
                            }
                        }
                    });
                }
            },
            (error) => {
                this.emit("error", new Error("texture-packer: " + error.description));
                cb();
            });
    }

    return through.obj(bufferContents, endStream);
};