const { MalSymbol, List } = require("./types");

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

  static createEnv(outer, binds, exprs) {
    const env = new Env(outer);
    for (let i = 0; i < binds.length; i++) {
      const symbol = binds[i];
      if (symbol.symbol === "&") {
        env.set(binds[i + 1], new List(exprs.slice(i)));
        break;
      } else {
        env.set(symbol, exprs[i]);
      }
    }
    return env;
  }
}

module.exports = Env;
