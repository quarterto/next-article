var fetchres = require('fetchres');

var numberOfArticles = 1;
var currentArticleUID;
var articleUIDS = [];
var articleIsLoading = false;

function extractArticleUid(article){
	return article.getAttribute('data-capi-id');
}

function updateUrl(){
	console.log('updateURL');
}

function extractArticleHTML(html){
	var div = document.createElement('div');
	var fragment = document.createDocumentFragment();
	div.innerHTML = html;
	fragment.appendChild(div.querySelector('article'));
	fragment.appendChild(document.querySelector('.alpha-survey__container').cloneNode(true));
	fragment.appendChild(document.querySelector('.opt-out').cloneNode(true));
	return fragment;
}

function loadArticle(){
	if(articleIsLoading){
		return;
	}

	articleIsLoading = true;
	fetch('/' + currentArticleUID + '/next-article')
		.then(fetchres.text)
		.then(function(response){
			articleIsLoading = false;
			if(!response){
				return;
			}

			var article = extractArticleHTML(response);
			var uid = extractArticleUid(article.childNodes[0]);
			document.body.insertBefore(article, document.querySelector('body script:last-child'));
			numberOfArticles++;
			articleUIDS.push(uid);
			currentArticleUID = uid;

		})
		.catch(function(err){
			articleIsLoading = false;
			throw err;

		})
}

function heightOfLastArticle(){
	return document.querySelector('article:last-of-type').offsetHeight;
}

function distanceFromBottomOfPage(){
	return document.body.offsetHeight - window.scrollY;
}

function onScroll(){
	var distance = distanceFromBottomOfPage();
	var height = heightOfLastArticle();
	var loadTriggerPoint = (height / 10) * 8;
	var showTriggerPoint =(height / 10) * 1;
	if(distance <= loadTriggerPoint && !articleIsLoading){
		loadArticle();
	}

	updateUrl();
}


function init(flag){
	console.log('infinteScrollFlag', flag);
	if(flag.isSwitchedOn){
		currentArticleUID = extractArticleUid(document.querySelector('article'));
		articleUIDS.push(currentArticleUID);
		window.addEventListener('scroll', onScroll);
	}

}


module.exports = {
	init : init
};
