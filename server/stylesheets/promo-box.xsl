<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">

    <xsl:template match="/html/body/promo-box">
      <xsl:choose>
      <xsl:when test="$promoBoxNewStyling = 1">
        <xsl:variable name="longBoxWordBoundaryImage" select="45" />
        <xsl:variable name="longBoxWordBoundaryNoImage" select="90" />
        <xsl:variable name="expanderParaBreakPoint" select="2" />
        <xsl:variable name="wordCount" select=" string-length(normalize-space(current()/promo-intro))
          - string-length(translate(normalize-space(current()/promo-intro),' ','')) +1" />
        <xsl:variable name="contentParagraphs" select="count(current()/promo-intro/p)" />
        <xsl:variable name="imageCount" select="count(current()/promo-image)" />
        <xsl:choose>
          <xsl:when test="($imageCount > 0 and $wordCount > $longBoxWordBoundaryImage) or ($imageCount = 0 and $wordCount > $longBoxWordBoundaryNoImage)">
            <xsl:choose>
              <xsl:when test="$contentParagraphs > $expanderParaBreakPoint">
                <aside class="promo-box promo-box--long ng-pull-out ng-inline-element o-expander" data-trackable="promobox" role="complementary" data-o-component="o-expander" data-o-expander-shrink-to="0" data-o-expander-count-selector=".promo-box__content__extension">
                  <xsl:apply-templates select="current()" mode="default-title" />
                  <xsl:apply-templates />
                </aside>
              </xsl:when>
              <xsl:otherwise>
                <aside class="promo-box promo-box--long ng-pull-out ng-inline-element" data-trackable="promobox" role="complementary">
                  <xsl:apply-templates select="current()" mode="default-title" />
                  <xsl:apply-templates />
                </aside>
              </xsl:otherwise>
            </xsl:choose>
          </xsl:when>
          <xsl:otherwise>
            <aside class="promo-box ng-pull-out ng-inline-element" data-trackable="promobox" role="complementary">
              <xsl:apply-templates select="current()" mode="default-title" />
              <xsl:apply-templates />
            </aside>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:when>
      <xsl:otherwise>
        <aside class="article__promo-box ng-pull-out ng-inline-element" data-trackable="promobox" role="complementary">
          <xsl:apply-templates />
        </aside>
      </xsl:otherwise>
    </xsl:choose>
    </xsl:template>

    <xsl:template match="promo-box" mode="default-title">
      <xsl:if test="count(current()/promo-title) = 0">
        <div class="promo-box__title__wrapper"><h3 class="promo-box__title">Related Content</h3></div>
      </xsl:if>
    </xsl:template>

    <xsl:template match="promo-title">
      <xsl:choose>
        <xsl:when test="$promoBoxNewStyling = 1">
          <div class="promo-box__title__wrapper">
            <h3 class="promo-box__title">
              <xsl:apply-templates select="current()" mode="extract-content" />
            </h3>
          </div>
        </xsl:when>
        <xsl:otherwise>
          <h3 class="article__promo-box__title">
            <xsl:apply-templates select="current()" mode="extract-content" />
          </h3>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:template>

    <xsl:template match="promo-headline">
      <xsl:choose>
        <xsl:when test="$promoBoxNewStyling = 1">
          <h4 class="promo-box__headline">
            <xsl:apply-templates select="current()" mode="extract-content" />
          </h4>
        </xsl:when>
        <xsl:otherwise>
          <h4 class="article__promo-box__headline">
            <xsl:apply-templates select="current()" mode="extract-content" />
          </h4>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:template>

    <xsl:template match="promo-headline | promo-title" mode="extract-content">
      <xsl:choose>
        <xsl:when test="count(current()/p/*) > 0">
          <xsl:apply-templates select="current()/p/*" />
        </xsl:when>
        <xsl:otherwise>
          <xsl:value-of select="current()/p/text()" />
        </xsl:otherwise>
      </xsl:choose>
    </xsl:template>

    <xsl:template match="promo-image">
		<xsl:apply-templates select="ft-content" mode="internal-image">
			<xsl:with-param name="isPromoImage" select="1" />
		</xsl:apply-templates>
    </xsl:template>

    <xsl:template match="promo-intro">
      <xsl:choose>
        <xsl:when test="$promoBoxNewStyling = 1">
          <xsl:variable name="expanderParaBreakPoint" select="2" />
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
        </xsl:when>
        <xsl:otherwise>
          <div class="article__promo-box__content">
            <xsl:apply-templates />
          </div>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:template>

</xsl:stylesheet>
