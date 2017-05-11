var promise = require('bluebird');

var options = {
  // Initialization Options
  promiseLib: promise
};

var pgp = require('pg-promise')(options);
var connectionString = 'postgres://localhost:5432/citrus';
var db = pgp(connectionString);

function getRecipe(recipeURL, result) {
  db.any('select rID from recipes where recipes.url = $1', recipeURL)
    .then(function (data) {
        return result(data);
      console.log('yes');
    })
    .catch(function (err) {
      console.log(`DB Error: ${err}`);

    });
}

function createRecipe(recipe) {
  console.log('Creating recipe');
  db.none('insert into recipes(url, title, image, serving)' +
      'values($1, $2, $3, $4)',
    [recipe.url, recipe.title, recipe.image, recipe.serving])
    .then(function () {
      console.log('Recipe inserted');
      recipe.ingredients.forEach(function (item, index, array) {

        db.any('select name from ingredients where ingredients.name = $1', recipe.ingredients[index].name)
          .then(function (data) {
            if(data != "") {
              db.none('insert into ingredients(name) values($1)', recipe.ingredients[index].name)
              .then(function() {
                db.one('select rID, iID from recipes, ingredients where recipes.url = $1 AND ingredients.name = $2', [recipe.url, recipe.ingredients[index].name])
                .then(function(data) {
                  db.none('insert into recipe_ingredients(rID, iID, quantity) values($1, $2, $3)', [data.rID, data.iID, recipe.ingredients[index].quantity])
                  .then( function() {

                  })
                  .catch( function(err) {
                    console.log(err);
                  })
                })
                .catch( function(err) {
                  console.log(err);
                })
              })
              .catch(function (err) {
                console.log(err);
              });

            }
            else {
              db.one('select rID, iID from recipes, ingredients where recipes.url = $1 AND ingredients.name = $2', [recipe.url, recipe.ingredients[index].name])
              .then(function(data) {
                db.none('insert into recipe_ingredients(rID, iID, quantity) values($1, $2, $3)', [data.rID, data.iID, recipe.ingredients[index].quantity])
                .then( function() {

                })
                .catch( function(err) {
                  console.log(err);
                })
              })
              .catch( function(err) {
                console.log(err);
              })
            }
            console.log('yes');
          })
          .catch(function (err) {
            console.log(err);

          });
      });

    })
    .catch(function (err) {
      console.log(err);
    });
}

// add query functions
function getAllUsers(req, res, next) {
  db.any('select * from myusers')
    .then(function (data) {
      res.status(200)
        .json({
          status: 'success',
          data: data,
          message: 'Retrieved ALL users'
        });
    })
    .catch(function (err) {
      return next(err);
    });
}

function getSingleUser(req, res, next) {
  var userID = parseInt(req.params.id);
  db.one('select * from myusers where id = $1', userID)
    .then(function (data) {
      res.status(200)
        .json({
          status: 'success',
          data: data,
          message: 'Retrieved ONE user'
        });
    })
    .catch(function (err) {
      return next(err);
    });
}

function createUser(req, res, next) {
  req.body.age = parseInt(req.body.age);
  db.none('insert into myusers(name, age)' +
      'values(${name}, ${age})',
    req.body)
    .then(function () {
      res.status(200)
        .json({
          status: 'success',
          message: 'Inserted one user'
        });
    })
    .catch(function (err) {
      return next(err);
    });
}

function updateUser(req, res, next) {
  db.none('update myusers set name=$1, age=$2 where id=$3',
    [req.body.name, parseInt(req.body.age), parseInt(req.params.id)])
    .then(function () {
      res.status(200)
        .json({
          status: 'success',
          message: 'Updated user'
        });
    })
    .catch(function (err) {
      return next(err);
    });
}

function removeUser(req, res, next) {
  var userID = parseInt(req.params.id);
  db.result('delete from myusers where id = $1', userID)
    .then(function (result) {
      /* jshint ignore:start */
      res.status(200)
        .json({
          status: 'success',
          message: `Removed ${result.rowCount} user`
        });
      /* jshint ignore:end */
    })
    .catch(function (err) {
      return next(err);
    });
}


module.exports = {
  getRecipe: getRecipe,
  createRecipe: createRecipe,
  getAllUsers: getAllUsers,
  getSingleUser: getSingleUser,
  createUser: createUser,
  updateUser: updateUser,
  removeUser: removeUser
};
