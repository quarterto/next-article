<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">

    <xsl:template match="/body/a[position() = 1]/img | /body/img[position() = 1]">
        <figure class="article__image-wrapper ng-figure-reset article__main-image">
            <xsl:apply-templates select="current()" mode="external-image" />
        </figure>
    </xsl:template>

    <xsl:template match="img">
        <figure class="article__image-wrapper article__inline-image ng-figure-reset ng-inline-element ng-pull-out">
            <xsl:apply-templates select="current()" mode="external-image" />
        </figure>
    </xsl:template>

    <xsl:template match="img" mode="external-image">
        <img src="https://next-geebee.ft.com/image/v1/images/raw/{@src}?source=next&amp;fit=scale-down&amp;width=710" class="article__image" alt="" />
    </xsl:template>

</xsl:stylesheet>
