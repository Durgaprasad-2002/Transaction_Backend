const Product = require("../models/Product");

async function IntialzeDatabaseFromAPI(req, res) {
  try {
    const DataFromAPI = await fetch(
      "https://s3.amazonaws.com/roxiler.com/product_transaction.json"
    );
    const JSON_ConvertedData = await DataFromAPI.json();

    await Product.deleteMany({});

    const result = await Product.insertMany([...JSON_ConvertedData]);

    return res.status(200).json({
      msg: "Data Initialized with Third Party API",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ msg: "Failed to Initialize Database", err: error });
  }
}

async function ListAllProducts(req, res) {
  try {
    const { search = "", month } = req.query;
    const monthNumber = parseInt(month);

    const aggregationPipeline = [
      {
        $addFields: {
          dateOfSale: { $dateFromString: { dateString: "$dateOfSale" } },
          monthOfProduct: {
            $month: { $dateFromString: { dateString: "$dateOfSale" } },
          },
        },
      },
      {
        $match: {
          monthOfProduct: monthNumber,
          $or: [
            { title: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
            { price: { $regex: search } },
          ],
        },
      },
    ];

    const result = await Product.aggregate(aggregationPipeline);

    return res.status(200).json({
      products: result,
      TotalProducts: result.length,
      Pages: Math.ceil(result.length / 10),
      search,
      month,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ msg: "Failed to Fetch Data from Database", err: error });
  }
}

async function Statistics(req, res) {
  try {
    const { month } = req.query;
    const monthNumber = parseInt(month);

    const aggregationPipeline = [
      {
        $addFields: {
          dateOfSale: { $dateFromString: { dateString: "$dateOfSale" } },
          monthOfProduct: {
            $month: { $dateFromString: { dateString: "$dateOfSale" } },
          },
        },
      },
      {
        $match: { monthOfProduct: monthNumber },
      },
      {
        $group: {
          _id: null,
          SaleAmount: {
            $sum: { $cond: [{ $eq: ["$sold", true] }, "$price", 0] },
          },
          SoldItems: {
            $sum: { $cond: [{ $eq: ["$sold", true] }, 1, 0] },
          },
          NotSoldItems: {
            $sum: { $cond: [{ $eq: ["$sold", false] }, 1, 0] },
          },
        },
      },
    ];

    const result = await Product.aggregate(aggregationPipeline);
    const finalResult = result[0] || {
      SaleAmount: 0,
      SoldItems: 0,
      NotSoldItems: 0,
    };

    return res.status(200).json(finalResult);
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ msg: "Failed to Fetch Statistics from Database", err: error });
  }
}

async function BarChart(req, res) {
  try {
    const { month } = req.query;
    const monthNumber = parseInt(month);

    const priceRanges = {
      "0 - 100": 0,
      "101 - 200": 0,
      "201 - 300": 0,
      "301 - 400": 0,
      "401 - 500": 0,
      "501 - 600": 0,
      "601 - 700": 0,
      "701 - 800": 0,
      "801 - 900": 0,
      "901-above": 0,
    };

    const aggregationPipeline = [
      {
        $addFields: {
          dateOfSale: { $dateFromString: { dateString: "$dateOfSale" } },
          monthOfProduct: {
            $month: { $dateFromString: { dateString: "$dateOfSale" } },
          },
          priceCategory: {
            $switch: {
              branches: [
                { case: { $lte: ["$price", 100] }, then: "0 - 100" },
                { case: { $lte: ["$price", 200] }, then: "101 - 200" },
                { case: { $lte: ["$price", 300] }, then: "201 - 300" },
                { case: { $lte: ["$price", 400] }, then: "301 - 400" },
                { case: { $lte: ["$price", 500] }, then: "401 - 500" },
                { case: { $lte: ["$price", 600] }, then: "501 - 600" },
                { case: { $lte: ["$price", 700] }, then: "601 - 700" },
                { case: { $lte: ["$price", 800] }, then: "701 - 800" },
                { case: { $lte: ["$price", 900] }, then: "801 - 900" },
              ],
              default: "901-above",
            },
          },
        },
      },
      {
        $match: { monthOfProduct: monthNumber },
      },
      {
        $group: {
          _id: "$priceCategory",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          priceCategory: "$_id",
          count: 1,
        },
      },
    ];

    const result = await Product.aggregate(aggregationPipeline);
    const finalResult = result.reduce((acc, { priceCategory, count }) => {
      acc[priceCategory] = count;
      return acc;
    }, priceRanges);

    return res.status(200).json(finalResult);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: "Failed to Calculate BarChart Data from Database",
      err: error,
    });
  }
}

async function PieChart(req, res) {
  try {
    const { month } = req.query;

    const monthNumber = parseInt(month);

    const aggregationPipeline = [
      {
        $addFields: {
          dateOfSale: { $dateFromString: { dateString: "$dateOfSale" } },
          monthOfProduct: {
            $month: { $dateFromString: { dateString: "$dateOfSale" } },
          },
        },
      },
      {
        $match: { monthOfProduct: monthNumber },
      },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          count: 1,
        },
      },
    ];

    const result = await Product.aggregate(aggregationPipeline);
    const finalResult = result.reduce((acc, { category, count }) => {
      acc[category] = count;
      return acc;
    }, {});

    return res.status(200).json(finalResult);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: "Failed to Calculate PieChart Data from Database",
      err: error,
    });
  }
}

const GetAllThree = async (req, res) => {
  try {
    const { month } = req.query;
    const monthNumber = parseInt(month);

    const statisticsPipeline = [
      {
        $addFields: {
          dateOfSale: { $dateFromString: { dateString: "$dateOfSale" } },
          monthOfProduct: {
            $month: { $dateFromString: { dateString: "$dateOfSale" } },
          },
        },
      },
      {
        $match: { monthOfProduct: monthNumber },
      },
      {
        $group: {
          _id: null,
          SaleAmount: {
            $sum: { $cond: [{ $eq: ["$sold", true] }, "$price", 0] },
          },
          SoldItems: {
            $sum: { $cond: [{ $eq: ["$sold", true] }, 1, 0] },
          },
          NotSoldItems: {
            $sum: { $cond: [{ $eq: ["$sold", false] }, 1, 0] },
          },
        },
      },
    ];

    const barChartPipeline = [
      {
        $addFields: {
          dateOfSale: { $dateFromString: { dateString: "$dateOfSale" } },
          monthOfProduct: {
            $month: { $dateFromString: { dateString: "$dateOfSale" } },
          },
          priceCategory: {
            $switch: {
              branches: [
                { case: { $lte: ["$price", 100] }, then: "0 - 100" },
                { case: { $lte: ["$price", 200] }, then: "101 - 200" },
                { case: { $lte: ["$price", 300] }, then: "201 - 300" },
                { case: { $lte: ["$price", 400] }, then: "301 - 400" },
                { case: { $lte: ["$price", 500] }, then: "401 - 500" },
                { case: { $lte: ["$price", 600] }, then: "501 - 600" },
                { case: { $lte: ["$price", 700] }, then: "601 - 700" },
                { case: { $lte: ["$price", 800] }, then: "701 - 800" },
                { case: { $lte: ["$price", 900] }, then: "801 - 900" },
              ],
              default: "901-above",
            },
          },
        },
      },
      {
        $match: { monthOfProduct: monthNumber },
      },
      {
        $group: {
          _id: "$priceCategory",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          priceCategory: "$_id",
          count: 1,
        },
      },
    ];

    const pieChartPipeline = [
      {
        $addFields: {
          dateOfSale: { $dateFromString: { dateString: "$dateOfSale" } },
          monthOfProduct: {
            $month: { $dateFromString: { dateString: "$dateOfSale" } },
          },
        },
      },
      {
        $match: { monthOfProduct: monthNumber },
      },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          count: 1,
        },
      },
    ];

    const [statisticsResult, barChartResult, pieChartResult] =
      await Promise.all([
        Product.aggregate(statisticsPipeline),
        Product.aggregate(barChartPipeline),
        Product.aggregate(pieChartPipeline),
      ]);

    const statistics = statisticsResult[0] || {
      SaleAmount: 0,
      SoldItems: 0,
      NotSoldItems: 0,
    };
    const barChart = barChartResult.reduce(
      (acc, { priceCategory, count }) => {
        acc[priceCategory] = count;
        return acc;
      },
      {
        "0 - 100": 0,
        "101 - 200": 0,
        "201 - 300": 0,
        "301 - 400": 0,
        "401 - 500": 0,
        "501 - 600": 0,
        "601 - 700": 0,
        "701 - 800": 0,
        "801 - 900": 0,
        "901-above": 0,
      }
    );
    const pieChart = pieChartResult.reduce((acc, { category, count }) => {
      acc[category] = count;
      return acc;
    }, {});

    return res.status(200).json({ statistics, barChart, pieChart });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: "Failed to get All Statistics Data Data from Database",
      err: error,
    });
  }
};

module.exports = {
  IntialzeDatabaseFromAPI,
  ListAllProducts,
  Statistics,
  BarChart,
  PieChart,
  GetAllThree,
};
