var express = require("express");               
var app = express();
var bodyParser = require("body-parser"); 
var handlebars = require("express-handlebars").create({defaultLayout: "main"});
var mysql = require("mysql");

////////////////////////////////////////////////////////////

var pool = mysql.createPool({                   //Create the pool in the document instead of using dbcon.js.
    host: "classmysql.engr.oregonstate.edu",        
    user: "cs290_domingte",
    password: "6580",                          
    database: "cs290_domingte"
});

///////////////////////////////////////////////////////////////

app.engine("handlebars", handlebars.engine);        
app.set("view engine", "handlebars");
app.set("port", 3665);                             
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(express.static("public"));

////////////////////////////////////////////////////////

app.get('/reset-table',function(req,res,next){                  
    var context = {};


    pool.query("DROP TABLE IF EXISTS workouts", function(err){

        var createString = "CREATE TABLE workouts("+
        "id INT PRIMARY KEY AUTO_INCREMENT,"+
        "name VARCHAR(255) NOT NULL,"+
        "reps INT,"+
        "weight INT,"+
        "date DATE,"+
        "lbs BOOLEAN)";

        pool.query(createString, function(err){
            res.render('table',context);
        })    });});

app.get('/', function(req, res, next){
    var context = {};
    pool.query('SELECT * FROM workouts', function(err, rows, fields){           
    if(err){                                                                    
        next(err);
        return;
    }
    var params = [];                                //keep track of the parameters
    for(var row in rows){
        var addItem = {'name': rows[row].name, 
                    'reps': rows[row].reps, 
                    'weight': rows[row].weight, 
                    'date':rows[row].date, 
                    'id':rows[row].id};
        if(rows[row].lbs){
            addItem.lbs = "lbs";
        }
        else{
            addItem.lbs = "kg";
        }
        params.push(addItem);                   //Use push to add all
    }
    context.results = params;
    res.render('table', context);               //Display the table
    })
});


/////////////////////////////////////////////////////
app.get('/insert',function(req,res,next){
  var context = {};
   pool.query("INSERT INTO `workouts` (`name`, `reps`, `weight`, `date`, `lbs`) VALUES (?, ?, ?, ?, ?)", //From lecture, we use '?' to indicate user supplied data
    [req.query.exercise,                //All of these are required so our database can't be messed with
    req.query.reps, 
    req.query.weight, 
    req.query.date, 
    req.query.unitCheck], 
    function(err, result){
        if(err){
          next(err);
          return;
        }         
        context.inserted = result.insertId;
        res.send(JSON.stringify(context));
  });
});

//////////////////////////////////////////////////////
app.get('/delete', function(req, res, next) {
    var context = {};    
    pool.query("DELETE FROM `workouts` WHERE id = ?",   //Call delete on the database and require the id 
        [req.query.id], 
        function(err, result) {
            if(err){
                next(err);
                return;
            }
    });
});

///////////////////////////////////////////////////////
app.get('/updateTable',function(req, res, next){
    var context = {};
    pool.query('SELECT * FROM `workouts` WHERE id=?',   //Select all with the id we want
        [req.query.id], 
        function(err, rows, fields){
            if(err){
                next(err);
                return;
            }
            var param = [];

            for(var row in rows){                           //Similar to adding
                var addItem = {'name': rows[row].name, 
                            'reps': rows[row].reps, 
                            'weight': rows[row].weight, 
                            'date':rows[row].date, 
                            'lbs':rows[row].lbs,
                            'id':rows[row].id};

                param.push(addItem);
            }

        context.results = param[0];                      //object goes to updateTable page
        res.render('updateTable', context);
    });
});

//////////////////////////////////////////////////////////
app.get('/updateReturn', function(req, res, next){
    var context = {};

    pool.query("SELECT * FROM `workouts` WHERE id=?", //Requrie the ID and use '?'
        [req.query.id], 
        function(err, result){
            if(err){
                next(err);
                return;
            }
            if(result.length == 1){                
                var current = result[0];

                
                if(req.query.unitCheck === "on"){
                    req.query.unitCheck = "1";
                }
                else{
                    req.query.unitCheck = "0";
                }

                pool.query('UPDATE `workouts` SET name=?, reps=?, weight=?, date=?, lbs=? WHERE id=?',  //Make a query to UPDATE and require either what the name is now or the updated name
                [req.query.exercise || current.name, 
                req.query.reps || current.reps, 
                req.query.weight || current.weight, 
                req.query.date || current.date, 
                req.query.unitCheck, 
                req.query.id],
                function(err, result){
                    if(err){
                        next(err);
                        return;
                    }

                    pool.query('SELECT * FROM `workouts`', function(err, rows, fields){     
                        if(err){
                            next(err);
                            return;
                        }
                        var param = [];

                        for(var row in rows){
                            var addItem = {'name': rows[row].name,      //Similar to adding
                            'reps': rows[row].reps,
                            'weight': rows[row].weight, 
                            'date':rows[row].date, 
                            'id':rows[row].id};

                            if(rows[row].lbs){              //Logic to distinguish between lbs and kg
                                addItem.lbs = "lbs";
                            }
                            else{
                                addItem.lbs = "kg";
                            }
                            param.push(addItem);            //Push the items so they can be displayed
                        }

                        context.results = param;
                        res.render('table', context);       //Display everything 
                    });
                });}    });
});

//////////////////////////////////////////////
app.use(function(req, res){                 //Standard error handling
	res.status(404);
	res.render("404");
});

app.use(function(err, req, res, next){
	console.log(err.stack);
	res.status(500);
	res.render("500");
});

app.listen(app.get("port"), function(){             //Let's us know the port is up and running
	console.log("Express started on port 3665");
});