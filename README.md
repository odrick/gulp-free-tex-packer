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
* `exporter` - name of predefined exporter (JsonHash, JsonArray, Css, OldCss, Pixi, PhaserHash, PhaserArray, XML, Starling, Cocos2d or Unreal), or custom exporter (see below). Default: **JsonHash**
* `filter` - name of bitmap filter (grayscale, mask or none). Default: **none**

# Custom exporter

Exporter property can be object. Fields:

* `fileExt` - files extension
* `template` - path to template file or
* `content` - content of template

Free texture packer uses [mustache](http://mustache.github.io/) template engine.

There are 3 objects passed to template:

**rects** (Array) list of sprites for export

| prop             | type    | description                     |
| ---              | ---     | ---                             |
| name             | String  | sprite name                     |
| frame            | Object  | frame info (x, y, w, h, hw, hh) |
| rotated          | Boolean | sprite rotation flag            |
| trimmed          | Boolean | sprite trimmed flag             |
| spriteSourceSize | Object  | sprite source size (x, y, w, h) |
| sourceSize       | Object  | original size (w, h)            |
| first            | Boolean | first element in array flag     |
| last             | Boolean | last element in array flag      |

**config** (Object) currect export config

| prop           | type    | description              |
| ---            | ---     | ---                      |
| imageWidth     | Number  | texture width            |
| imageHeight    | Number  | texture height           |
| scale          | Number  | texture scale            |
| format         | String  | texture format           |
| imageName      | String  | texture name             |
| base64Export   | Boolean | base64 export flag       |
| base64Prefix   | String  | prefix for base64 string |
| imageData      | String  | base64 image data        |

**appInfo** (Object) application info

| prop           | type    | description          |
| ---            | ---     | ---                  |
| displayName    | String  | App name             |
| version        | String  | App version          |
| url            | String  | App url              |

**Template example:**
```
{
  "frames": {
    {{#rects}}
    "{{{name}}}": {
      "frame": {
        "x": {{frame.x}},
        "y": {{frame.y}},
        "w": {{frame.w}},
        "h": {{frame.h}}
      },
      "rotated": {{rotated}},
      "trimmed": {{trimmed}},
      "spriteSourceSize": {
        "x": {{spriteSourceSize.x}},
        "y": {{spriteSourceSize.y}},
        "w": {{spriteSourceSize.w}},
        "h": {{spriteSourceSize.h}}
      },
      "sourceSize": {
        "w": {{sourceSize.w}},
        "h": {{sourceSize.h}}
      },
      "pivot": {
        "x": 0.5,
        "y": 0.5
      }
    }{{^last}},{{/last}}
    {{/rects}}
  },
  "meta": {
    "app": "{{{appInfo.url}}}",
    "version": "{{appInfo.version}}",
    "image": "{{config.imageName}}",
    "format": "{{config.format}}",
    "size": {
      "w": {{config.imageWidth}},
      "h": {{config.imageHeight}}
    },
    "scale": {{config.scale}}
  }
}
```

**Custom template usage example**

```js
let texturePacker = require('gulp-free-tex-packer');

gulp.task('pack', function() {
    let exporter = {
        fileExt: "json",
        template: "./MyTemplate.mst"
    };

    return gulp.src('src/**/*.*')
		.pipe(texturePacker({
		    exporter: exporter
		))
		.pipe(gulp.dest('dest/'));
});
```

# Used libs

* **Jimp** - https://github.com/oliver-moran/jimp
* **mustache.js** - https://github.com/janl/mustache.js/
* **tinify** - https://github.com/tinify/tinify-nodejs

---
License: MIT
