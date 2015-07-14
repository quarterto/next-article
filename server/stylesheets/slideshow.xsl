<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">

    <xsl:template match="/body/p[a[substring(@href, string-length(@href) - 6) = '#slide0' and string-length(text()) = 0]]" name="slideshow">
        <xsl:apply-templates select="a[substring(@href, string-length(@href) - 6) = '#slide0' and string-length(text()) = 0]" />
        <xsl:if test="string-length(text()) > 0">
          <p>
            <xsl:copy-of select="./node()[not(self::a[substring(@href, string-length(@href) - 6) = '#slide0' and string-length(text()) = 0])]" />
          </p>
        </xsl:if>
    </xsl:template>

    <xsl:template match="a[substring(@href, string-length(@href) - 6) = '#slide0' and string-length(text()) = 0]">
        <xsl:if test="$renderSlideshows = 1">
            <!-- assume href is of the format .*[UUID].html#slide0 -->
            <ft-slideshow data-uuid="{substring-before(substring(@href, string-length(@href) - 47), '.html#slide0')}"/>
        </xsl:if>
    </xsl:template>

</xsl:stylesheet>
