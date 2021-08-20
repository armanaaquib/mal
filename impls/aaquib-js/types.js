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
  Nil,
  stringify,
};
