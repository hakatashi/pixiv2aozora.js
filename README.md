pixiv2aozora
============

[![Build Status][travis-image]][travis-url]
[![Bower][bower-image]][bower-url]
[![npm][npm-image]][npm-url]

[travis-url]: https://travis-ci.org/hakatashi/pixiv2aozora.js
[travis-image]: https://travis-ci.org/hakatashi/pixiv2aozora.js.svg?branch=master
[bower-url]: http://bower.io/search/?q=pixiv2aozora
[bower-image]: https://img.shields.io/bower/v/pixiv2aozora.svg
[npm-url]: https://www.npmjs.com/package/pixiv2aozora
[npm-image]: https://img.shields.io/npm/v/pixiv2aozora.svg

Convert pixiv-Novel text into Aozora-style text

## No time to learn, Just use!

### node.js

```
$ npm install pixiv2aozora
```
```javascript
var pixiv2aozora = require('pixiv2aozora');
pixiv2aozora('[[rb:青空>あおぞら]]'); // -> "｜青空《あおぞら》""
```

### Browser

```html
<script src="dist/pixiv2aozora.min.js"></script>
<script>
    pixiv2aozora('[chapter:使徒、[[rb:襲来>しゅうらい]]]');
        // -> "［＃大見出し］使徒、｜襲来《しゅうらい》［＃大見出し終わり］"
</script>
```

### Command

```
$ npm install pixiv2aozora -g
$ pixiv2aozora --help

  Usage: cli [options] <file>

  Convert pixiv-Novel text into Aozora-style text

  Options:

    -h, --help                    output usage information
    -V, --version                 output the version number
    -o, --output <file>           Write output to <file> instead of stdout
    --input-encoding <encoding>   Specify encoding to read from input. Defaults to utf8
    --output-encoding <encoding>  Specify encoding to write to output. Defaults to utf8
```
