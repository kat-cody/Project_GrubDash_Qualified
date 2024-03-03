const { stat } = require("fs");
const path = require("path");


// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
function orderExists(req, res, next) {
    //gets the id from the request
    const orderId = req.params.orderId;
    //uses find methoud to find an order in the data array that matchs the requested id
    const foundOrder = orders.find((order) => order.id === orderId)
    if (foundOrder) {
        //sets the local var order to the found order
        res.locals.order = foundOrder
        return next();
    }
    //cant find the order
    next({ 
        status: 404, 
        message: `Order does not exist: ${orderId}`
    })
}

//checks for all the diffrent required fields
function hasData(req, res, next) {
    //deconstructer of the request object
    const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
    //does order have an adress to send to?
    if(!deliverTo){
        return next({ 
            status: 400, 
            message: "Order must include a deliverTo"
        })
    }
    //does order have phone number?
    if(!mobileNumber) {
        return next({ 
            status: 400, 
            message: "Order must include a mobileNumber"
        })
    }
    //does the order have any dishes added? also checks if dishes is an array
    if(!dishes || !Array.isArray(dishes) || dishes.length === 0) {
        return next({ 
            status: 400, 
            //if dishes exsists but is empty or if it dosnt exist at all
            message: !dishes ? "Order must include a dish" : "Order must include at least one dish"
        })
    }
    //checks the quantity of each dish
    dishes.forEach((dish, index) => {
        //checks if the quantity field doesnt exist, or it is 0, or it is a negative number, or it is not a whole number. 
        if(!dish.quantity || dish.quantity <= 0 || !Number.isInteger(dish.quantity)) {
            return next({ 
                status: 400, 
                message: `Dish ${index} must have a quantity that is an integer greater than 0`
            })
        }
    })
    next();
}
//sends back an order that matchs the id
function read(req, res) {
    res.json({ data: res.locals.order })
}

function create(req, res) {
    //deconstructs the requests object
    const { data: {deliverTo, mobileNumber, dishes} = {} } = req.body;
    //creates a new object with the requests data and uses nextId to set an Id
    const newOrder = {
        id: nextId(),
        deliverTo,
        mobileNumber,
        dishes,
    }
    //adds it to the orders array
    orders.push(newOrder);
    //sends back the conformation status and the new order object
    res.status(201).json({ data: newOrder })
}

//sends back all the orders
function list(req, res, next) {
    res.json({ data: orders })
}

//updates an order, checks if the id's match, and the status is correct.
function update(req, res, next) {
    //gets the id from the request
    const orderId = req.params.orderId;
    //gets the order that was stored in local
    const foundOrder = res.locals.order;
    //deconstructs the request object
    const { data: { id, deliverTo, mobileNumber, status, dishes} = {} } = req.body;
    //sets all the properties of the order to the requested properties
    foundOrder.deliverTo = deliverTo;
    foundOrder.status = status;
    foundOrder.mobileNumber = mobileNumber;
    foundOrder.dishes = dishes;
    //checks if order id matchs the route id
    if(id && orderId !== id){
        return next({ 
            status: 400, 
            message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`
        })
    }
    //checks if the status exists and if its valid
    if(!status || status === "invalid") {
        return next({ 
            status: 400, 
            message: "Order must have a status of pending, preparing, out-for-delivery, delivered"
        })
    }
    //makes sure the order hasnt been delivered yet
    if(status === "delivered") {
        return next({ 
            status: 400, 
            message: "A delivered order cannot be changed"
        })
    }
    //sends back the updated order
res.json({ data: foundOrder })
}

function destroy(req, res, next) {
    //gets the requested id
    const orderId = req.params.orderId
    //gets the local order that matched requeted id
    const foundOrder = res.locals.order;
    //grabs the index of the order
    const index = orders.findIndex((order) => order.id === orderId)
    //wont delete if its not pending
    if(foundOrder.status !== "pending") {
        return next({ 
            status: 400, 
            message: "An order cannot be deleted unless it is pending"
        })
    }
    //deletes the order
    if (index > -1) {
        orders.splice(index, 1)
    }
    //sends back deletion status
    res.sendStatus(204)
}

module.exports = {
    list,
    create: [hasData, create],
    read: [orderExists, read],
    update: [orderExists, hasData, update],
    destroy: [orderExists, destroy],

}