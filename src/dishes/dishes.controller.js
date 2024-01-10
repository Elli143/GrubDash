const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
function propertyIsNotMissing(propertyName) {
    return function (req, res, next) {
        const { data = {} } = req.body;
        if (data[propertyName]) {
            if(data[propertyName] !== "") {
                return next();
            }
        }
        next({ status: 400, message: `Dish must include a ${propertyName}`})
    }
}

function priceIsValid(req, res, next) {
    const { data: { price }} = req.body;
    if(typeof price === "number") {
        if(price > 0) { // This might need to be adjusted to account for decimal numbers, depending on tests
            return next();
        }
    }
    next({ status: 400, message: 'Dish must have a price that is an integer greater than zero'})
}

function dishExists(req, res, next) {
    const { dishId } = req.params;
    const foundDish = dishes.find(dish => dish.id === dishId);
    if (foundDish) {
      res.locals.dish = foundDish;
      return next();
    }
    next({
      status: 404,
      message: `Dish does not exist: ${dishId}.`,
    });
  };

function correctDish(req, res, next) {
    const { data: { id } } = req.body;
    const dish = res.locals.dish;
    if(!id || dish.id === id) {
        return next();
    }
    next({
        status: 400,
        message: `Dish id does not match route id. Dish: ${id}, Route: ${dish.id}`
    })
}

function list (req, res) {
    res.json({ data: dishes });
}

function read (req, res) {
    const dish = res.locals.dish;
    res.json({ data: dish });
}

function create (req, res, next) {
    const { data: { name, description, price, image_url } = {} } = req.body;
    const newDish = {
      id: nextId(),
      name,
      description,
      price,
      image_url 
    };
    dishes.push(newDish);
    res.status(201).json({ data: newDish });
}

function update (req, res, next) {
    const { dishId } = req.params;
    const dish = res.locals.dish;
    const { data: { name, description, price, image_url } = {} } = req.body;
    dish.name = name;
    dish.description = description;
    dish.price = price;
    dish.image_url = image_url;
    res.status(200).json({ data: dish});
}

module.exports = {
    list,
    create: [
        propertyIsNotMissing('name'), 
        propertyIsNotMissing('description'), 
        propertyIsNotMissing('price'), 
        propertyIsNotMissing('image_url'), 
        priceIsValid, 
        create],
    read: [dishExists, read],
    update: [
        dishExists,
        propertyIsNotMissing('name'), 
        propertyIsNotMissing('description'), 
        propertyIsNotMissing('price'), 
        propertyIsNotMissing('image_url'),
        priceIsValid,
        correctDish,
        update]
};