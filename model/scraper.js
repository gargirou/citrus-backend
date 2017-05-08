var request = require('request');
var cheerio = require('cheerio');

//Food Scraping Object
var foodSource = {
  baseURL : 'https://food52.com/recipes/',
  ingredients : 'search?q=',
  linksSelector : '.recipe-results-tiles > .collectable-tile > .photo-block a',
  links : [],
  url : function() {
    return this.baseURL + this.ingredients;
  }
};
//
function resetObject() {
  foodSource.ingredients = 'search?q=';
  foodSource.links = [];
}
//Pick out ingredients from the url variable
function extractIngredients(allIngredients) {
  var ingsArr = allIngredients.split(',');
  for(var i=0; i< ingsArr.length; i++) {
    foodSource.ingredients += ingsArr[i] + '+';
  }
}

//Load food page and retrieve recipe links
function getPage(req, res, next) {
  resetObject();
  extractIngredients(req.params.ings);

  request(foodSource.url(), function(error, response, html){
    if(!error){
      var $ = cheerio.load(html);

      //Loop through links
      $(foodSource.linksSelector).each(function(i, elem) {
          foodSource.links.push($(this).attr('href'));
          console.log($(this).attr('href'));
      });
      console.log("End");
      res.send(JSON.stringify(foodSource));
    } else {
      console.log(error.message());
    }
  });
}

module.exports = {
  getPage: getPage
};
