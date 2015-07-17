<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">

    <xsl:template match="/html/body/img | /html/body/p[normalize-space(string()) = '']/img">
        <figure class="article__image-wrapper article__inline-image ng-figure-reset ng-inline-element ng-pull-out">
            <xsl:apply-templates select="current()" mode="external-image" />
        </figure>
    </xsl:template>

    <xsl:template match="/html/body/img[position() = 1] | /html/body/p[normalize-space(string()) = '' and position() = 1]/img">
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
        <img src="https://next-geebee.ft.com/image/v1/images/raw/{@src}?source=next&amp;fit=scale-down&amp;width=710" alt="">
            <xsl:attribute name="class">
                <xsl:choose>
                    <xsl:when test="$isInline">article__image ng-inline-element ng-pull-out</xsl:when>
                    <xsl:otherwise>article__image</xsl:otherwise>
                </xsl:choose>
            </xsl:attribute>
        </img>
    </xsl:template>

    <xsl:template match="/html/body/ft-content[contains(@type, 'ImageSet')] | /html/body/p[normalize-space(string()) = '']/ft-content[contains(@type, 'ImageSet')]">
        <figure class="article__image-wrapper article__inline-image ng-figure-reset ng-inline-element ng-pull-out">
            <xsl:apply-templates select="current()" mode="internal-image" />
        </figure>
    </xsl:template>

    <xsl:template match="/html/body/ft-content[contains(@type, 'ImageSet') and position() = 1] | /html/body/p[normalize-space(string()) = '' and position() = 1]/ft-content[contains(@type, 'ImageSet')]">
        <figure>
            <xsl:attribute name="class">
                <xsl:choose>
                    <xsl:when test="$fullWidthMainImages">article__image-wrapper article__main-image ng-figure-reset ng-media-wrapper</xsl:when>
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
                    <xsl:when test="$isMain and $fullWidthMainImages">article__image ng-media</xsl:when>
                    <xsl:when test="$isInline">article__image ng-inline-element ng-pull-out</xsl:when>
                    <xsl:otherwise>article__image</xsl:otherwise>
                </xsl:choose>
            </xsl:attribute>
        </img>
    </xsl:template>

</xsl:stylesheet>
