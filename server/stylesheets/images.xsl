<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">

    <xsl:template match="/body/img | /body/p[normalize-space(string()) = '']/img">
        <figure class="article__image-wrapper article__inline-image ng-figure-reset ng-inline-element ng-pull-out">
            <xsl:apply-templates select="current()" mode="image" />
        </figure>
    </xsl:template>

    <xsl:template match="/body/img[position() = 1] | /body/p[normalize-space(string()) = '' and position() = 1]/img">
        <figure class="article__image-wrapper ng-figure-reset article__main-image">
            <xsl:apply-templates select="current()" mode="image" />
        </figure>
    </xsl:template>

    <xsl:template match="img">
        <xsl:apply-templates select="current()" mode="image" />
    </xsl:template>

    <xsl:template match="img" mode="image">
        <img src="https://next-geebee.ft.com/image/v1/images/raw/{@src}?source=next&amp;fit=scale-down&amp;width=710" class="article__image" alt="" />
    </xsl:template>

</xsl:stylesheet>
