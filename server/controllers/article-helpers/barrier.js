'use strict';

module.exports = function barrierHelper(viewModel, options) {
	if (options.trialSimple) {
		viewModel.trialSimpleBarrier = options.trialSimple;
	}

	if (options.trialGrid) {
		viewModel.trialGridBarrier = options.trialGrid;

		if (!options.trialGrid.packages.newspaper) {
			viewModel.trialGridBarrier.missingNewspaper = {};
		}

		viewModel.trialGridBarrier.articleTitle = viewModel.title;
		viewModel.barrierOverlay = {};
	}

	if (options.registerSimple) {
		viewModel.registerSimpleBarrier = options.registerSimple;
		viewModel.barrierOverlay = {};
		viewModel.registerSimpleBarrier.articleTitle = viewModel.title;
	}

	if (options.registerGrid) {
		viewModel.registerGridBarrier = options.registerGrid;

		if (!options.registerGrid.packages.newspaper) {
			viewModel.registerGridBarrier.missingNewspaper = {};
		}

		viewModel.registerGridBarrier.articleTitle = viewModel.title;
		viewModel.barrierOverlay = {};
	}

	if (options.subscriptionGrid) {
		viewModel.subscriptionGridBarrier = options.subscriptionGrid;
		viewModel.subscriptionGridBarrier.articleTitle = viewModel.title;
		viewModel.barrierOverlay = {};
	}

	if (options.premiumSimple) {
		viewModel.premiumSimpleBarrier = options.premiumSimple;
		viewModel.barrierOverlay = {};
		viewModel.premiumSimpleBarrier.articleTitle = viewModel.title;
	}

	if (options.premiumGrid) {
		viewModel.premiumGridBarrier = options.premiumGrid;
		viewModel.barrierOverlay = {};
		viewModel.premiumGridBarrier.articleTitle = viewModel.title;
	}

	if (options.corporateSimple) {
		viewModel.corporateBarrier = options.corporateSimple;
		viewModel.barrierOverlay = {};
		viewModel.corporateBarrier.articleTitle = viewModel.title;
	}

	viewModel.comments = null;
	viewModel.body = null;
	viewModel.byline = null;
	viewModel.standFirst = null;
	viewModel.publishedDate = null;
	viewModel.tableOfContents = null;
	viewModel.primaryTag = null;
	viewModel.tags = null;
	viewModel.moreOns = null;
	viewModel.dehydratedMetadata = null;

	return viewModel;
};
