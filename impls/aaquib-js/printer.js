const { stringify } = require("./types");

const pr_str = (val, print_readably) => {
  return stringify(val, print_readably);
};

module.exports = { pr_str };
