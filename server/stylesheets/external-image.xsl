<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">

    <xsl:template match="/html/body/img">
        <xsl:apply-templates select="current()" mode="figure" />
    </xsl:template>

    <xsl:template match="/html/body/p[img]">
        <xsl:apply-templates select="img" mode="figure" />
        <xsl:if test="count(child::node()[not(self::img)]) &gt; 0">
            <p><xsl:apply-templates select="child::node()[not(self::img)]" /></p>
        </xsl:if>
    </xsl:template>

    <xsl:template match="img" mode="figure">
        <xsl:variable name="variation">
            <xsl:choose>
                <xsl:when test="@width &lt;= 350">inline</xsl:when>
                <xsl:when test="@width &lt; @height">inline</xsl:when>
                <xsl:when test="@width &lt; 700">center</xsl:when>
                <xsl:otherwise>full</xsl:otherwise>
            </xsl:choose>
        </xsl:variable>

        <xsl:variable name="maxWidth">
            <xsl:choose>
                <xsl:when test="@width &gt; 700">700</xsl:when>
                <xsl:when test="@width &lt; @height">350</xsl:when>
                <xsl:otherwise><xsl:value-of select="@width" /></xsl:otherwise>
            </xsl:choose>
        </xsl:variable>

        <!-- You cannot shrink-wrap text so inline styles FTW -->
        <figure class="article-image article-image--{$variation}">

            <xsl:if test="$maxWidth != ''">
                <xsl:attribute name="style">
                    <xsl:value-of select="concat('width:', $maxWidth, 'px;')" />
                </xsl:attribute>
            </xsl:if>

            <xsl:choose>
                <xsl:when test="$maxWidth != ''">
                    <xsl:apply-templates select="current()" mode="placehold-image">
                        <xsl:with-param name="maxWidth" select="$maxWidth" />
                    </xsl:apply-templates>
                </xsl:when>
                <xsl:otherwise>
                    <xsl:apply-templates select="current()" mode="dont-placehold-image">
                        <xsl:with-param name="maxWidth">700</xsl:with-param>
                    </xsl:apply-templates>
                </xsl:otherwise>
            </xsl:choose>
            <xsl:if test="string-length(@longdesc) &gt; 0">
                <figcaption class="article-image__caption"><xsl:value-of select="@longdesc" /></figcaption>
            </xsl:if>
        </figure>
    </xsl:template>

    <xsl:template match="img" mode="placehold-image">
        <xsl:param name="maxWidth" />

        <xsl:variable name="ratio" select="(100 div @width) * @height" />

        <div class="article-image__placeholder" style="padding-top:{$ratio}%;">
            <img alt="{@alt}" src="https://next-geebee.ft.com/image/v1/images/raw/{@src}?source=next&amp;fit=scale-down&amp;width={$maxWidth}" />
        </div>
    </xsl:template>


    <xsl:template match="img" mode="dont-placehold-image">
        <xsl:param name="maxWidth" />

        <img alt="{@alt}" src="https://next-geebee.ft.com/image/v1/images/raw/{@src}?source=next&amp;fit=scale-down&amp;width={$maxWidth}" />
    </xsl:template>

</xsl:stylesheet>
