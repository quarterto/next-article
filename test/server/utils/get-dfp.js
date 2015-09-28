/*global describe, it*/
'use strict';

var expect = require('chai').expect;
var getDfp = require('../../../server/utils/get-dfp');

var africa = {
	term: {
		name: "Africa",
		attributes: [
			{
				value: "Next World",
				key: "dfpSite"
			},
			{
				value: "Africa",
				key: "dfpZone"
			}
		],
		id: "MjI=-U2VjdGlvbnM=",
		taxonomy: "sections"
	}
};

var companies = {
	term: {
		name: "Companies",
		attributes: [
			{
				value: "Next Companies",
				key: "dfpSite"
			}
		],
		id: "Mjk=-U2VjdGlvbnM=",
		taxonomy: "sections"
	}
};

var globalEconomy = {
	term: {
		name: "Global Economy",
		attributes: [ ],
		id: "MTA3-U2VjdGlvbnM=",
		taxonomy: "sections"
	}
};

describe('get dfp', function() {

	it('should pick a section tag that has dfp information in it', function() {
		var attributes = getDfp([globalEconomy, africa, globalEconomy]);
		expect(attributes.dfpSite).to.equal('Next World');
		expect(attributes.dfpZone).to.equal('Africa');
	});

	it('should prefer tags with both site and zone over tags with just site', function() {
		var attributes = getDfp([companies, africa, companies, globalEconomy]);
		expect(attributes.dfpSite).to.equal('Next World');
		expect(attributes.dfpZone).to.equal('Africa');
	});

	it('should return falsey things if there is no tag with dfp site or zone information', function() {
		var attributes = getDfp([globalEconomy]);
		expect(attributes.dfpSite).to.be.undefined;
		expect(attributes.dfpZone).to.be.undefined;
	});

});
