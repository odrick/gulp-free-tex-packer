let Json = require('./Json');

class JsonArray extends Json {

    constructor() {
        super();
    }

    run(data, options) {
        return super.run(data, options, {addPivot: true, isArray: true});
    }

    static get type() {
        return "JsonArray";
    }

    static get description() {
        return "Json array";
    }

    static get fileExt() {
        return "json";
    }
}

module.exports = JsonArray;