<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">

    <xsl:template match="a[substring(@href, string-length(@href) - 6) = '#slide0' and string-length(text()) = 0]">
        <ft-slideshow data-syncid="1">
            <xsl:attribute name="data-uuid">
                <!-- assume href is of the format http://www.ft.com/cms/s/[UUID].html#slide0 -->
                <xsl:value-of select="substring-before(substring-after(@href, 'http://www.ft.com/cms/s/'), '.html#slide0')" />
            </xsl:attribute>
        </ft-slideshow>
    </xsl:template>

</xsl:stylesheet>
