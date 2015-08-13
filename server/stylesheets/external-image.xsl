<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">

    <xsl:template match="/html/body/img | /html/body/p[normalize-space(string()) = '']/img">
        <figure class="article__image-wrapper article__inline-image ng-figure-reset ng-inline-element ng-pull-out">
            <xsl:apply-templates select="current()" mode="external-image" />
        </figure>
    </xsl:template>

    <!-- matches the main image, i.e. the first image on the page -->
    <xsl:template match="/html/body/img[count(preceding-sibling::*) = 0] | /html/body/p[normalize-space(string()) = '' and count(preceding-sibling::*) = 0]/img">
        <figure class="article__image-wrapper article__main-image ng-figure-reset">
            <xsl:apply-templates select="current()" mode="external-image" />
        </figure>
    </xsl:template>

    <xsl:template match="img">
        <xsl:apply-templates select="current()" mode="external-image">
            <xsl:with-param name="isInline" select="1" />
        </xsl:apply-templates>
    </xsl:template>

    <xsl:template match="img" mode="external-image">
        <xsl:param name="isInline" />

        <img alt="" src="https://next-geebee.ft.com/image/v1/images/raw/{@src}?source=next&amp;fit=scale-down&amp;width=710">
            <xsl:attribute name="class">
                <xsl:choose>
                    <xsl:when test="$isInline">article__image ng-inline-element ng-pull-out</xsl:when>
                    <xsl:otherwise>article__image</xsl:otherwise>
                </xsl:choose>
            </xsl:attribute>
        </img>
    </xsl:template>

</xsl:stylesheet>
