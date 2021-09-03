class MalValue {
  stringify(print_readably = false) {
    return "---default mal val---";
  }
}

const stringify = (val, print_readably) => {
  if (val instanceof MalValue) {
    return val.stringify(print_readably);
  }

  return val.toString();
};

class List extends MalValue {
  constructor(ast) {
    super();
    this.ast = ast.slice();
  }

  isEmpty() {
    return this.ast.length === 0;
  }

  cons(el) {
    return new List([el, ...this.ast]);
  }

  concat(other) {
    return new List([...this.ast, ...other.ast]);
  }

  beginsWith(el) {
    return this.ast[0] && this.ast[0].symbol === el;
  }

  stringify(print_readably = false) {
    return (
      "(" + this.ast.map((el) => stringify(el, print_readably)).join(" ") + ")"
    );
  }
}

class Vecotr extends MalValue {
  constructor(ast) {
    super();
    this.ast = ast.slice();
  }

  isEmpty() {
    return this.ast.length === 0;
  }

  cons(el) {
    return new List([el, ...this.ast]);
  }

  concat(other) {
    return new List([...this.ast, ...other.ast]);
  }

  stringify(print_readably = false) {
    return (
      "[" + this.ast.map((el) => stringify(el, print_readably)).join(" ") + "]"
    );
  }
}

class Hashmap extends MalValue {
  constructor(hashmap) {
    super();
    this.hashmap = hashmap;
  }

  stringify(print_readably = false) {
    let str = "";
    let seperator = "";

    for (const [key, value] of this.hashmap.entries()) {
      str =
        str +
        seperator +
        stringify(key, print_readably) +
        " " +
        stringify(value, print_readably);
      seperator = ", ";
    }

    return "{" + str + "}";
  }
}

class Str extends MalValue {
  constructor(string) {
    super();
    this.string = string;
  }

  stringify(print_readably = false) {
    if (print_readably) {
      return (
        '"' +
        this.string
          .replace(/\\/g, "\\\\")
          .replace(/"/g, '\\"')
          .replace(/\n/g, "\\n") +
        '"'
      );
    }
    return '"' + this.string + '"';
  }
}

class Keyword extends MalValue {
  constructor(keyword) {
    super();
    this.keyword = keyword;
  }

  stringify(print_readably = false) {
    return ":" + this.keyword;
  }
}

class MalSymbol extends MalValue {
  constructor(symbol) {
    super();
    this.symbol = symbol;
  }

  stringify(print_readably = false) {
    return this.symbol;
  }
}

class Fn extends MalValue {
  constructor(fnBody, params, env, fn, isMicro = false) {
    super();
    this.fnBody = fnBody;
    this.params = params;
    this.env = env;
    this.fn = fn;
    this.isMicro = false;
  }

  apply(args) {
    return this.fn.apply(null, args);
  }

  stringify(print_readably = false) {
    return "#<funcion>";
  }
}

class Atom extends MalValue {
  constructor(malValue) {
    super();
    this.malValue = malValue;
  }

  stringify(print_readably = false) {
    return `(atom ${stringify(this.malValue, print_readably)})`;
  }
}

class NilVal extends MalValue {
  constructor() {
    super();
  }

  stringify(print_readably = false) {
    return "nil";
  }
}
const Nil = new NilVal();

module.exports = {
  List,
  Vecotr,
  Str,
  Keyword,
  MalSymbol,
  Hashmap,
  Fn,
  Atom,
  Nil,
  stringify,
};
