<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">

    <xsl:template match="/html/body/promo-box">
      <xsl:variable name="expanderWordImage" select="55" />
      <xsl:variable name="expanderWordNoImage" select="100" />
      <xsl:variable name="expanderParaBreak" select="3" />
      <xsl:variable name="wordCount" select=" string-length(normalize-space(current()/promo-intro))
        - string-length(translate(normalize-space(current()/promo-intro),' ','')) +1" />
      <xsl:variable name="contentParas" select="count(current()/promo-intro/p)" />
      <xsl:variable name="imageCount" select="count(current()/promo-image)" />

      <xsl:choose>
        <xsl:when test="($contentParas > $expanderParaBreak) and (($imageCount > 0 and $wordCount > $expanderWordImage) or ($imageCount = 0 and $wordCount > $expanderWordNoImage))">
          <aside class="promo-box ng-inline-element o-expander" data-trackable="promobox" role="complementary" data-o-component="o-expander" data-o-expander-shrink-to="0" data-o-expander-count-selector=".promo-box__content__extension">
            <div class="promo-box__wrapper">
              <xsl:apply-templates />
            </div>
          </aside>
        </xsl:when>
        <xsl:otherwise>
          <aside class="promo-box ng-inline-element" data-trackable="promobox" role="complementary">
            <div class="promo-box__wrapper">
              <xsl:apply-templates />
            </div>
          </aside>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:template>

    <xsl:template match="promo-title">
      <div class="promo-box__title">
        <div class="promo-box__title__name">
          <xsl:apply-templates select="current()" mode="extract-content" />
        </div>
      </div>
    </xsl:template>

    <xsl:template match="promo-headline">
      <div class="promo-box__headline">
        <xsl:apply-templates select="current()" mode="extract-content" />
      </div>
    </xsl:template>

    <xsl:template match="promo-headline | promo-title" mode="extract-content">
      <xsl:choose>
        <xsl:when test="count(current()/p/*) > 0">
          <xsl:apply-templates select="current()/p/@* | current()/p/node()" />
        </xsl:when>
        <xsl:when test="count(current()/p) = 0">
          <xsl:apply-templates select="current()/@* | current()/node()" />
        </xsl:when>
        <xsl:otherwise>
          <xsl:value-of select="current()/p/text()" />
        </xsl:otherwise>
      </xsl:choose>
    </xsl:template>

    <xsl:template match="promo-image">

      <xsl:variable name="maxWidth" select="300" />

      <div class="promo-box__image">
        <xsl:choose>
          <xsl:when test="count(img[@width][@height]) = 1">
            <xsl:apply-templates select="img" mode="placehold-image">
                <xsl:with-param name="maxWidth" select="$maxWidth" />
            </xsl:apply-templates>
          </xsl:when>
          <xsl:otherwise>
            <xsl:apply-templates select="img" mode="dont-placehold-image">
                <xsl:with-param name="maxWidth" select="$maxWidth" />
            </xsl:apply-templates>
          </xsl:otherwise>
        </xsl:choose>
      </div>
    </xsl:template>

    <xsl:template match="promo-intro">
      <xsl:variable name="expanderParaBreakPoint" select="3" />
      <xsl:variable name="contentParagraphs" select="count(p)" />
      <xsl:choose>
        <xsl:when test="$contentParagraphs > $expanderParaBreakPoint">
          <div class="promo-box__content o-expander__content">
            <div class="promo-box__content__initial">
              <xsl:apply-templates select="current()/p[position() &lt;= $expanderParaBreakPoint]"/>
            </div>
            <div class="promo-box__content__extension">
              <xsl:apply-templates select="current()/p[position() > $expanderParaBreakPoint]"/>
            </div>
          </div>
          <button class="o-expander__toggle o--if-js" data-trackable="expander-toggle"></button>
        </xsl:when>
        <xsl:otherwise>
          <div class="promo-box__content">
            <div class="promo-box__content__initial">
              <xsl:apply-templates />
            </div>
          </div>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:template>

    <xsl:template match="ul">
      <ul class="promo-box__list">
        <xsl:apply-templates />
      </ul>
    </xsl:template>

</xsl:stylesheet>
