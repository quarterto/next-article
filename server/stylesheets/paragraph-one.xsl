<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">

    <xsl:template match="/html/body/p[1]">

      <xsl:call-template name="social" />

      <xsl:if test="$suggestedRead = 1">
          <p class="article__standfirst">
            <xsl:value-of select="$standFirst" />
          </p>
      </xsl:if>
        <xsl:apply-templates select="current()" mode="default" />
        <xsl:if test="$renderTOC = 1 and count(/html/body/h3[contains(@class, 'ft-subhead')]/strong) > 2">
            <div class="article__toc" data-trackable="table-of-contents">
                <h2 class="article__toc__title">Chapters in this article</h2>
                <ol class="article__toc__chapters ng-list-reset">
                    <xsl:for-each select="/html/body/h3[contains(@class, 'ft-subhead')]/strong">
                        <li class="article__toc__chapter">
                            <a class="article__toc__link" href="#crosshead-{position()}" data-trackable="toc"><xsl:value-of select="text()" /></a>
                        </li>
                    </xsl:for-each>
                </ol>
            </div>
        </xsl:if>
    </xsl:template>


</xsl:stylesheet>
