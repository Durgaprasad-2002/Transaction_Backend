const { connect } = require("mongoose");

const ConnectionToDB = connect(
  "mongodb+srv://prasaddurga:1234@producttransaction.vvfxhrp.mongodb.net/?retryWrites=true&w=majority&appName=ProductTransaction"
);

module.exports = ConnectionToDB;
