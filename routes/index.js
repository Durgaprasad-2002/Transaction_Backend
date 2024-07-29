const { Router } = require("express");
const {
  IntialzeDatabaseFromAPI,
  ListAllProducts,
  Statistics,
  BarChart,
  PieChart,
  GetAllThree,
} = require("../controllers/index");

const router = Router();

router.get("/IntializeDbData", IntialzeDatabaseFromAPI);

router.get("/ListAllProducts", ListAllProducts);

router.get("/Statistics", Statistics);

router.get("/BarChart", BarChart);

router.get("/PieChart", PieChart);

router.get("/GetAllThree", GetAllThree);

module.exports = router;
