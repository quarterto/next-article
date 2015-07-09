<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">

    <xsl:template match="pull-quote">
        <blockquote class="ng-pull-out n-quote">
            <p><xsl:value-of select="pull-quote-text" /></p>
            <xsl:apply-templates select="pull-quote-source" />
        </blockquote>
    </xsl:template>

    <xsl:template match="pull-quote-source">
        <xsl:if test="text()">
            <cite class="n-quote__cite">
                <xsl:apply-templates select="text()" />
            </cite>
        </xsl:if>
    </xsl:template>

</xsl:stylesheet>
