var fetchres = require('fetchres');

var numberOfArticles = 1;
var lastArticleUID;
var articleUIDS = [];
var breakpoints = [0];
var articleIsLoading = false;
var currentArticleUid;

function throttle(func, time){
	//var timeout
}

function extractArticleUid(article){
	return article.getAttribute('data-capi-id');
}

function updateUrl(scroll){
	for(var i= 0, l=breakpoints.length; i<l; i++){
		if(
			scroll > breakpoints[i] &&
			(i == (l-1) || scroll < breakpoints[i+1]) &&
			articleUIDS[i] !== currentArticleUid
		){
			var uid = articleUIDS[i];
			history.replaceState({uid: uid}, '', '/' + uid);
			break;
		}
	}

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
	fetch('/' + lastArticleUID + '/next-article')
		.then(fetchres.text)
		.then(function(response){
			articleIsLoading = false;
			if(!response){
				return;
			}

			var article = extractArticleHTML(response);
			var uid = extractArticleUid(article.childNodes[0]);
			document.body.insertBefore(article, document.querySelector('body script:last-child'));
			breakpoints.push(topOfLastArticle());
			numberOfArticles++;
			articleUIDS.push(uid);
			lastArticleUID = uid;

		})
		.catch(function(err){
			articleIsLoading = false;
			throw err;

		})
}

function heightOfLastArticle(){
	return document.querySelector('article:last-of-type').offsetHeight;
}

function topOfLastArticle(){
	return document.querySelector('article:last-of-type').offsetTop;
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

	updateUrl(window.scrollY);
}


function init(flag){
	if(flag.isSwitchedOn){
		window.scrollTo(0,0);
		lastArticleUID = extractArticleUid(document.querySelector('article'));
		currentArticleUid = lastArticleUID;
		articleUIDS.push(lastArticleUID);
		window.addEventListener('scroll', onScroll);
	}

}


module.exports = {
	init : init
};
