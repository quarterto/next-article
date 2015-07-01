<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">

	<xsl:output method="html" encoding="UTF-8" />

	<!-- Create a new document based on the existing -->
	<xsl:template match="node()">
		<xsl:copy>
			<xsl:copy-of select="@*" disable-output-escaping="yes" />
			<xsl:apply-templates select="node()" />
		</xsl:copy>
	</xsl:template>

	<!-- Listicle -->
	<xsl:template match="//ul">

		<xsl:variable name="columns" select="count(li[figure][h4][em])" />

		<xsl:if test="$columns > 1">

			<xsl:variable name="grid">
				<xsl:choose>
					<xsl:when test="$columns = 4">12 M6 L3</xsl:when>
					<xsl:when test="$columns = 3">12 M4</xsl:when>
					<xsl:when test="$columns = 2">12 M6</xsl:when>
				</xsl:choose>
			</xsl:variable>

			<ul class="listicle o-grid-row">
				<xsl:for-each select="li[figure][h4][em]">
					<li class="listicle__item" role="group">
						<xsl:attribute name="data-o-grid-colspan">
							<xsl:value-of select="$grid"/>
						</xsl:attribute>

						<img class="listicle__item-image">
							<xsl:attribute name="src">
								<xsl:value-of select="figure/img/@src" />
							</xsl:attribute>
						</img>
						<p class="listicle__item-feature">
							<xsl:value-of select="em" />
						</p>
						<h3 class="listicle__item-headline">
							<xsl:value-of select="h4" />
						</h3>
						<p class="listicle__item-description">
							<xsl:value-of select="text()[normalize-space()]" />
						</p>
					</li>
				</xsl:for-each>
			</ul>
		</xsl:if>
	</xsl:template>

	<!-- Featured items -->
	<xsl:template match="h2[
		following-sibling::*[1][self::figure]
		and following-sibling::*[2][self::p]
		and following-sibling::*[3][self::ul]
	]">
		<div class="featured-items">
			<h2 class="featured-items__heading"><xsl:value-of select="text()" /></h2>
			<p class="featured-items__description">
				<xsl:value-of select="following-sibling::p[1]" />
			</p>

			<img class="featured-items__media">
				<xsl:attribute name="src">
					<xsl:value-of select="following-sibling::figure/img/@src" />
				</xsl:attribute>
				<xsl:attribute name="alt">
					<xsl:value-of select="following-sibling::figure/img/@alt" />
				</xsl:attribute>
			</img>

			<div class="featured-items__body">
				<ul class="featured-items__list">
					<xsl:for-each select="following-sibling::ul[1]/li">
						<li class="featured-items__item">
							<img class="featured-items__item-media">
								<xsl:attribute name="src">
									<xsl:value-of select="figure/img/@src" />
								</xsl:attribute>
								<xsl:attribute name="alt">
									<xsl:value-of select="figure/img/@alt" />
								</xsl:attribute>
							</img>

							<h3 class="featured-items__item-heading">
								<xsl:value-of select="h4" />
							</h3>
							<p class="featured-items__item-description">
								<span class="featured-items__item-price">
									<xsl:value-of select="em" />
								</span>
								<xsl:copy-of select="text()[normalize-space()]" />
							</p>
						</li>
					</xsl:for-each>
				</ul>
			</div>
		</div>
	</xsl:template>

	<xsl:template match="figure[
		preceding-sibling::*[1][self::h2]
		and following-sibling::*[1][self::p]
		and following-sibling::*[2][self::ul]
	]" />

	<xsl:template match="p[
		preceding-sibling::*[2][self::h2]
		and preceding-sibling::*[1][self::figure]
		and following-sibling::*[1][self::ul]
	]" />

	<xsl:template match="ul[
		preceding-sibling::*[3][self::h2]
		and preceding-sibling::*[2][self::figure]
		and preceding-sibling::*[1][self::p]
	]" />

</xsl:stylesheet>
