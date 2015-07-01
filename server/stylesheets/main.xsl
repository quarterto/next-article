<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">

    <xsl:output method="xml" encoding="UTF-8" />

    <xsl:template match="@*|node()">
        <xsl:copy>
            <xsl:apply-templates select="@*|node()"/>
        </xsl:copy>
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
    <xsl:include href="./server/stylesheets/images.xsl" />
    <xsl:include href="./server/stylesheets/image-combos.xsl" />

</xsl:stylesheet>
