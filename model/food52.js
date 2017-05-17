var foodSiteURL = 'https://food52.com';
var searchPartOfURL = 'search?q=';

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

var ingredient = {
  quantity : '',
  name     : ''
};

module.exports = {
  foodSiteURL: foodSiteURL,
  searchPartOfURL: searchPartOfURL,
  foodSource: foodSource,
  recipeSelectors: recipeSelectors,
  recipe: recipe,
  ingredient: ingredient
};
