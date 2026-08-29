<?php
// blog/rss.php
header('Content-Type: application/rss+xml; charset=UTF-8');

$jsonPath = __DIR__ . '/../data/blog/news.json';
$rawJson = file_exists($jsonPath) ? file_get_contents($jsonPath) : false;
$items = is_string($rawJson) ? json_decode($rawJson, true) : [];
if (!is_array($items)) {
    $items = [];
}

$siteUrl = 'https://santscompany.com';
$lastBuildTimestamp = time();

foreach ($items as $item) {
    if (isset($item['timestamp']) && is_numeric($item['timestamp'])) {
        $lastBuildTimestamp = max($lastBuildTimestamp, (int) $item['timestamp']);
    }
}

function escXml($str) {
    return htmlspecialchars($str ?? '', ENT_XML1 | ENT_QUOTES, 'UTF-8');
}

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>Sants Company - Notícias de Tecnologia, Marketing e Desenvolvimento</title>
  <link><?= $siteUrl ?>/blog/</link>
  <description>Curadoria de notícias sobre tecnologia, IA, marketing digital, SEO e desenvolvimento web, com curadoria da Sants Company.</description>
  <language>pt-BR</language>
  <lastBuildDate><?= date(DATE_RSS, $lastBuildTimestamp) ?></lastBuildDate>
  <atom:link href="<?= $siteUrl ?>/blog/rss.php" rel="self" type="application/rss+xml" />
  <ttl>240</ttl>
  <?php foreach ($items as $item): ?>
  <item>
    <title><?= escXml($item['title'] ?? '') ?></title>
    <link><?= escXml($item['url'] ?? $siteUrl . '/blog/') ?></link>
    <guid isPermaLink="false"><?= escXml($item['id'] ?? md5(($item['url'] ?? '') . ($item['title'] ?? ''))) ?></guid>
    <pubDate><?= date(DATE_RSS, isset($item['timestamp']) && is_numeric($item['timestamp']) ? (int) $item['timestamp'] : time()) ?></pubDate>
    <category><?= escXml($item['category'] ?? '') ?></category>
    <description><?= escXml(($item['summary'] ?? '') . ' (Fonte: ' . ($item['sourceName'] ?? 'Fonte original') . ')') ?></description>
  </item>
  <?php endforeach; ?>
</channel>
</rss>
