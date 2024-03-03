const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
//checks to see if th dish exisits



//Middleware functions
function dishExists(req, res, next) {
    //gets the id from the request
    const dishId = req.params.dishId
    //sets foundDish to the dish that has a matching id to the one in the request
    const foundDish = dishes.find((dish) => dish.id === dishId)
    if (foundDish) {
        //updates the local dish for all the handlers to use
        res.locals.dish = foundDish;
        return next();
    }
    next({
        status: 404,
        message: `Dish does not exist: ${dishId}`,
    })
}

function hasData(req, res, next) {
    //deconstructing the request body 
    const { data: { name, description, price, image_url } = {} } = req.body;
    //tests the diffrent fields if they exist, if any dont then send back error
    if (!name) {
        return next({ 
            status: 400, 
            message: "Dish must include a name"
        })
    }
    if(!description) {
        return next({ 
            status: 400, 
            message: "Dish must have a description"
        })
    }
    if(!price) {
        return next ({ 
            status: 400, 
            message: "Dish must include a price"
        })
    }
    if(!Number.isInteger(price) || price < 0) {
        return next ({ 
            status: 400, 
            message: "Dish must have a price that is an integer greater than 0"
        })
    }
    if (!image_url) {
        return next ({ 
            status: 400, 
            message: "Dish must include a image_url"
        })
    }
    next();

}
//Handlers

//gets all the dishes and sends them
function list(req, res) {
    res.json({ data: dishes })
}
//gets 1 dish and sends it back
function read(req, res) {
    res.json({ data: res.locals.dish })
}

//creates a new dish
function create(req, res) {
// deconstructer
const { data: {name, description, price, image_url} = {} } = req.body;
//creates a new dish with all the propertys given from the post request
const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
}
//adds the new dish to the disshes array
dishes.push(newDish);
//sends back 201 status and the new dish object
res.status(201).json({ data: newDish })
}



function update(req, res, next) {
    //gets the dish id from the request
    const dishId = req.params.dishId;
    //grabs the dish from the local
    const foundDish = res.locals.dish
    //deconstructs the dish
    const { data: { id, name, description, price, image_url } = {} } = req.body;
    //sets all the properties of the local dish to the requests propeties 
    foundDish.name = name;
    foundDish.description = description;
    foundDish.price = price;
    foundDish.image_url = image_url;
    //if the dishId is not equal to the one id in the request id then send an error
    if(id && dishId !== id) {
        return next({ 
            status: 400, 
            message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`
        })
    }
    //send a response with the updated foundDish
    res.json({ data: foundDish })
}

module.exports = {
    list,
    create: [hasData, create],
    read: [dishExists, read],
    update: [dishExists, hasData, update]


}