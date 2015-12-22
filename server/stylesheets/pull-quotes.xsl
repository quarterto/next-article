<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">

    <xsl:template match="pull-quote">
      <blockquote class="article__quote article__quote--pull-quote aside--content c-box c-box--inline u-border--all u-padding--left-right">
        <div class="pull-quote__quote-marks"></div>
          <p class="u-margin--left-right"><xsl:value-of select="pull-quote-text" /></p>
          <xsl:apply-templates select="pull-quote-source" />
          <xsl:apply-templates select="pull-quote-image" />
      </blockquote>
    </xsl:template>

    <xsl:template match="pull-quote-source">
      <xsl:if test="text()">
        <cite class="article__quote-citation u-margin--left-right">
          <xsl:apply-templates select="text()" />
        </cite>
      </xsl:if>
    </xsl:template>

    <xsl:template match="pull-quote-image">
      <xsl:apply-templates select="current()/img" mode="aside-image-wrapper" />
    </xsl:template>

</xsl:stylesheet>
