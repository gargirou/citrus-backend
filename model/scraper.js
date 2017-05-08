var request = require('request');
var cheerio = require('cheerio');

//Reset foodSource object parameters
function resetObject(foodSource) {
  foodSource.ingredients = 'search?q=';
  foodSource.links = [];
}
//Pick out ingredients from the url variable
function extractIngredients(foodSource, allIngredients) {
  var ingsArr = allIngredients.split(foodSource.delim);
  for(let i = 0; i < ingsArr.length; i++) {
    foodSource.ingredients += ingsArr[i] + '+';
  }
}

//Get links to recipes
function getLinksToRecipes(req, res) {
  //Food Scraping Object
  let foodSource = {
    baseURL : 'https://food52.com/recipes/',
    ingredients : 'search?q=',
    linksSelector : '.recipe-results-tiles > .collectable-tile > .photo-block a',
    links : [],
    url : function() {
      return this.baseURL + this.ingredients;
    },
    delim : ','
  };
  resetObject(foodSource);
  extractIngredients(foodSource, req.params.ings);

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
    title : 'div.main-content.recipe-main > article > header > h1',
    image : '#recipe-gallery-frame > figure > img', //get attr(src)
    serving : '#global-page-frame > div.page-body-block > div > div.body-with-sidebar > div.main-content.recipe-main > article > p:nth-child(15) > strong',
    ingredients : 'div.main-content.recipe-main > article > section.clearfix > ul > li  .recipe-list-item-name'
  };
  var recipe = {
    url : '',
    title  : '',
    image : '',
    serving : '',
    ingredients : []
  };

  var recipes = [];
    food.links.forEach(function (item, index, array) {
      let recipeURL = 'https://food52.com' + food.links[index];
      request(recipeURL, function(error, response, html){
        if(!error){
          var $ = cheerio.load(html);
          recipes[index] = {
            url : recipeURL,
            title  : $(recipeSelectors.title).text().trim(),
            image : $(recipeSelectors.image).attr('src'),
            serving : $(recipeSelectors.serving).text().trim(),
            ingredients : []
          };

          $(recipeSelectors.ingredients).each(function(i, elem) {
              recipes[index].ingredients[i] = $(this).text().trim();
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
  var food = getLinksToRecipes(req, res);
  //Temporary timeout.
  setTimeout(function() {
    res.end();
  }, 15000);
}

module.exports = {
  getPage: getPage
};
