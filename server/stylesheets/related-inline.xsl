<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">

    <xsl:template match="/html/body/p[3]">
        <xsl:apply-templates select="current()" mode="default" />
        <xsl:if test="count(/html/body/p) > 5">
            <div class="js-story-package-inline" data-trackable="more-on-inline"></div>
        </xsl:if>
    </xsl:template>

</xsl:stylesheet>
