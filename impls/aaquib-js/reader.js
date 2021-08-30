const { read } = require("fs");
const {
  List,
  Vecotr,
  Nil,
  Str,
  Keyword,
  MalSymbol,
  Hashmap,
} = require("./types");

class Reader {
  constructor(tokens) {
    this.tokens = tokens;
    this.position = 0;
  }

  peek() {
    return this.tokens[this.position];
  }

  next() {
    const token = this.peek();

    if (this.position < this.tokens.length) {
      this.position += 1;
    }

    return token;
  }
}

const read_seq = (reader, closeSymbol) => {
  reader.next();
  const ast = [];

  while (reader.peek() !== closeSymbol) {
    if (reader.peek() === undefined) {
      throw "unbalanced";
    }

    ast.push(read_form(reader));
  }

  reader.next();
  return ast;
};

const read_list = (reader) => {
  const ast = read_seq(reader, ")");
  return new List(ast);
};

const read_vector = (reader) => {
  const ast = read_seq(reader, "]");
  return new Vecotr(ast);
};

const read_hashmap = (reader) => {
  const ast = read_seq(reader, "}");
  const hashmap = new Map();

  for (let i = 0; i < ast.length; i += 2) {
    if (ast[i] instanceof Str || ast[i] instanceof Keyword) {
      hashmap.set(ast[i], ast[i + 1]);
    } else {
      throw "Hashmap key shold be a string or keyword";
    }
  }

  return new Hashmap(hashmap);
};

const read_atom = (reader) => {
  const token = reader.next();

  if (token.match(/^-?[0-9]+$/)) {
    return parseInt(token);
  }
  if (token.match(/^-?[0-9][0-9.]*$/)) {
    return parseFloat(token);
  }

  if (token === "true") {
    return true;
  }
  if (token === "false") {
    return false;
  }

  if (token === "nil") {
    return Nil;
  }

  if (token.startsWith(":")) {
    return new Keyword(token.slice(1));
  }

  if (token.match(/^"(?:\\.|[^\\"])*"$/)) {
    const str = token
      .slice(1, -1)
      .replace(/\\(.)/g, (_, c) => (c === "n" ? "\n" : c));
    return new Str(str);
  }

  if (token.startsWith('"')) {
    throw "unbalanced";
  }

  return new MalSymbol(token);
};

const read_at = (reader) => {
  reader.next();
  return new List([new MalSymbol("deref"), new MalSymbol(reader.peek())]);
};

const read_form = (reader) => {
  const token = reader.peek();
  switch (token[0]) {
    case "(":
      return read_list(reader);
    case ")":
      throw "unbalanced )";
    case "[":
      return read_vector(reader);
    case "]":
      throw "unbalanced ]";
    case "{":
      return read_hashmap(reader);
    case "}":
      throw "unbalanced }";
    case "@":
      return read_at(reader);
    case ";":
      reader.next();
      return read_form(reader);
    default:
      return read_atom(reader);
  }
};

const tokenize = (str) => {
  const re = /[\s,]*(~@|[\[\]{}()'`~^@]|"(?:\\.|[^\\"])*"?|;.*|[^\s\[\]{}('"`,;)]*)/g;
  return [...str.matchAll(re)].map((el) => el[1]).slice(0, -1);
};

const read_str = (str) => {
  const tokens = tokenize(str);
  const reader = new Reader(tokens);
  return read_form(reader);
};

module.exports = {
  read_str,
};
