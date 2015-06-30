<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">

    <xsl:template match="pull-quote">
        <blockquote class="article__pull-quote ng-pull-out o-quote o-quote--standard">
            <p><xsl:value-of select="pull-quote-text" /></p>
            <xsl:apply-templates select="pull-quote-source" />
        </blockquote>
    </xsl:template>

    <xsl:template match="pull-quote-source">
        <xsl:if test="text()">
            <cite class="o-quote__cite"><xsl:value-of select="text()" /></cite>
        </xsl:if>
    </xsl:template>

</xsl:stylesheet>
