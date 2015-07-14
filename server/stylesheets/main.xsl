<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">

    <xsl:output method="xml" encoding="UTF-8" />

    <xsl:template match="@*|node()">
        <xsl:copy>
            <xsl:apply-templates select="@*|node()"/>
        </xsl:copy>
    </xsl:template>

    <xsl:template match="p">
        <xsl:apply-templates select="current()" mode="default" />
    </xsl:template>

    <xsl:template match="p" mode="default">
        <xsl:choose>
            <xsl:when test="ft-content[contains(@type, 'ImageSet')] and normalize-space(string()) = ''">
                <xsl:apply-templates select="ft-content" />
            </xsl:when>
            <xsl:when test="a[substring(@href, string-length(@href) - 6) = '#slide0' and string-length(text()) = 0]">
                <xsl:call-template name="slideshow" />
            </xsl:when>
            <xsl:otherwise>
                <p><xsl:apply-templates /></p>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>

    <xsl:include href="./server/stylesheets/slideshow.xsl" />
    <xsl:include href="./server/stylesheets/related-inline.xsl" />
    <xsl:include href="./server/stylesheets/links.xsl" />
    <xsl:include href="./server/stylesheets/interactive-graphics.xsl" />
    <xsl:include href="./server/stylesheets/video.xsl" />
    <xsl:include href="./server/stylesheets/pull-quotes.xsl" />
    <xsl:include href="./server/stylesheets/blockquotes.xsl" />
    <xsl:include href="./server/stylesheets/big-number.xsl" />
    <xsl:include href="./server/stylesheets/subheaders.xsl" />
    <xsl:include href="./server/stylesheets/image-combos.xsl" />
    <xsl:include href="./server/stylesheets/toc.xsl" />

</xsl:stylesheet>
