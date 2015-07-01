<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">

    <xsl:template match="/body/p[ft-content[@type='http://www.ft.com/ontology/content/ImageSet'] and name(following-sibling::*[1]) = 'pull-quote']">
        <div class="article__image-with-quote">
            <xsl:apply-templates select="ft-content" />
            <xsl:apply-templates select="following-sibling::*[1]" mode="standard" />
        </div>
    </xsl:template>

    <xsl:template match="pull-quote[preceding-sibling::*[1]/ft-content[@type='http://www.ft.com/ontology/content/ImageSet']]">
    </xsl:template>

</xsl:stylesheet>
