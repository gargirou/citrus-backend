var Promise = require('bluebird');
var request = Promise.promisify(require('request'));
var requestPromise = (require('request-promise'));

var cheerio = require('cheerio');
var strHelper = require('../util/string-helper');
var foodVars = require('./food52');
var db = require('./queries');

var events = require('events');
var eventEmitter = new events.EventEmitter();


var recipes = [];
var c = 0;
//Loop through each food url
var index = 0;
var recipeSelectors;
var globalFood;
var globalRes;
var globalRecipeResult;
//Reset foodSource object parameters

eventEmitter.on('finish', function(res) {
  console.log('Event Finished');
  globalRes.end();
});
function resetObject(foodSource) {
  foodSource.ingredients = foodVars.searchPartOfURL;
  foodSource.links = [];
}

//Pick out ingredients from the url variable
function extractIngredientsFromURL(foodSource, allIngredients) {
  var ingsArr = allIngredients.split(foodSource.delim);
  for (let i = 0; i < ingsArr.length; i++) {
    foodSource.ingredients += ingsArr[i] + '+';
  }
}

//Get links to recipes
function scrapeRecipeLinks(req, res, scrapeResult) {
  //Food Scraping Object
  foodSource = foodVars.foodSource;
  resetObject(foodSource);
  extractIngredientsFromURL(foodSource, req.params.ings);

  request(foodSource.url(), function(error, response, html) {
    if (!error) {
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

    getRecipes(res, foodSource, function(result) {
      console.log(`End: ${result}`);
      return scrapeResult('Done');
    });
  });

}

function doRecipe(index, max) {
  console.log(`StartIndex: ${index}`)
  console.log('GrabRecipe');
  if (index >= max) {
    eventEmitter.emit('finish');
  } else {
    console.log('Starting Loop');
    var recipeURL = foodVars.foodSiteURL + globalFood.links[index];
    //Check if recipeURL is in db, if so recipes[index] = returned object, else load html.
    var result = db.getRecipe(recipeURL, function(returned) {
      console.log(`scraper.js: ${returned}`);
      result = returned;
    });
console.log('before request');
    requestPromise(recipeURL)
      .then((html) => {

        if (result != 'empty') {
          console.log(`not empty: ${result}`);
          recipes[index] = result;
          globalRes.write(JSON.stringify(recipes[index]));
          globalRes.write('\n');
          eventEmitter.emit('grabRecipe', ++index, 24);
        } else {
          var $ = cheerio.load(html);
          recipes[index] = {
            url: recipeURL,
            title: strHelper.superTrim($(recipeSelectors.title).text()),
            image: $(recipeSelectors.image).attr('src'),
            serving: strHelper.superTrim($(recipeSelectors.serving).text()),
            ingredients: []
          };
          $(recipeSelectors.ingredients).each(function(i, elem) {
            recipes[index].ingredients[i] = {
              quantity: $(this).children(recipeSelectors.ingQuantity).text().trim(),
              name: $(this).children(recipeSelectors.ingText).text().trim()
            };
          });
          //Insert recipe into db
          db.createRecipe(recipes[index], function(result) {
            console.log(`Returned Recipe: ${++c}`);
            globalRes.write(JSON.stringify(recipes[index]));
            globalRes.write('\n');
            console.log(`Index: ${index}`);
            eventEmitter.emit('grabRecipe', ++index, 24);
          });
        }
      })
      .catch((err) => {
        console.log(err);
        eventEmitter.emit('finish');
      });
  }
}

function getRecipes(res, food, recipeResult) {
  recipeSelectors = foodVars.recipeSelectors;
  globalFood = food;
  globalRes = res;
  globalRecipeResult = recipeResult;

  eventEmitter.on('grabRecipe', doRecipe);
  eventEmitter.emit('grabRecipe', 0, 24);
}

//Load food page and retrieve recipe links
function getPage(req, res, next) {
  //Begins scraping of recipes
  scrapeRecipeLinks(req, res, function(result) {
    console.log('CLOSING CONNECTION');
    res.end();
  });
  //Timeout terminates hanging requests
  setTimeout(function() {
    res.end();
  }, 115000);
}

module.exports = {
  getPage: getPage
};
