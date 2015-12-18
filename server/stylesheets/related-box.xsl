<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">

  <xsl:template match="/html/body/ft-related">
    <aside data-trackable="related-box" role="complementary" class="related-box ng-inline-element">

      <xsl:variable name="type">
        <xsl:choose>
          <xsl:when test="substring(@type, string-length(@type) - 6) = 'Article'">article</xsl:when>
          <xsl:otherwise></xsl:otherwise>
        </xsl:choose>
      </xsl:variable>

      <xsl:variable name="linkurl">
        <xsl:choose>
          <xsl:when test="$type = 'article' and current()[@url]">
            <xsl:value-of select="substring(@url, string-length(@url) - 44)" />
          </xsl:when>
          <xsl:otherwise>
            <xsl:if test="@url">
              <xsl:value-of select="@url" />
            </xsl:if>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:variable>

      <div class="related-box__wrapper">
        <xsl:if test="$type = 'article'">
          <xsl:choose>
            <xsl:when test="count(current()/title) = 0">
              <div class="related-box__title">
                <div class="related-box__title__name">Related article</div>
              </div>
            </xsl:when>
            <xsl:otherwise>
              <xsl:apply-templates select="current()/title" mode="related-box-title" />
            </xsl:otherwise>
          </xsl:choose>
        </xsl:if>
        <xsl:if test="$type = 'article'">
          <xsl:apply-templates select="current()/media/img" mode="related-box-image-wrapper" >
            <xsl:with-param name="linkurl" select="$linkurl" />
          </xsl:apply-templates>
        </xsl:if>
        <xsl:if test="$type != 'article'">
          <xsl:apply-templates select="current()/title" mode="related-box-title" />
        </xsl:if>
        <xsl:apply-templates select="current()/headline" mode="related-box-headline" >
          <xsl:with-param name="linkurl" select="$linkurl" />
        </xsl:apply-templates>
        <xsl:if test="$type != 'article'">
          <xsl:apply-templates select="current()/media/img" mode="related-box-image-wrapper" >
            <xsl:with-param name="linkurl" select="$linkurl" />
          </xsl:apply-templates>
        </xsl:if>
        <xsl:apply-templates />
      </div>

    </aside>

  </xsl:template>

  <xsl:template match="title" mode="related-box-title">
    <div class="related-box__title">
      <div class="related-box__title__name">
        <xsl:value-of select="current()/text()" />
      </div>
    </div>
  </xsl:template>

  <xsl:template match="title" />

  <xsl:template match="headline" mode="related-box-headline">
    <xsl:param name="linkurl" />

    <div class="related-box__headline">
      <xsl:choose>
        <xsl:when test="$linkurl != ''">
          <a class="related-box__headline--link" data-trackable="link-headline" href="{$linkurl}">
            <xsl:value-of select="current()/text()" />
          </a>
        </xsl:when>
        <xsl:otherwise>
          <xsl:value-of select="current()/text()" />
        </xsl:otherwise>
      </xsl:choose>
    </div>
  </xsl:template>

  <xsl:template match="headline" />

  <xsl:template match="ft-related/media/img" mode="related-box-image-wrapper">
    <xsl:param name="linkurl" />
    <div class="related-box__image">
      <xsl:choose>
        <xsl:when test="$linkurl !=''">
          <a class="related-box__image--link" data-trackable="link-image" href="{$linkurl}">
            <xsl:apply-templates select="current()" mode="related-box-image" />
          </a>
        </xsl:when>
        <xsl:otherwise>
          <xsl:apply-templates select="current()" mode="related-box-image" />
        </xsl:otherwise>
      </xsl:choose>
    </div>
  </xsl:template>

  <xsl:template match="ft-related/media/img" />
  <xsl:template match="ft-related/media" />

  <xsl:template match="ft-related/media/img" mode="related-box-image">
    <xsl:variable name="maxWidth" select="300" />
    <xsl:choose>
      <xsl:when test="count(current()[@width][@height]) = 1">
        <xsl:apply-templates select="current()" mode="placehold-image">
            <xsl:with-param name="maxWidth" select="$maxWidth" />
        </xsl:apply-templates>
      </xsl:when>
      <xsl:otherwise>
        <xsl:apply-templates select="current()" mode="dont-placehold-image">
            <xsl:with-param name="maxWidth" select="$maxWidth" />
        </xsl:apply-templates>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template match="intro">
    <div class="related-box__content">
      <xsl:apply-templates />
    </div>
  </xsl:template>


</xsl:stylesheet>
