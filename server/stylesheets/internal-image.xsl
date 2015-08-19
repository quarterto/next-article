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
        <xsl:param name="isPromoImage" />
        <picture data-image-set-id="{substring(@url, string-length(@url) - 35)}">
          <xsl:attribute name="class">
              <xsl:choose>
                  <xsl:when test="$isMain and $fullWidthMainImages and $reserveSpaceForMasterImage">article__image ng-media n-image</xsl:when>
                  <xsl:when test="$isMain and $fullWidthMainImages">article__image n-image</xsl:when>
                  <xsl:when test="$isInline and current()[name(parent::*) = 'p']">article__image ng-inline-element ng-pull-out n-image</xsl:when>
                  <xsl:when test="$isInline and current()[name(parent::*) != 'p']">article__image n-image</xsl:when>
                  <xsl:otherwise>article__image n-image</xsl:otherwise>
              </xsl:choose>
          </xsl:attribute>
          <xsl:choose>
            <xsl:when test="$isPromoImage">
              <xsl:text disable-output-escaping="yes">
                <![CDATA[<!--[if IE 9]><video style="display: none;"><![endif]-->]]>
              </xsl:text>
              <source data-image-size="280" media="(min-width: 490px)"></source>
              <xsl:text disable-output-escaping="yes">
                <![CDATA[<!--[if IE 9]></video><![endif]-->]]>
              </xsl:text>
              <img data-image-type="srcset" data-image-size="400" class="n-image__img" alt=""/>
            </xsl:when>
            <xsl:otherwise>
              <xsl:text disable-output-escaping="yes">
                <![CDATA[<!--[if IE 9]><video style="display: none;"><![endif]-->]]>
              </xsl:text>
              <source data-image-size="690" media="(min-width: 730px)"></source>
              <xsl:text disable-output-escaping="yes">
                <![CDATA[<!--[if IE 9]></video><![endif]-->]]>
              </xsl:text>
              <img data-image-type="src" data-image-size="400" class="n-image__img" alt=""/>
            </xsl:otherwise>
          </xsl:choose>
        </picture>
    </xsl:template>

</xsl:stylesheet>
