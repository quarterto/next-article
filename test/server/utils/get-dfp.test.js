/*global describe, it*/

'use strict';

const expect = require('chai').expect;
const getDfp = require('../../../server/utils/get-dfp');

const africa = {
	name: 'Africa',
	attributes: [
		{
			value: 'Next World',
			key: 'dfpSite'
		},
		{
			value: 'Africa',
			key: 'dfpZone'
		}
	],
	id: 'MjI=-U2VjdGlvbnM=',
	taxonomy: 'sections'
};

const companies = {
	name: 'Companies',
	attributes: [
		{
			value: 'Next Companies',
			key: 'dfpSite'
		}
	],
	id: 'Mjk=-U2VjdGlvbnM=',
	taxonomy: 'sections'
};

const globalEconomy = {
	name: 'Global Economy',
	attributes: [ ],
	id: 'MTA3-U2VjdGlvbnM=',
	taxonomy: 'sections'
};

describe('get dfp', () => {

	it('should pick a section tag that has dfp information in it', () => {
		let attributes = getDfp([globalEconomy, africa, globalEconomy]);

		expect(attributes.dfpSite).to.equal('Next World');
		expect(attributes.dfpZone).to.equal('Africa');
	});

	it('should prefer tags with both site and zone over tags with just site', () => {
		let attributes = getDfp([companies, africa, companies, globalEconomy]);

		expect(attributes.dfpSite).to.equal('Next World');
		expect(attributes.dfpZone).to.equal('Africa');
	});

	it('should return falsey things if there is no tag with dfp site or zone information', () => {
		let attributes = getDfp([globalEconomy]);

		expect(attributes.dfpSite).to.be.undefined;
		expect(attributes.dfpZone).to.be.undefined;
	});

});
