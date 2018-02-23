# gulp-free-tex-packer
> Free texture packer module for gulp 

> Based on https://github.com/odrick/free-tex-packer

# Install
   
$ npm install gulp-free-tex-packer
   
# Basic usage
```js
let texturePacker = require('gulp-free-tex-packer');

gulp.task('pack', function() {
    return gulp.src('src/**/*.*')
		.pipe(texturePacker())
		.pipe(gulp.dest('dest/'));
});
```

# Advanced usage

Use packer options object

```js
let texturePacker = require('gulp-free-tex-packer');

gulp.task('pack', function() {
    return gulp.src('src/**/*.*')
	.pipe(texturePacker({
            textureName: "my-texture",
            width: 1024,
            height: 1024,
            fixedSize: false,
            padding: 2
            allowRotation: true,
            detectIdentical: true,
            allowTrim: true,
            exporter: "Pixi",
            removeFileExtension: true,
            prependFolderName: true
        }))
	.pipe(gulp.dest('dest/'));
});
```

# Available options

* `textureName` - name of output files. Default: **pack-result**
* `width` - max single texture width. Default: **2048**
* `height` - max single texture height. Default: **2048**
* `fixedSize` - fix texture size. Default: **false**
* `padding` - spaces in pixels around images. Default: **0**
* `allowRotation` - allow image rotation. Default: **true**
* `detectIdentical` - allow detect identical images. Default: **true**
* `allowTrim` - allow trim images. Default: **true**
* `removeFileExtension` - remove file extensions from frame names. Default: **false**
* `prependFolderName` - prepend folder name to frame names. Default: **true**
* `textureFormat` - output file format (png or jpg). Default: **png**
* `base64Export` - export texure as base64 string to atlas meta tag. Default: **false**
* `scale` - scale size and positions in atlas. Default: **1**
* `tinify` - tinify texture using [TinyPNG](https://tinypng.com/). Default: **false**
* `tinifyKey` - [TinyPNG key](https://tinypng.com/developers). Default: **""**
* `packerMethod` - name of pack method (BestShortSideFit, BestLongSideFit, BestAreaFit, BottomLeftRule or ContactPointRule). Default: **BestShortSideFit**
* `exporter` - name of exporter (JsonHash, JsonArray, Css, OldCss, Pixi, PhaserHash, PhaserArray or Unreal). Default: **JsonHash**

# Used libs

* **Jimp** - https://github.com/oliver-moran/jimp
* **pretty-data** - https://github.com/vkiryukhin/pretty-data
* **tinify** - https://github.com/tinify/tinify-nodejs

---
License: MIT
