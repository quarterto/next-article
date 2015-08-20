<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">

    <xsl:output method="html" encoding="UTF-8" indent="no" />

    <xsl:template match="@*|node()">
        <xsl:copy>
            <xsl:apply-templates select="@*|node()"/>
        </xsl:copy>
    </xsl:template>

    <xsl:template match="p" mode="default">
        <xsl:choose>
            <xsl:when test="img and normalize-space(string()) = ''">
                <xsl:apply-templates select="img" />
            </xsl:when>
            <xsl:when test="ft-content[contains(@type, 'ImageSet')] and normalize-space(string()) = ''">
                <xsl:apply-templates select="ft-content" />
            </xsl:when>
            <xsl:when test="a[substring(@href, string-length(@href) - 6) = '#slide0']">
                <xsl:call-template name="slideshow" />
            </xsl:when>
            <xsl:otherwise>
                <p><xsl:apply-templates /></p>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>

    <xsl:include href="big-number.xsl" />
    <xsl:include href="blockquotes.xsl" />
    <xsl:include href="external-image.xsl" />
    <xsl:include href="functions.xsl" />
    <xsl:include href="image-combos.xsl" />
    <xsl:include href="interactive-graphics.xsl" />
    <xsl:include href="internal-image.xsl" />
    <xsl:include href="links.xsl" />
    <xsl:include href="promo-box.xsl" />
    <xsl:include href="pull-quotes.xsl" />
    <xsl:include href="related-inline.xsl" />
    <xsl:include href="slideshow.xsl" />
    <xsl:include href="subheaders.xsl" />
    <xsl:include href="toc.xsl" />
    <xsl:include href="video.xsl" />

</xsl:stylesheet>
