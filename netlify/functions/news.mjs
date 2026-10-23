export async function handler(event, context) {
  const isWeekend = [0, 6].includes(new Date().getDay());

  const feeds = isWeekend
    ? [
        { name: "Hipertextual", url: "https://hipertextual.com/feed" },
        { name: "Google Tecnología", url: "https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=es-419&gl=BO&ceid=BO:es-419" },
        { name: "BBC Mundo", url: "https://feeds.bbci.co.uk/mundo/rss.xml" }
      ]
    : [
        { name: "Google Noticias Bolivia", url: "https://news.google.com/rss?hl=es-419&gl=BO&ceid=BO:es-419" },
        { name: "BBC Mundo", url: "https://feeds.bbci.co.uk/mundo/rss.xml" },
        { name: "DW Español", url: "https://rss.dw.com/xml/rss-sp-all" },
        { name: "El País América", url: "https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/america/portada" }
      ];

  const allArticles = [];

  for (const f of feeds) {
    try {
      const res = await fetch(f.url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        signal: AbortSignal.timeout(6000)
      });

      if (!res.ok) continue;

      const text = await res.text();
      const items = text.split(/<item[\s>]/i).slice(1);

      for (const item of items.slice(0, 10)) {
        const titleMatch = item.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
        const dateMatch = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
        const sourceMatch = item.match(/<source[^>]*>([\s\S]*?)<\/source>/i);

        if (titleMatch && titleMatch[1]) {
          let title = titleMatch[1]
            .replace(/<!\[CDATA\[|\]\]>/g, "")
            .replace(/<[^>]+>/g, "")
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&amp;/g, "&")
            .trim();

          let sourceName = f.name;
          if (sourceMatch && sourceMatch[1]) {
            sourceName = sourceMatch[1].replace(/<[^>]+>/g, "").trim();
          }

          if (title.endsWith(" - " + sourceName)) {
            title = title.slice(0, -(sourceName.length + 3)).trim();
          }

          if (title.length > 10) {
            allArticles.push({
              title,
              source: sourceName,
              date: dateMatch ? dateMatch[1].trim() : "RECIENTE"
            });
          }
        }
      }
    } catch (err) {
      // Continuar con los demás feeds si uno falla
    }
  }

  // Mezclar un poco las noticias para variedad visual
  const shuffled = allArticles.sort(() => 0.5 - Math.random());

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200"
    },
    body: JSON.stringify(shuffled)
  };
}
