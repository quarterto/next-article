<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">

		 <xsl:template name="social">
				<xsl:if test="$renderSocial">
				<div class="article__share" data-trackable="share">
						<div data-o-component="o-share" class="o-share">
								<ul>
										<li class="o-share__action o-share__action--twitter">
												<a target="_blank" href="https://twitter.com/intent/tweet?url=https://next.ft.com/content/{$id}&amp;text={$encodedTitle}&amp;via=FT" data-trackable="twitter"><i>Twitter</i></a>
										</li>
										<li class="o-share__action o-share__action--facebook">
												<a target="_blank" href="http://www.facebook.com/sharer.php?u=https://next.ft.com/content/{$id}&amp;t={$encodedTitle}" data-trackable="facebook"><i>Facebook</i></a>
										</li>
										<li class="o-share__action o-share__action--linkedin">
												<a target="_blank" href="http://www.linkedin.com/shareArticle?mini=true&amp;url=https://next.ft.com/content/{$id}&amp;title={$encodedTitle}&amp;source=Financial+Times" data-trackable="linkedin"><i>LinkedIn</i></a>
										</li>
										<li class="o-share__action o-share__action--whatsapp">
												<a target="_blank" href="whatsapp://send?text={$encodedTitle}%20-%20https://next.ft.com/content/{$id}" data-trackable="whatsapp"><i>Whatsapp</i></a>
										</li>
								</ul>
						</div>
						<span class="article__share__count js-share-count" data-shared-url="{$webUrl}"></span>
				</div>
			</xsl:if>
		</xsl:template>

</xsl:stylesheet>
