<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">

    <xsl:template match="/body/p[3]">
        <xsl:copy-of select="." />
        <xsl:if test="count(/body/p) > 5">
            <div class="js-more-on-inline" data-trackable="more-on-inline"></div>
        </xsl:if>
    </xsl:template>

</xsl:stylesheet>
