<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">

    <xsl:template match="ft-content[@type='http://www.ft.com/ontology/content/Article']">
        <xsl:apply-templates select="current()" mode="link">
            <xsl:with-param name="href" select="substring-after(@url, 'http://api.ft.com/content')" />
        </xsl:apply-templates>
    </xsl:template>

    <xsl:template match="a">
        <xsl:apply-templates select="current()" mode="link">
            <xsl:with-param name="href" select="@href" />
        </xsl:apply-templates>
    </xsl:template>

    <xsl:template match="a|ft-content" mode="link">
        <xsl:param name="href" />
        <a href="{$href}" data-trackable="link">
            <xsl:if test="not(ancestor-or-self::big-number|ancestor-or-self::promo-box)">
                <xsl:attribute name="class">article__body__link</xsl:attribute>
            </xsl:if>
            <xsl:apply-templates />
        </a>
    </xsl:template>

</xsl:stylesheet>
