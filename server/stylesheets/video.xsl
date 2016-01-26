<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">

    <xsl:template match="a[starts-with(@href, 'http://video.ft.com/') and string-length(text()) = 0]">
        <div class="article__video article__video--brightcove">
            <div class="article__video-wrapper"
                data-n-component="n-video"
                data-n-video-source="brightcove"
                data-n-video-id="{substring-after(@href, 'http://video.ft.com/')}">
                <xsl:if test="$useBrightcovePlayer">
                    <xsl:attribute name="data-n-video-player">brightcove</xsl:attribute>
                </xsl:if>
            </div>
        </div>
    </xsl:template>

    <xsl:template match="p[a[contains(@href, 'youtube.com/watch') and string-length(text()) = 0]]">
        <xsl:apply-templates select="a" />
    </xsl:template>

    <xsl:template match="a[contains(@href, 'youtube.com/watch') and string-length(text()) = 0]">
        <xsl:variable name="videoId">
            <xsl:choose>
                <xsl:when test="contains(@href, '&amp;')">
                    <xsl:value-of select="substring-before(substring-after(@href, 'v='), '&amp;')" />
                </xsl:when>
                <xsl:otherwise>
                    <xsl:value-of select="substring-after(@href, 'v=')" />
                </xsl:otherwise>
            </xsl:choose>
        </xsl:variable>

        <div class="article__video article__video--youtube">
            <div class="article__video-wrapper">
                <iframe frameborder="0" src="https://www.youtube.com/embed/{$videoId}"></iframe>
            </div>
        </div>
    </xsl:template>

</xsl:stylesheet>
