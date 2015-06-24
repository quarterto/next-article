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
		<xsl:if test="li[figure][h4][em]">
			<ul class="breakout o-grid-row">
				<xsl:for-each select="li[figure][h4][em]">
					<li class="breakout__item" data-o-grid-colspan="12 M6 L3" role="group">
						<img class="breakout__item-img">
							<xsl:attribute name="src">
								<xsl:value-of select="figure/img/@src"/>
							</xsl:attribute>
						</img>
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
