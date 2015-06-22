<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">

	<xsl:output method="html" encoding="UTF-8" />
	<xsl:strip-space elements="*" />

	<xsl:template match="node()">
		<!-- Create a new document based on the existing -->
		<xsl:copy>
			<xsl:copy-of select="@*"/>
			<xsl:apply-templates select="node()"/>
		</xsl:copy>
	</xsl:template>

	<!-- Listicle -->
	<xsl:template match="//ul">
		<xsl:if test="li[ft-content][h4][em]">
			<ul class="breakout o-grid-row">
				<xsl:for-each select="li[ft-content][h4][em]">
					<li class="breakout__item" data-o-grid-colspan="12 M6 L3" role="group">
						<xsl:copy-of select="ft-content" />
						<div class="breakout__item-content">
							<header>
								<h3 class="breakout__item-headline">
									<xsl:value-of select="h4" />
								</h3>
								<p class="breakout__item-subheading">
									<xsl:value-of select="em" />
								</p>
							</header>
							<p class="breakout__item-description">
								<xsl:value-of select="text()[normalize-space()]" />
							</p>
						</div>
					</li>
				</xsl:for-each>
			</ul>
		</xsl:if>
	</xsl:template>

</xsl:stylesheet>
