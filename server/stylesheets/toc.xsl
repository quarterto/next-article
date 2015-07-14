<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">

    <xsl:template match="/body/p[1]">
        <xsl:choose>
            <xsl:when test="a[substring(@href, string-length(@href) - 6) = '#slide0' and string-length(text()) = 0]">
                <xsl:call-template name="slideshow" />
            </xsl:when>
            <xsl:when test="ft-content[contains(@type, 'ImageSet')] and normalize-space(string()) = ''">
                <xsl:call-template name="image" />
            </xsl:when>
            <xsl:otherwise>
                <p><xsl:apply-templates /></p>
            </xsl:otherwise>
        </xsl:choose>
        <xsl:if test="$renderTOC = 1">
            <div class="article__toc" data-trackable="table-of-contents">
                <h2 class="article__toc__title">Chapters in this article</h2>
                <ol class="article__toc__chapters ng-list-reset">
                    <xsl:for-each select="/body/h3[contains(@class, 'ft-subhead')]/strong">
                        <li class="article__toc__chapter">
                            <a class="article__toc__link" href="#crosshead-{position()}" data-trackable="toc"><xsl:value-of select="text()" /></a>
                        </li>
                    </xsl:for-each>
                </ol>
            </div>
        </xsl:if>
    </xsl:template>

</xsl:stylesheet>
