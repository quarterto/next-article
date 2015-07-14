<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">

    <!-- just moves images out of their containing p -->
    <xsl:template match="p[ft-content[contains(@type, 'ImageSet')] and normalize-space(string()) = '']" name="image">
        <xsl:apply-templates select="ft-content" />
    </xsl:template>

</xsl:stylesheet>
