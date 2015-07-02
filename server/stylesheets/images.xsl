<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">

    <!-- just moves images out of their containing p -->
    <xsl:template match="/body/p[ft-content[@type='http://www.ft.com/ontology/content/ImageSet'] and count(*) = 1 and not(text())]">
        <xsl:apply-templates select="ft-content" />
    </xsl:template>

</xsl:stylesheet>
