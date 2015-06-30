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

</xsl:stylesheet>
