const { MalSymbol } = require("./types");

class Env {
  constructor(outer = null) {
    this.outer = outer;
    this.data = new Map();
  }

  set(key, value) {
    if (!(key instanceof MalSymbol)) {
      throw `${key} is not a symbol`;
    }

    this.data.set(key.symbol, value);
    return value;
  }

  find(key) {
    if (this.data.has(key.symbol)) {
      return this;
    }

    if (this.outer) {
      return this.outer.find(key);
    }

    return null;
  }

  get(key) {
    const env = this.find(key);

    if (env) {
      return env.data.get(key.symbol);
    }

    throw `${key.symbol} not found`;
  }
}

module.exports = Env;
