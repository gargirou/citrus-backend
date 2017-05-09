var request = require('request');
var cheerio = require('cheerio');
var strHelper = require('../util/string-helper');

var foodSiteURL = 'https://food52.com';
var searchPartOfURL = 'search?q=';

//Reset foodSource object parameters
function resetObject(foodSource) {
  foodSource.ingredients = searchPartOfURL;
  foodSource.links = [];
}

//Pick out ingredients from the url variable
function extractIngredientsFromURL(foodSource, allIngredients) {
  var ingsArr = allIngredients.split(foodSource.delim);
  for(let i = 0; i < ingsArr.length; i++) {
    foodSource.ingredients += ingsArr[i] + '+';
  }
}
//([^A-Za-z0-9 \:\/\(\)\[\]])
//Get links to recipes
function scrapeRecipes(req, res) {
  //Food Scraping Object
  var foodSource = {
    baseURL       : foodSiteURL + '/recipes/',
    ingredients   : searchPartOfURL,
    linksSelector : '.recipe-results-tiles > .collectable-tile > .photo-block a',
    links         : [],
    url           : function() {
                      return this.baseURL + this.ingredients;
                    },
    delim         : ','
  };
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

      console.log("End");
      //res.send(JSON.stringify(foodSource));
    } else {
      console.log(error);
    }
    getRecipes(res, foodSource);
  });
  return foodSource;
}

function getRecipes(res, food) {
  //Todo: Check if URLS are in the db already. If yes: return them, if not save recipes and return.
  var recipeSelectors = {
    title       : 'div.main-content.recipe-main > article > header > h1',
    image       : '#recipe-gallery-frame > figure > img', //get attr(src)
    serving     : '#global-page-frame > div.page-body-block > div > div.body-with-sidebar > div.main-content.recipe-main > article > p:nth-child(15) > strong',
    ingredients : 'div.main-content.recipe-main > article > section.clearfix > ul > li',
    ingText : ' .recipe-list-item-name',
    ingQuantity : '.recipe-list-quantity'
  };
  var recipe = {
    url         : '',
    title       : '',
    image       : '',
    serving     : '',
    ingredients : []
  };
  var recipes = [];
  //Loop through each food url
  food.links.forEach(function (item, index, array) {
    var recipeURL = foodSiteURL + food.links[index];
    request(recipeURL, function(error, response, html) {
      if(!error) {
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
            text     : $(this).children(recipeSelectors.ingText).text().trim()
          };
        });
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
  scrapeRecipes(req, res);
  //Timeout terminates hanging requests
  setTimeout(function() {
    res.end();
  }, 25000);
}

module.exports = {
  getPage: getPage
};
