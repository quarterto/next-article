<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">

    <xsl:template match="//ft-content[@type='http://www.ft.com/ontology/content/Article']">
        <a href="{substring-after(@url, 'http://api.ft.com/content')}" data-trackable="link"><xsl:value-of select="text()" /></a>
    </xsl:template>

    <xsl:template match="//a">
        <xsl:copy>
            <xsl:attribute name="data-trackable">link</xsl:attribute>
            <xsl:apply-templates select="@*|node()" />
        </xsl:copy>
    </xsl:template>

</xsl:stylesheet>
