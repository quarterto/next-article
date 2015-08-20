<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">

    <xsl:template match="/html/body/ft-content[contains(@type, 'ImageSet')] | /html/body/p[normalize-space(string()) = '']/ft-content[contains(@type, 'ImageSet')]">
        <figure class="article__image-wrapper article__inline-image ng-figure-reset ng-inline-element ng-pull-out">
            <xsl:apply-templates select="current()" mode="internal-image" />
        </figure>
    </xsl:template>

    <xsl:template match="/html/body/ft-content[contains(@type, 'ImageSet') and count(preceding-sibling::*) = 0] | /html/body/p[normalize-space(string()) = '' and count(preceding-sibling::*) = 0]/ft-content[contains(@type, 'ImageSet')]">
        <figure>
            <xsl:attribute name="class">
                <xsl:choose>
                    <xsl:when test="$fullWidthMainImages and $reserveSpaceForMasterImage">article__image-wrapper article__main-image ng-figure-reset ng-media-wrapper</xsl:when>
                    <xsl:when test="$fullWidthMainImages">article__image-wrapper article__main-image ng-figure-reset</xsl:when>
                    <xsl:otherwise>article__image-wrapper article__inline-image ng-figure-reset ng-inline-element ng-pull-out</xsl:otherwise>
                </xsl:choose>
            </xsl:attribute>

            <xsl:apply-templates select="current()" mode="internal-image">
                <xsl:with-param name="isMain" select="1" />
            </xsl:apply-templates>
        </figure>
    </xsl:template>

    <xsl:template match="ft-content">
        <xsl:apply-templates select="current()" mode="internal-image">
            <xsl:with-param name="isInline" select="1" />
        </xsl:apply-templates>
    </xsl:template>

    <xsl:template match="ft-content" mode="internal-image">
        <xsl:param name="isMain" />
        <xsl:param name="isInline" />

        <img data-image-set-id="{substring(@url, string-length(@url) - 35)}" class="article__image" alt="">
            <xsl:attribute name="class">
                <xsl:choose>
                    <xsl:when test="$isMain and $fullWidthMainImages and $reserveSpaceForMasterImage">article__image ng-media</xsl:when>
                    <xsl:when test="$isMain and $fullWidthMainImages">article__image</xsl:when>
                    <xsl:when test="$isInline and current()[name(parent::*) = 'p']">article__image ng-inline-element ng-pull-out</xsl:when>
                    <xsl:when test="$isInline and current()[name(parent::*) != 'p']">article__image</xsl:when>
                    <xsl:otherwise>article__image</xsl:otherwise>
                </xsl:choose>
            </xsl:attribute>
        </img>
    </xsl:template>

</xsl:stylesheet>
