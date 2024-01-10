const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
function propertyIsNotMissing(propertyName) {
    return function (req, res, next) {
        const { data = {} } = req.body;
        if(data[propertyName]) {
            if(data[propertyName] !== "") {
                return next();
            }
        }
        next({
            status: 400,
            message: `Order must include a ${propertyName}`
        });
    }
}

function dishHasQuantity(req, res, next) {
    const { data: { dishes } } = req.body;
    if(!Array.isArray(dishes) || dishes.length == 0) {
        next({
            status: 400,
            message: 'Order must include at least one dish'
        })
    }
    for (let i = 0; i < dishes.length; i++) {
        const dish = dishes[i];
        if(dish['quantity'] && typeof dish['quantity'] === "number" && dish['quantity'] > 0) {
            // do nothing, all good here
        } else {
            return next({
                status: 400,
                message: `Dish ${i} must have a quantity that is an integer greater than 0`
            })
        }
    }
    return next();
}

function orderExists(req, res, next) {
    const { orderId } = req.params;
    const foundOrder = orders.find(order => order.id === orderId);
    if(foundOrder) {
        res.locals.order = foundOrder;
        return next();
    }
    next({
        status: 404,
        message: `Order ${orderId} could not be found`
    })
}

function correctOrder(req, res, next) {
    const { orderId } = req.params;
    const { data: { id } } = req.body;
    if(!id || orderId === id) {
        return next();
    }
    next({
        status: 400,
        message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`
    })
}

function correctStatus(req, res, next) {
    const { data: { status = "" } } = req.body;
    if(status === "delivered") {
        next({
            status: 400,
            message: 'A delivered order cannot be changed'
        })
    }
    if(status !== 'pending' && status !== 'preparing' && status !== 'out-for-delivery') {
        next({
            status: 400,
            message: 'Order must have a status of pending, preparing, out-for-delivery, delivered'
        })
    }
    return next();
}

function statusIsPending(req, res, next) {
    const {status} = res.locals.order;
    if(status && status === 'pending') {
        return next();
    }
    next({ 
        status: 400,
        message: 'An order cannot be deleted unless it is pending.'
    })
}

function list(req, res, next) {
    res.json({ data: orders });
}

function read(req, res, next) {
    const order = res.locals.order;
    res.json({ data: order });
}

function create(req, res, next) {
    const { data: { deliverTo, mobileNumber, dishes } } = req.body;
    const newOrder = {
        id: nextId(),
        deliverTo,
        mobileNumber,
        dishes
    };
    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
}

function update(req, res, next) {
    const { data: { deliverTo, mobileNumber, dishes } } = req.body;
    const order = res.locals.order;
    order.deliverTo = deliverTo;
    order.mobileNumber = mobileNumber;
    order.dishes = dishes;
    res.status(200).json({ data: order });
}

function destroy(req, res, next) {
    const { orderId } = req.params;
    const index = orders.findIndex((order) => order.id === orderId);
    // `splice()` returns an array of the deleted elements, even if it is one element
    const deletedOrders = orders.splice(index, 1);
    res.sendStatus(204);
}

module.exports = {
    list,
    create: [
        propertyIsNotMissing('deliverTo'),
        propertyIsNotMissing('mobileNumber'),
        propertyIsNotMissing('dishes'),
        dishHasQuantity,
        create
    ],
    read: [
        orderExists,
        read
    ],
    update: [
        orderExists,
        correctOrder,
        correctStatus,
        propertyIsNotMissing('deliverTo'),
        propertyIsNotMissing('mobileNumber'),
        propertyIsNotMissing('dishes'),
        dishHasQuantity,
        update
    ],
    delete: [
        orderExists,
        statusIsPending,
        destroy
    ]
}