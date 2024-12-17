const { CUSTOMER_SERVICE, SHOPPING_SERVICE } = require("../config");
const ProductService = require("../services/product-service");
const {PublishCustomerEvent,PublishShoppingEvent} = require("../utils");
const UserAuth = require("./middlewares/auth");

module.exports = (app, channel) => {
  const service = new ProductService();

  app.post("/product/create", async (req, res, next) => {
    const { name, desc, type, unit, price, available, suplier, banner } =
      req.body;
    // validation
    const { data } = await service.CreateProduct({
      name,
      desc,
      type,
      unit,
      price,
      available,
      suplier,
      banner,
    });
    return res.json(data);
  });

  app.get("/category/:type", async (req, res, next) => {
    const type = req.params.type;

    try {
      const { data } = await service.GetProductsByCategory(type);
      return res.status(200).json(data);
    } catch (error) {
      return res.status(404).json({ error });
    }
  });

  app.get("/:id", async (req, res, next) => {
    const productId = req.params.id;

    try {
      const { data } = await service.GetProductDescription(productId);
      return res.status(200).json(data);
    } catch (error) {
      return res.status(404).json({ error });
    }
  });

  app.post("/ids", async (req, res, next) => {
    const { ids } = req.body;
    const products = await service.GetSelectedProducts(ids);
    return res.status(200).json(products);
  });

  app.put("/wishlist", UserAuth, async (req, res, next) => {
    const { _id } = req.user;

    const { data } = await service.GetProductPayload(
      _id,
      { productId: req.body._id },
      "ADD_TO_WISHLIST"
    );

    PublishCustomerEvent(data);
    // PublishMessage(channel, CUSTOMER_SERVICE, JSON.stringify(data));

    res.status(200).json(data.data.product);
  });

  app.delete("/wishlist/:id", UserAuth, async (req, res, next) => {
    const { _id } = req.user;
    const productId = req.params.id;

    const { data } = await service.GetProductPayload(
      _id,
      { productId },
      "REMOVE_FROM_WISHLIST"
    );
    PublishCustomerEvent(data);
    // PublishMessage(channel, CUSTOMER_SERVICE, JSON.stringify(data));

    res.status(200).json(data.data.product);
  });

  app.put("/cart", UserAuth, async (req, res, next) => {
    const { _id } = req.user;
  
    // Ensure that `qty` is passed in the request body
    const { _id: productId, qty } = req.body;
  
    if (!qty) {
      return res.status(400).json({ error: 'Quantity is required' });
    }
  
    const { data } = await service.GetProductPayload(
      _id,
      { productId, qty },
      "ADD_TO_CART"
    );
  
    if (data.error) {
      return res.status(404).json(data);
    }
  
    PublishCustomerEvent(data);
    PublishShoppingEvent(data);
  
    console.log("Data....", data);
  
    const response = { product: data.data.product, unit: data.qty };
    res.status(200).json(response);
  });
  

  app.delete("/cart/:id", UserAuth, async (req, res, next) => {
    const { _id } = req.user;
    const productId = req.params.id;
    console.log("Req body",req.body);
    const { qty = 1 } = req.body;  // Extract qty from the request body
  
    // If qty is not provided, you can either handle it as an error or set a default
    if (!qty) {
      return res.status(400).json({ error: 'Quantity is required' });
    }
  
    // Call the service method to remove the product from the cart
    const { data } = await service.GetProductPayload(
      _id,
      { productId, qty },
      "REMOVE_FROM_CART"
    );
  
    if (data.error) {
      return res.status(404).json(data);
    }
  
    PublishCustomerEvent(data);
    PublishShoppingEvent(data);
  
    console.log("Remove cart data: ", data);
  
    // Prepare the response with product and qty
    const response = { product: data.data.product, unit: data.qty };
  
    res.status(200).json(response);
  });
  
  app.get("/whoami", (req, res, next) => {
    return res
      .status(200)
      .json({ msg: "/ or /products : I am products Service" });
  });

  //get Top products and category
  app.get("/", async (req, res, next) => {
    //check validation
    try {
      const { data } = await service.GetProducts();
      return res.status(200).json(data);
    } catch (error) {
      return res.status(404).json({ error });
    }
  });
};
