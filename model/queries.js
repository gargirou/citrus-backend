var promise = require('bluebird');

var options = {
  // Initialization Options
  promiseLib: promise
};

var pgp = require('pg-promise')(options);
var connectionString = 'postgres://localhost:5432/citrus';
var db = pgp(connectionString);

var findRecipeByURL = 'select url, title, image, serving from recipes where recipes.url = $1';
var insertRecipe = 'insert into recipes(url, title, image, serving) values($1, $2, $3, $4)';
var findIngredientByName = 'select name from ingredients where ingredients.name = $1';
var insertIngredient = 'insert into ingredients(name) values($1)';
var findRecipeIngredientKey = 'select rID, iID from recipes, ingredients where (recipes.url = $1 AND ingredients.name = $2)';
var insertRecipeIngredient = 'insert into recipe_ingredients(rID, iID, quantity) values($1, $2, $3)';

function getRecipe(recipeURL, result) {
  //getRecipes.values = recipeURL;
 db.any(findRecipeByURL, recipeURL)
    .then((data) => {
      console.log(`queries.js data: ${data}`);
      if(data == '')
        return result("empty");
      else
        return result(data);
    })
    .catch((err) => {
      console.log(`DB Error: ${err}`);
    });
}

function createRecipe(recipe, result) {
  console.log('Creating recipe');
  var promises = [];
  return db.none(insertRecipe, [recipe.url, recipe.title, recipe.image, recipe.serving])
    .then(()=> {
      result('Success');
      console.log('Recipe inserted');
      return promise.map(recipe.ingredients, function(ingredient) {
        return insertIng(recipe, ingredient, function(ing_result) {
          console.log('Ing Here');
          if(ing_result) {
            promises.push(ing_result);
          }
          return promises;
        });

      }).reduce(function(promises) {

          return promises;
        });

    })
    .catch((err)=> {
      console.log(err);
      return result('failed');
    });

}

function insertIng(recipe, ingredient, result) {
  return db.any(findIngredientByName, ingredient.name)
    .then((ing)=> {
      if(ing.length == 0) {
        //console.log(`Ing not found ${ingredient.name}`);
        return ingredientNotFound(recipe, ingredient, function(returned) {
          return result(returned);
        });
      } else {
        //console.log(`Ing found ${ingredient.name}`);
        return ingredientFound(recipe, ingredient, function(returned) {
          return result(returned);
        });
      }
    })
    .catch((err)=> {
      console.log(err);
      return result('Error inserting');
    });
}

//-- create recipe functions
function a(recipe, rid) {
  return db.one('select rid from recipes where url = $1', [recipe.url])
    .then( function(data) {

      return rid(data);
    })
  .catch( function(err) {
    console.log(err);
    return null;
  });
}

function b(ingredient, iid) {
  return db.one('select iid from ingredients where name = $1', [ingredient.name])
    .then( function(data) {

      return iid(data);
    })
  .catch( function(err) {
    console.log(err);
    return null;
  });
}


function ingredientFound(recipe, ingredient, result) {
  var rid, iid, temp;
  return a(recipe, function(result) {

    rid = result.rid;
    return b(ingredient, function(result) {

      iid = result.iid;

  return db.none(insertRecipeIngredient, [rid, iid, ingredient.quantity])
    .then( function() {
      console.log('Recipe_ingridient inserted');
      return null;
    })
    .catch( function(err) {
      console.log(err);
    })
    return null;
  });
});
}

function insertRecipeIngredients(rid, iid, quantity, result) {
  return db.none(insertRecipeIngredient, [rid, iid, quantity])
  .then( function() {
    console.log('Recipe_Ingredient Inserted');
    return result();
  })
  .catch( function(err) {
    console.log(err);
  })
}

function ingredientNotFound(recipe, ingredient, result) {
  var rid, iid, temp;
  return a(recipe, function(result) {
    rid = result.rid;

  return db.none(insertIngredient, ingredient.name)
  .then(function() {
    console.log(`Ingredient Inserted ${ingredient.name}`);
    // return db.one(findRecipeIngredientKey, [recipe.url, ingredient.name])
    // .then(function(data) {
      return b(ingredient, function(result) {
        iid = result.iid;

      return insertRecipeIngredients(rid, iid, ingredient.quantity, function(returned) {
      });
        });
    //})
    // .catch( function(err) {
    //   console.log(err);
    // })
    //return result();
  })
  .catch(function (err) {
    console.log(err);
  });
  });
  return null;
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
