/**
 * Social Media Sharing Utilities
 */

/**
 * Generate a Twitter/X share URL
 * @param text The message text
 * @param url The URL to share
 * @param hashtags Array of hashtags (without #)
 */
export const getTwitterShareUrl = (
    text: string,
    url: string,
    hashtags: readonly string[] = []
): string => {
    const params = new URLSearchParams();
    params.append('text', text);
    params.append('url', url);
    if (hashtags.length > 0) {
        params.append('hashtags', hashtags.join(','));
    }
    return `https://twitter.com/intent/tweet?${params.toString()}`;
};

/**
 * Generate a LinkedIn share URL (using feed endpoint for pre-filled text)
 * @param text The message text
 * @param url The URL to share
 */
export const getLinkedInShareUrl = (
    text: string,
    url: string,
    hashtags: readonly string[] = []
): string => {
    const params = new URLSearchParams();
    params.append('shareActive', 'true');
    params.append('mini', 'true');

    // Format hashtags with # prefix
    const tagsString = hashtags.map(tag => `#${tag}`).join(' ');

    // LinkedIn combines text and URL in the 'text' param for proper feed display
    // We append the URL and hashtags to the text
    const fullText = [text, url, tagsString].filter(Boolean).join(' ');
    params.append('text', fullText);

    return `https://www.linkedin.com/feed/?${params.toString()}`;
};
