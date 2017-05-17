var request   = require('request');
var cheerio   = require('cheerio');
var strHelper = require('../util/string-helper');
var foodVars  = require('./food52');
var db        = require('./queries');


//Reset foodSource object parameters
function resetObject(foodSource) {
  foodSource.ingredients = foodVars.searchPartOfURL;
  foodSource.links = [];
}

//Pick out ingredients from the url variable
function extractIngredientsFromURL(foodSource, allIngredients) {
  var ingsArr = allIngredients.split(foodSource.delim);
  for(let i = 0; i < ingsArr.length; i++) {
    foodSource.ingredients += ingsArr[i] + '+';
  }
}

//Get links to recipes
function scrapeRecipeLinks(req, res) {
  //Food Scraping Object
  foodSource = foodVars.foodSource;
  resetObject(foodSource);
  extractIngredientsFromURL(foodSource, req.params.ings);

  request(foodSource.url(), function(error, response, html){
    if(!error){
      var $ = cheerio.load(html);

      //Loop through links
      $(foodSource.linksSelector).each(function(i, elem) {
          foodSource.links[i] = ($(this).attr('href'));
          console.log($(this).attr('href'));
      });

      console.log("End Links");
      //res.send(JSON.stringify(foodSource));
    } else {
      console.log(error);
    }
    getRecipes(res, foodSource);
  });
  return foodSource;
}

function getRecipes(res, food) {
  recipeSelectors = foodVars.recipeSelectors;
  recipes = foodVars.recipes;
  var recipes = [];
  //Loop through each food url
  food.links.forEach(function (item, index, array) {
    var recipeURL = foodVars.foodSiteURL + food.links[index];
    //Check if recipeURL is in db, if so recipes[index] = returned object, else load html.
    var result = db.getRecipe(recipeURL, function(returned) {
      console.log(`scraper.js: ${returned}`);
      result = returned;
    });

    request(recipeURL, function(error, response, html) {
      if(!error) {
        if(result != 'empty') {
          console.log(`not empty: ${result}`);
          recipes[index] = result;
        } else {
          var $ = cheerio.load(html);
          recipes[index] = {
            url         : recipeURL,
            title       : strHelper.superTrim($(recipeSelectors.title).text()),
            image       : $(recipeSelectors.image).attr('src'),
            serving     : strHelper.superTrim($(recipeSelectors.serving).text()),
            ingredients : []
          };
          $(recipeSelectors.ingredients).each(function(i, elem) {
            recipes[index].ingredients[i] = {
              quantity : $(this).children(recipeSelectors.ingQuantity).text().trim(),
              name     : $(this).children(recipeSelectors.ingText).text().trim()
            };
          });
          //Insert recipe into db
          db.createRecipe(recipes[index], function(returned) {
            console.log(`Returned Recipe: ${returned}`);
          });
        }
        res.write(JSON.stringify(recipes[index]));
        res.write('\n');

        } else {
          console.log(error);
        }
    });
  });
}

//Load food page and retrieve recipe links
function getPage(req, res, next) {
  //Begins scraping of recipes
  scrapeRecipeLinks(req, res);
  //Timeout terminates hanging requests
  setTimeout(function() {
    res.end();
  }, 25000);
}

module.exports = {
  getPage: getPage
};
