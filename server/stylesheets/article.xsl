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
						<div class="listicle__item-content">
							<header>
								<h3 class="listicle__item-headline">
									<xsl:value-of select="h4" />
								</h3>
								<p class="listicle__item-subheading">
									<xsl:value-of select="em" />
								</p>
							</header>
							<p class="listicle__item-description">
								<xsl:value-of select="text()[normalize-space()]" />
							</p>
						</div>
					</li>
				</xsl:for-each>
			</ul>
		</xsl:if>
	</xsl:template>

</xsl:stylesheet>
