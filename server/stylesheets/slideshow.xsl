<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">

    <xsl:template match="/body/p[a[substring(@href, string-length(@href) - 6) = '#slide0' and string-length(text()) = 0] and count(*) = 1]">
        <xsl:apply-templates select="a" />
        <xsl:if test="string-length(text()) > 0">
          <p>
            <xsl:value-of select="text()"/>
          </p>
        </xsl:if>
    </xsl:template>

    <xsl:template match="a[substring(@href, string-length(@href) - 6) = '#slide0' and string-length(text()) = 0]">
        <xsl:if test="$renderSlideshows = 1">
            <ft-slideshow>
                <xsl:attribute name="data-uuid">
                    <!-- assume href is of the format .*[UUID].html#slide0 -->
                    <xsl:value-of select="substring-before(substring(@href, string-length(@href) - 47), '.html#slide0')" />
                </xsl:attribute>
            </ft-slideshow>
        </xsl:if>
    </xsl:template>

</xsl:stylesheet>
