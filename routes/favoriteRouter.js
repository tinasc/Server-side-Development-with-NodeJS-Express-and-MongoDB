const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
var authenticate = require('../authenticate');
const cors = require('./cors');

const Favorites = require('../models/favorite');


const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, authenticate.verifyUser,  (req,res,next) => {
    Favorites.find({})
    .populate('markedBy')
    .populate('dishes')
    .then((Favorites) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favorites);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post( cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    var userId = mongoose.Types.ObjectId(req.user._id);
    Favorites.findOne({ markedBy: userId })
    .then((favorite) => {
    if (favorite == null || favorite.length == 0) {
        console.log("User does not have a favorite dish yet.");
        var dishList = [];
        dishList.push(req.params.dishId);
        req.body.user = req.user._id;
        req.body.dishes = dishList;
        favorite = [];
        favorite.push(req.body);
        Favorites.create(favorite)
        .then((favorite) => {
            console.log('Favorite Created ', favorite);            
            res.statusCode = 200;            
            res.setHeader('Content-Type', 'application/json');
            res.json(favorite);
            }, (err) => next(err));          
    } else {            
        console.log("User already has a favorite dish");            
        console.log(favorite[0].user);            
        favorite[0].dishes.push(req.params.dishId);            
        favorite[0].save()            
        .then((favorite) => {           
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json'); 
        res.json(favorite);
        }, (err) => next(err));      
        }  
        }, (err) => next(err))
        .catch((err) => next(err))
})

.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end("PUT operation is not supported on /favorites");
  })

.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    var userId = mongoose.Types.ObjectId(req.user._id);
    Favorites.remove({markedBy: userId })
    .then((resp) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    }, (err) => next(err))
    .catch((err) => next(err));
});

favoriteRouter.route('/:dishId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin,(req, res, next)=> {
    var dishId = req.params.dishId;
    Favorites.findByIdAndRemove(dishId) 
        .then((resp) => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(resp);
        }, (err) => next(err))
        .catch((err) => next(err));
    });

module.exports=favoriteRouter;