<?php
// server/fetch-news.php
// Roda via cron do Hostinger. Busca RSS externos, traduz pro PT-BR e gera JSON local.

require_once __DIR__ . '/credentials-local.php';

$sources = [
    ['url' => 'https://blog.google/products/ads-commerce/rss/', 'category' => 'SEO', 'sourceName' => 'Google'],
    ['url' => 'https://moz.com/feeds/blog.rss', 'category' => 'SEO', 'sourceName' => 'Moz'],
    ['url' => 'https://www.searchenginejournal.com/feed/', 'category' => 'SEO', 'sourceName' => 'Search Engine Journal'],
    ['url' => 'https://blog.hubspot.com/marketing/rss.xml', 'category' => 'Marketing Digital', 'sourceName' => 'HubSpot'],
    ['url' => 'https://www.socialmediaexaminer.com/feed/', 'category' => 'Social Media', 'sourceName' => 'Social Media Examiner'],
    ['url' => 'https://css-tricks.com/feed/', 'category' => 'Desenvolvimento Web', 'sourceName' => 'CSS-Tricks'],
    ['url' => 'https://github.blog/feed/', 'category' => 'Desenvolvimento Web', 'sourceName' => 'GitHub'],
    ['url' => 'https://www.freecodecamp.org/news/rss/', 'category' => 'Desenvolvimento Web', 'sourceName' => 'freeCodeCamp'],
    ['url' => 'https://aws.amazon.com/blogs/aws/feed/', 'category' => 'Cloud & Infraestrutura', 'sourceName' => 'AWS'],
    ['url' => 'https://azure.microsoft.com/en-us/blog/feed/', 'category' => 'Cloud & Infraestrutura', 'sourceName' => 'Microsoft Azure'],
    ['url' => 'https://www.infoq.com/feed/', 'category' => 'Engenharia de Software', 'sourceName' => 'InfoQ'],
    ['url' => 'https://techcrunch.com/feed/', 'category' => 'Tecnologia', 'sourceName' => 'TechCrunch'],
    ['url' => 'https://feeds.arstechnica.com/arstechnica/index', 'category' => 'Tecnologia', 'sourceName' => 'Ars Technica'],
    ['url' => 'https://developers.googleblog.com/feeds/posts/default', 'category' => 'Inteligência Artificial', 'sourceName' => 'Google Developers'],
    ['url' => 'https://openai.com/blog/rss.xml', 'category' => 'Inteligência Artificial', 'sourceName' => 'OpenAI'],
    ['url' => 'https://www.technologyreview.com/feed/', 'category' => 'Inteligência Artificial', 'sourceName' => 'MIT Technology Review'],
];

$maxPerSource = 6;
$maxTotal = 60;
$items = [];
$seenLinks = [];
$translationCache = [];
$openGraphImageCache = [];

function translateToPtBr($text) {
    global $translationCache;

    $text = trim((string) $text);
    if ($text === '') return $text;
    if (isset($translationCache[$text])) return $translationCache[$text];

    $ch = curl_init('https://api-free.deepl.com/v2/translate');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_HTTPHEADER => [
            'Authorization: DeepL-Auth-Key ' . DEEPL_API_KEY,
            'Content-Type: application/x-www-form-urlencoded',
        ],
        CURLOPT_POSTFIELDS => http_build_query([
            'text' => $text,
            'target_lang' => 'PT-BR',
        ]),
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        $translationCache[$text] = $text;
        return $text;
    }

    $data = json_decode($response, true);
    $translationCache[$text] = $data['translations'][0]['text'] ?? $text;
    return $translationCache[$text];
}

function extractItemText($item, array $namespaces, array $candidates) {
    foreach ($candidates as $candidate) {
        if (strpos($candidate, ':') !== false) {
            [$prefix, $name] = explode(':', $candidate, 2);
            if (!isset($namespaces[$prefix])) continue;
            $children = $item->children($namespaces[$prefix]);
            $value = trim((string) $children->{$name});
            if ($value !== '') return $value;
            continue;
        }

        $value = trim((string) $item->{$candidate});
        if ($value !== '') return $value;
    }

    return '';
}

function normalizeSummary($text, $limit = 220) {
    $plain = trim(preg_replace('/\s+/u', ' ', strip_tags(html_entity_decode((string) $text, ENT_QUOTES | ENT_HTML5, 'UTF-8'))));
    if ($plain === '') return '';

    if (mb_strlen($plain) <= $limit) {
        return $plain;
    }

    return rtrim(mb_substr($plain, 0, $limit - 1)) . '…';
}

function extractImageFromHtml($html) {
    if ($html === '') return '';

    if (preg_match_all('/<meta\b[^>]*>/i', $html, $metaTags)) {
        foreach ($metaTags[0] as $tag) {
            if (!preg_match('/(?:property|name)=["\'](?:og:image(?::secure_url)?|twitter:image)["\']/i', $tag)) continue;
            if (preg_match('/content=["\']([^"\']+)["\']/i', $tag, $match)) return html_entity_decode($match[1], ENT_QUOTES | ENT_HTML5, 'UTF-8');
        }
    }

    if (preg_match('/<img[^>]+(?:src|data-src)=["\']([^"\']+)["\']/i', $html, $matches)) {
        return html_entity_decode($matches[1], ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }

    return '';
}

function fetchOpenGraphImage($url) {
    global $openGraphImageCache;

    if (isset($openGraphImageCache[$url])) return $openGraphImageCache[$url];

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_USERAGENT => 'Mozilla/5.0 (compatible; SantsCompanyNewsBot/1.0; +https://santscompany.com)',
        CURLOPT_HTTPHEADER => ['Accept: text/html,application/xhtml+xml'],
    ]);
    $html = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $openGraphImageCache[$url] = is_string($html) && $httpCode >= 200 && $httpCode < 400
        ? extractImageFromHtml($html)
        : '';

    return $openGraphImageCache[$url];
}

function extractBanner($item, array $namespaces, $articleUrl) {
    if (isset($item->enclosure['url'])) {
        $enclosureType = strtolower((string) $item->enclosure['type']);
        if ($enclosureType === '' || str_starts_with($enclosureType, 'image/')) return (string) $item->enclosure['url'];
    }

    if (isset($namespaces['media'])) {
        $media = $item->children($namespaces['media']);
        if (isset($media->content['url'])) return (string) $media->content['url'];
        if (isset($media->thumbnail['url'])) return (string) $media->thumbnail['url'];
    }

    $html = '';
    if (isset($namespaces['content'])) {
        $html = trim((string) $item->children($namespaces['content'])->encoded);
    }
    if ($html === '') $html = trim((string) $item->content);
    if ($html === '') $html = trim((string) $item->description);

    $feedImage = extractImageFromHtml($html);
    if ($feedImage !== '') return $feedImage;

    $openGraphImage = fetchOpenGraphImage($articleUrl);
    return $openGraphImage !== '' ? $openGraphImage : '../assets/images/branding/logo.png';
}

foreach ($sources as $source) {
    $context = stream_context_create(['http' => ['timeout' => 10, 'user_agent' => 'SantsCompanyNewsBot/1.0']]);
    $raw = @file_get_contents($source['url'], false, $context);
    if (!$raw) continue;

    $xml = @simplexml_load_string($raw);
    if (!$xml) continue;

    $feedNamespaces = $xml->getNamespaces(true);
    $feedItems = [];
    if (isset($xml->channel->item)) {
        $feedItems = $xml->channel->item;
    } elseif (isset($xml->entry)) {
        $feedItems = $xml->entry;
    }
    if (!$feedItems) continue;

    $count = 0;
    foreach ($feedItems as $item) {
        if ($count >= $maxPerSource) break;

        $namespaces = $feedNamespaces;
        $link = trim((string) $item->link);
        if ($link === '' && isset($item->link['href'])) {
            $link = trim((string) $item->link['href']);
        }
        if ($link === '' || isset($seenLinks[$link])) continue;

        $originalTitle = extractItemText($item, $namespaces, ['title']);
        if ($originalTitle === '') continue;

        $originalSummary = normalizeSummary(extractItemText($item, $namespaces, ['description', 'summary', 'content:encoded', 'content']));
        $titlePtBr = translateToPtBr($originalTitle);
        $summaryPtBr = $originalSummary !== '' ? translateToPtBr($originalSummary) : 'Leia a cobertura completa na fonte original.';
        $banner = extractBanner($item, $namespaces, $link);
        if ($banner === '../assets/images/branding/logo.png') continue;

        $pubDateRaw = extractItemText($item, $namespaces, ['pubDate', 'published', 'updated', 'dc:date']);
        $pubDate = strtotime($pubDateRaw) ?: time();

        $items[] = [
            'id' => md5($link),
            'url' => $link,
            'title' => $titlePtBr,
            'category' => $source['category'],
            'banner' => $banner,
            'date' => date('d/m/Y', $pubDate),
            'timestamp' => $pubDate,
            'readingTime' => '3 min de leitura',
            'summary' => $summaryPtBr,
            'sourceName' => $source['sourceName'],
        ];
        $seenLinks[$link] = true;
        $count++;
    }
}

usort($items, fn($a, $b) => $b['timestamp'] <=> $a['timestamp']);
$items = array_slice($items, 0, $maxTotal);

$outputPath = __DIR__ . '/../data/blog/news.json';
file_put_contents($outputPath, json_encode($items, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

echo 'OK: ' . count($items) . ' notícias salvas em ' . date('Y-m-d H:i:s') . "\n";
