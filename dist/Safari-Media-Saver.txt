function collectMedia(document, pageURL, additionalData) {
  "use strict";
  additionalData = additionalData || [];
  const MAX_NODES = 60000;
  const MAX_JSON = 12000000;
  const deadline = Date.now() + 2500;
  const warnings = new Set();
  const media = new Map();
  let scanned = 0;
  let expected = 0;
  let structured = false;
  let inaccessibleVideos = 0;

  function identify(raw) {
    try {
      const u = new URL(raw, pageURL);
      const host = u.hostname.toLowerCase();
      let platform = "";
      let id = "";
      if (/(^|\.)instagram\.com$/.test(host)) {
        platform = "Instagram";
        id = (u.pathname.match(/\/(?:p|reels?|tv)\/([\w-]+)/) || [])[1] || "";
      } else if (/(^|\.)tiktok\.com$/.test(host)) {
        platform = "TikTok";
        id = (u.pathname.match(/\/(?:video|photo)\/(\d+)/) || [])[1] || "";
      } else if (/(^|\.)facebook\.com$/.test(host) || host === "fb.watch") {
        platform = "Facebook";
        id = u.searchParams.get("fbid") || u.searchParams.get("story_fbid") || u.searchParams.get("v") ||
          (u.pathname.match(/\/(?:reel|videos|posts)\/([^/?]+)/) || [])[1] ||
          (u.pathname.match(/\/photos\/(?:[^/]+\/)*(\d+)\/?$/) || [])[1] || "";
      }
      return { platform, id, url: u.href };
    } catch (_) { return { platform: "", id: "", url: "" }; }
  }

  const target = identify(pageURL);
  const baseResult = { platform: target.platform, pageURL, urls: [], items: [], expected: 0, complete: false };
  if (!target.platform) return { ...baseResult, notice: "Chỉ hỗ trợ bài đăng Facebook, Instagram và TikTok mở trong Safari." };
  // Short URLs need to finish redirecting before extraction. Never scan a feed/profile.
  if (!target.id) return { ...baseResult, notice: "Hãy mở liên kết của một bài đăng cụ thể trong Safari và đợi trang tải xong. Không hỗ trợ quét toàn bộ trang cá nhân, bảng tin hay album phân trang." };

  function cleanURL(raw) {
    if (typeof raw !== "string" || !raw) return "";
    try {
      const u = new URL(raw.replace(/&amp;/g, "&"), pageURL);
      if (u.protocol !== "https:" || u.username || u.password) return "";
      if (/\.(?:m3u8|mpd)(?:$|[?#])/i.test(u.href)) {
        warnings.add("Có luồng HLS/DASH không thể lưu trực tiếp bằng bản này.");
        return "";
      }
      return u.href;
    } catch (_) { return ""; }
  }

  function urlsFrom(value) {
    if (!value) return [];
    if (typeof value === "string") return [value];
    if (Array.isArray(value)) return value.flatMap(urlsFrom);
    if (typeof value === "object") {
      return urlsFrom(value.urlList || value.UrlList || value.url_list || value.url || value.src || value.uri);
    }
    return [];
  }

  function add(kind, values, id, width, height) {
    const alternatives = [...new Set(urlsFrom(values).map(cleanURL).filter(Boolean))];
    if (!alternatives.length) return false;
    const key = kind + ":" + (id || alternatives[0]);
    const score = Number(width || 0) * Number(height || 0);
    const existing = media.get(key);
    if (!existing || score > existing.score) media.set(key, { kind, url: alternatives[0], id: String(id || ""), score });
    return true;
  }

  function best(items) {
    return [...(Array.isArray(items) ? items : [])].sort((a, b) =>
      Number(b.width || b.config_width || 0) * Number(b.height || b.config_height || 0) -
      Number(a.width || a.config_width || 0) * Number(a.height || a.config_height || 0));
  }

  const skipKeys = /^(?:owner|author|authorInfo|user|users|actors|comments|edge_media_to_comment|edge_media_to_parent_comment|edge_related_profiles|recommendations|suggested|related|related_videos|viewer|feedback|music|avatar|profile_pic_url)$/;
  function walk(root, callback, skip = false) {
    const stack = [root];
    const visited = new Set();
    while (stack.length) {
      if (++scanned > MAX_NODES || Date.now() > deadline) {
        warnings.add("Dữ liệu trang quá lớn; chỉ đọc được một phần. Mở riêng bài đăng rồi thử lại.");
        break;
      }
      const n = stack.pop();
      if (!n || typeof n !== "object" || visited.has(n)) continue;
      visited.add(n);
      if (callback(n) === false) continue;
      const entries = Array.isArray(n) ? n.map((v, i) => [String(i), v]) : Object.entries(n);
      for (let i = entries.length - 1; i >= 0; i--) {
        const [key, value] = entries[i];
        if (!skip || !skipKeys.test(key)) stack.push(value);
      }
    }
  }

  function matches(n) {
    if ([n.shortcode, n.code, n.id, n.pk, n.post_id, n.video_id, n.aweme_id].some(v => v != null && String(v) === target.id)) return true;
    return [n.permalink_url, n.story_permalink, n.url].some(v => {
      if (typeof v !== "string" || !/^https:\/\//.test(v)) return false;
      const other = identify(v);
      return other.platform === target.platform && other.id === target.id;
    });
  }

  function instagram(n, fallbackID) {
    const children = n.carousel_media || (n.edge_sidecar_to_children && n.edge_sidecar_to_children.edges.map(e => e.node));
    if (Array.isArray(children) && children.length) {
      expected = Math.max(expected, Number(n.carousel_media_count || (n.edge_sidecar_to_children || {}).count || children.length));
      children.forEach((child, i) => instagram(child, "ig-child-" + i));
      return true;
    }
    const id = n.id || n.pk || fallbackID;
    const versions = best(n.video_versions);
    const isVideo = n.is_video === true || n.media_type === 2 || n.__typename === "GraphVideo" || !!n.video_url || versions.length > 0;
    if (isVideo) {
      if (!add("video", versions.length ? versions : n.video_url, id)) inaccessibleVideos++;
      return true;
    }
    const images = best((n.image_versions2 || {}).candidates || n.display_resources);
    return add("image", images.length ? images : (n.display_url || n.display_src), id);
  }

  function tiktok(n) {
    const images = (n.imagePost || n.image_post_info || {}).images;
    if (Array.isArray(images) && images.length) {
      expected = Math.max(expected, images.length);
      images.forEach((img, i) => add("image", img.imageURL || img.displayImage || img.display_image || img, "tt-" + i));
      return true;
    }
    if (!n.video) return false;
    const v = n.video;
    if (!add("video", [v.playAddr, v.play_addr, v.downloadAddr, (v.download || {}).url, v.download_addr], n.id || n.aweme_id || target.id)) inaccessibleVideos++;
    return true;
  }

  function facebook(root) {
    let recognized = false;
    walk(root, n => {
      const video = n.__typename === "Video" || n.browser_native_hd_url || n.browser_native_sd_url || n.playable_url || n.playable_url_quality_hd;
      if (video) {
        let found = false;
        walk(n, part => {
          const progressive = best(part.progressive_urls).map(p => p.progressive_url);
          const sources = [part.browser_native_hd_url, part.playable_url_quality_hd, progressive, part.browser_native_sd_url, part.playable_url];
          if (add("video", sources, n.id || n.video_id || target.id)) found = true;
        }, true);
        if (!found) inaccessibleVideos++;
        recognized = true;
        return false;
      }
      if (n.__typename === "Photo") {
        const images = [n.image, n.photo_image, n.viewer_image, n.large_share_image].filter(Boolean);
        if (add("image", best(images), n.id || n.fbid)) recognized = true;
        return false;
      }
      const sub = n.all_subattachments || n.subattachments;
      if (sub && Number(sub.count)) expected = Math.max(expected, Number(sub.count));
    }, true);
    return recognized;
  }

  let jsonBytes = 0;
  const scripts = additionalData.map(data => ({ textContent: JSON.stringify(data) })).concat([...document.querySelectorAll("script")]);
  for (const script of scripts) {
    let text = (script.textContent || "").trim().replace(/^for\s*\(;;\);\s*/, "");
    if (!/^[\[{]/.test(text)) continue;
    jsonBytes += text.length;
    if (jsonBytes > MAX_JSON) { warnings.add("Trang chứa quá nhiều dữ liệu; kết quả có thể chưa đầy đủ."); break; }
    let root;
    try { root = JSON.parse(text); } catch (_) { continue; }
    walk(root, n => {
      if (!matches(n)) return;
      let handled = false;
      if (target.platform === "Instagram") handled = instagram(n, target.id);
      if (target.platform === "TikTok") handled = tiktok(n);
      if (target.platform === "Facebook") handled = facebook(n);
      if (handled) { structured = true; return false; }
    });
  }

  function attr(node, key) { return node && node.getAttribute(key) || ""; }
  function meta(key) { return attr(document.querySelector('meta[property="' + key + '"]'), "content"); }
  const canonical = identify(meta("og:url") || attr(document.querySelector('link[rel="canonical"]'), "href"));
  const validMetadata = canonical.platform === target.platform && canonical.id === target.id;

  // DOM fallback is deliberately limited to the matching post/article. A global
  // img scan would download avatars, recommendations and video cover images.
  if (!media.size && !structured) {
    const articles = [...document.querySelectorAll('article, [role="article"]')];
    let scope = articles.find(article => [...article.querySelectorAll("a[href]")].some(a => {
      const link = identify(attr(a, "href"));
      return link.platform === target.platform && link.id === target.id;
    }));
    if (!scope && articles.length === 1) scope = articles[0];
    if (target.platform === "TikTok" && !scope) scope = document.querySelector('[data-e2e="browse-video"], [data-e2e="video-detail"]');
    let hasVideo = false;
    if (scope) {
      const videos = [...scope.querySelectorAll("video")];
      hasVideo = videos.length > 0;
      videos.forEach((v, i) => {
        const sources = [v.currentSrc, attr(v, "src"), ...[...v.querySelectorAll("source")].map(s => attr(s, "src"))];
        if (!add("video", sources, "dom-video-" + i)) inaccessibleVideos++;
      });
      if (!hasVideo) {
        [...scope.querySelectorAll("img")].forEach(img => {
          const alt = attr(img, "alt");
          if (/avatar|profile|ảnh đại diện/i.test(alt)) return;
          if (Number(img.naturalWidth) < 240 || Number(img.naturalHeight) < 240) return;
          add("image", img.currentSrc || attr(img, "src"), null);
        });
      }
    }
    if (!media.size && validMetadata) {
      const ogVideo = meta("og:video:secure_url") || meta("og:video:url") || meta("og:video");
      // Only direct files: og:video may be an HTML player URL.
      if (ogVideo && /\.mp4(?:$|[?#])/i.test(ogVideo)) add("video", ogVideo, target.id);
      else if (!hasVideo && !ogVideo && !/video/i.test(meta("og:type")) && target.platform !== "TikTok" && !/\/(reel|reels|videos|tv)\//.test(pageURL)) {
        add("image", meta("og:image:secure_url") || meta("og:image"), target.id);
      }
    }
    if (media.size) warnings.add("Chỉ đọc được media đang hiện trên trang; bài nhiều ảnh có thể thiếu. Lướt các ảnh còn lại rồi chạy lại.");
  }

  const seen = new Set();
  const items = [...media.values()].filter(item => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  }).map(({ kind, url, id }) => ({ kind, url, id }));
  if (inaccessibleVideos) warnings.add("Có video chưa lấy được tệp trực tiếp. Phát video, chờ tải rồi chạy lại; luồng blob/HLS/DASH không được ghép ở bản này.");
  if (expected > items.length) warnings.add("Trang mới cung cấp " + items.length + "/" + expected + " media; chưa lấy đủ bài đăng.");
  const images = items.filter(x => x.kind === "image").length;
  const videos = items.length - images;
  const notice = items.length
    ? "Tìm thấy " + images + " ảnh và " + videos + " video trên " + target.platform + ".\n" +
      "Nhấn OK để tải và lưu vào Ảnh.\n" + [...warnings].join("\n")
    : "Chưa tìm được tệp ảnh/video có thể tải. Mở đúng bài đăng, đăng nhập trong Safari nếu cần, phát video hoặc lướt ảnh rồi thử lại. Trang có thể chặn tải hoặc chỉ cung cấp luồng video.\n" + [...warnings].join("\n");
  return { ...baseResult, urls: items.map(x => x.url), items, expected, notice, extracted: items.length, structured, warnings: [...warnings] };
}
async function resolveMedia(document, pageURL, request = globalThis.fetch) {
  const initial = collectMedia(document, pageURL);
  if (initial.platform !== "Instagram" || (initial.structured && initial.urls.length && !initial.warnings.length) || typeof request !== "function") return initial;
  const url = new URL(pageURL);
  const code = (url.pathname.match(/\/(?:p|reels?|tv)\/([\w-]+)/) || [])[1];
  if (!code) return initial;
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  let mediaID = 0n;
  for (const char of code) mediaID = mediaID * 64n + BigInt(alphabet.indexOf(char));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3500);
  try {
    const response = await request(url.origin + "/api/v1/media/" + mediaID.toString() + "/info/", {
      method: "GET", credentials: "same-origin", signal: controller.signal,
      headers: { Accept: "application/json", "X-IG-App-ID": "936619743392459" }
    });
    if (!response.ok) return initial;
    const data = await response.json();
    const items = (Array.isArray(data.items) ? data.items : []).filter(item =>
      item.code === code || String(item.pk || item.id || "").split("_")[0] === mediaID.toString());
    if (!items.length) return initial;
    const enriched = collectMedia(document, pageURL, items.map(item => ({ ...item, shortcode: code })));
    return enriched.structured && enriched.urls.length ? enriched : initial;
  } catch (_) { return initial; }
  finally { clearTimeout(timer); }
}
resolveMedia(document, location.href).then(completion).catch(error => {
  completion({urls: [], notice: "Không đọc được trang: " + String(error.message || error)});
});
