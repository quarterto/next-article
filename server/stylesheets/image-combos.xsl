<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">

    <!-- image with pull quote -->
    <xsl:template match="/body/p[ft-content[@type='http://www.ft.com/ontology/content/ImageSet'] and name(following-sibling::*[1]) = 'pull-quote']">
        <div class="article__image-combo article__image-combo--pull-quote">
            <xsl:apply-templates select="ft-content" />
            <xsl:apply-templates select="following-sibling::*[1]" mode="with-image" />
        </div>
    </xsl:template>

    <xsl:template match="pull-quote[preceding-sibling::*[1]/ft-content[@type='http://www.ft.com/ontology/content/ImageSet']]" mode="with-image">
        <blockquote class="article__pull-quote ng-pull-out o-quote o-quote--standard">
            <xsl:apply-templates select="pull-quote-source" />
            <p><xsl:value-of select="pull-quote-text" /></p>
        </blockquote>
    </xsl:template>

    <xsl:template match="pull-quote[preceding-sibling::*[1]/ft-content[@type='http://www.ft.com/ontology/content/ImageSet']]">
    </xsl:template>

    <!-- image with big number -->
    <xsl:template match="/body/p[ft-content[@type='http://www.ft.com/ontology/content/ImageSet'] and name(following-sibling::*[1]) = 'big-number']">
        <div class="article__image-combo article__image-combo--big-number">
            <xsl:apply-templates select="ft-content" />
            <xsl:apply-templates select="following-sibling::*[1]" mode="with-image" />
        </div>
    </xsl:template>

    <xsl:template match="big-number[preceding-sibling::*[1]/ft-content[@type='http://www.ft.com/ontology/content/ImageSet']]" mode="with-image">
        <span class="article__big-number ng-pull-out ng-inline-element o-big-number o-big-number--standard">
            <span class="o-big-number__title">
                <xsl:apply-templates select="big-number-headline" />
            </span>
            <span class="o-big-number__content">
                <xsl:apply-templates select="big-number-intro" />
            </span>
        </span>
    </xsl:template>

    <xsl:template match="big-number[preceding-sibling::*[1]/ft-content[@type='http://www.ft.com/ontology/content/ImageSet']]">
    </xsl:template>

</xsl:stylesheet>
