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
//---------------------------
function createRecipe(recipe, createRecipeResult) {
  console.log('Creating recipe');
  return db.none(insertRecipe, [recipe.url, recipe.title, recipe.image, recipe.serving])
    .then(() => {
      console.log('Recipe inserted');
      return promise.map(recipe.ingredients, function(ingredient) {
        return db.any(findIngredientByName, ingredient.name)
          .then((ing) => {
            if (ing.length == 0) {
              var rid, iid;
              return db.one('select rid from recipes where url = $1', [recipe.url])
                .then(function(data) {
                  rid = data.rid;
                  return db.none(insertIngredient, ingredient.name)
                    .then(function() {
                      console.log(`Ingredient Inserted ${ingredient.name}`);
                      return db.one('select iid from ingredients where name = $1', [ingredient.name])
                        .then(function(data) {
                          iid = data.iid;
                        return db.none(insertRecipeIngredient, [rid, iid, ingredient.quantity])
                          .then(function() {
                            console.log('Recipe_Ingredient Inserted');
                          })
                          .catch(function(err) {
                            console.log(err);
                          });
                      })
                      .catch(function(err) {
                        console.log(err);
                      });
                    })
                    .catch(function(err) {
                      console.log(err);
                    });
                })
                .catch(function(err) {
                  console.log(err);
                });
            } else {
              var rid, iid;
              return db.one('select rid from recipes where url = $1', [recipe.url])
                .then(function(data) {
                  rid = data.rid;
                  return db.one('select iid from ingredients where name = $1', [ingredient.name])
                    .then(function(data) {
                      iid = data.iid;
                  return db.none(insertRecipeIngredient, [rid, iid, ingredient.quantity])
                    .then(function() {
                      console.log('Recipe_ingridient inserted');
                    })
                    .catch(function(err) {
                      console.log(err);
                    });
                })
                .catch(function(err) {
                  console.log(err);
                });
              })
              .catch(function(err) {
                console.log(err);
              });
            }
          })
          .catch((err) => {
            console.log(err);
            return createRecipeResult('Failed Inserting');
          });
      });
      createRecipeResult('Success');
    })
    .catch((err) => {
      console.log(err);
      return createRecipeResult('Failed');
    })
    .finally(() => {
      createRecipeResult('Success');
    });
    createRecipeResult('Success');
}
//---------------------------
function getRecipe(recipeURL, result) {
  //getRecipes.values = recipeURL;
  return db.any(findRecipeByURL, recipeURL)
    .then((data) => {
      console.log(`queries.js data: ${data}`);
      if (data == '')
        result("empty");
      else
        result(data);
    })
    .catch((err) => {
      console.log(`DB Error: ${err}`);
    });
}

function createRecipe1(recipe, result) {
  console.log('Creating recipe');
  var promises = [];
  return db.none(insertRecipe, [recipe.url, recipe.title, recipe.image, recipe.serving])
    .then(() => {
      console.log('Recipe inserted');
      return promise.map(recipe.ingredients, function(ingredient) {

        return db.any(findIngredientByName, ingredient.name)
          .then((ing) => {
            if (ing.length == 0) {
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
          .catch((err) => {
            console.log(err);
            return result('Error inserting');
          });


        // return insertIng(recipe, ingredient, function(ing_result) {
        //   console.log('Ing Here');
        //   if (ing_result) {
        //     promises.push(ing_result);
        //   }
        //   return promises;
        // });

      })
      // .reduce((promises)=> {
      //
      //   return promises;
      // })
      ;
    })
    .catch((err) => {
      console.log(err);
      return result('failed');
    })
    .finally(() => {
      result('Success');
    });

}

function insertIng(recipe, ingredient, result) {
  return db.any(findIngredientByName, ingredient.name)
    .then((ing) => {
      if (ing.length == 0) {
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
    .catch((err) => {
      console.log(err);
      return result('Error inserting');
    });
}

//-- create recipe functions
function a(recipe, rid) {
  return db.one('select rid from recipes where url = $1', [recipe.url])
    .then(function(data) {

      return rid(data);
    })
    .catch(function(err) {
      console.log(err);
      return rid(null);
    });
}

function b(ingredient, iid) {
  return db.one('select iid from ingredients where name = $1', [ingredient.name])
    .then(function(data) {

      return iid(data);
    })
    .catch(function(err) {
      console.log(err);
      return iid(null);
    });
}


function ingredientFound(recipe, ingredient, ingResult) {
  var rid, iid, temp;
  return a(recipe, function(result) {
    rid = result.rid;
    return b(ingredient, function(result) {
      iid = result.iid;
      return db.none(insertRecipeIngredient, [rid, iid, ingredient.quantity])
        .then(function() {
          console.log('Recipe_ingridient inserted');
          return ingResult(null);
        })
        .catch(function(err) {
          console.log(err);
        })
      return ingResult(null);
    });
  });
}

function insertRecipeIngredients(rid, iid, quantity, result) {
  return db.none(insertRecipeIngredient, [rid, iid, quantity])
    .then(function() {
      console.log('Recipe_Ingredient Inserted');
      return result(null);
    })
    .catch(function(err) {
      console.log(err);
    });
}

function ingredientNotFound(recipe, ingredient, result) {
  var rid, iid;
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
            return returned;
          });
        });
        //})
        // .catch( function(err) {
        //   console.log(err);
        // })
        //return result();
      })
      .catch(function(err) {
        console.log(err);
      })
      .finally(() => {
        return;
      });
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
