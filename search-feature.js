/* =============================================================
   SEARCH FEATURE
   - "trinh" / "trịnh" -> "Em yêu"
   - "minh" -> "Anh yêu"
   - Ngoài ra tìm dữ liệu Internet công khai qua Wikipedia API.
   - Bắt Enter hoặc bấm kính lúp; không sửa logic của dashboard.js.
   ============================================================= */

(() => {
  "use strict";

  const input = document.getElementById("dashSearch");
  const button = document.getElementById("dashSearchBtn");
  const panel = document.getElementById("dashSearchResults");

  if (!input || !button || !panel) return;

  const specialAnswers = {
    trinh: "Em yêu",
    trinhh: "Em yêu",
    minh: "Anh yêu"
  };

  function normalize(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/\s+/g, " ");
  }

  function escapeForText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function stripHtml(value) {
    const box = document.createElement("div");
    box.innerHTML = value || "";
    return escapeForText(box.textContent || box.innerText || "");
  }

  function positionPanel() {
    if (!panel.classList.contains("show")) return;

    const rect = input.getBoundingClientRect();
    const gap = 10;
    const margin = 10;

    panel.style.width = "";
    panel.style.left = `${Math.max(margin, Math.min(
      rect.left,
      window.innerWidth - panel.offsetWidth - margin
    ))}px`;
    panel.style.top = `${Math.min(
      rect.bottom + gap,
      Math.max(margin, window.innerHeight - panel.offsetHeight - margin)
    )}px`;

    if (rect.bottom + gap > window.innerHeight - margin) {
      panel.style.top = `${Math.max(margin, rect.top - panel.offsetHeight - gap)}px`;
    }
  }

  function showPanel() {
    panel.classList.add("show");
    panel.setAttribute("aria-hidden", "false");
    requestAnimationFrame(positionPanel);
  }

  function hidePanel() {
    panel.classList.remove("show");
    panel.setAttribute("aria-hidden", "true");
    panel.innerHTML = "";
  }

  function makeLoading(query) {
    panel.innerHTML = `
      <div class="search-result-header">
        <span class="search-result-heading">Kết quả tìm kiếm</span>
        <button class="search-result-close" type="button" aria-label="Đóng">×</button>
      </div>
      <div class="search-result-query">Từ khóa: <strong>${escapeForText(query)}</strong></div>
      <div class="search-loading">
        <span class="search-spinner"></span>
        Đang tìm thông tin trên Internet...
      </div>
    `;
    panel.querySelector(".search-result-close").addEventListener("click", hidePanel);
    showPanel();
  }

  function renderResults(query, special, webResults) {
    panel.replaceChildren();

    const header = document.createElement("div");
    header.className = "search-result-header";

    const heading = document.createElement("span");
    heading.className = "search-result-heading";
    heading.textContent = "Kết quả tìm kiếm";

    const close = document.createElement("button");
    close.className = "search-result-close";
    close.type = "button";
    close.setAttribute("aria-label", "Đóng");
    close.textContent = "×";
    close.addEventListener("click", hidePanel);

    header.append(heading, close);
    panel.append(header);

    const queryLine = document.createElement("div");
    queryLine.className = "search-result-query";
    queryLine.textContent = `Từ khóa: ${query}`;
    panel.append(queryLine);

    if (special) {
      const specialBox = document.createElement("div");
      specialBox.className = "search-special";

      const label = document.createElement("span");
      label.className = "search-special-label";
      label.textContent = "Thông tin có sẵn";

      const value = document.createElement("div");
      value.className = "search-special-value";
      value.textContent = special;

      specialBox.append(label, value);
      panel.append(specialBox);
    }

    const webTitle = document.createElement("div");
    webTitle.className = "search-web-title";
    webTitle.textContent = "Kết quả Internet";
    panel.append(webTitle);

    if (webResults.length) {
      const list = document.createElement("div");
      list.className = "search-web-list";

      webResults.forEach(item => {
        const link = document.createElement("a");
        link.className = "search-web-item";
        link.href = item.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";

        const title = document.createElement("div");
        title.className = "search-web-item-title";
        title.textContent = item.title;

        const snippet = document.createElement("div");
        snippet.className = "search-web-item-snippet";
        snippet.textContent = item.snippet || "Mở kết quả để xem thông tin chi tiết.";

        const source = document.createElement("div");
        source.className = "search-web-item-source";
        source.textContent = "Wikipedia";

        link.append(title, snippet, source);
        list.append(link);
      });

      panel.append(list);
    } else {
      const empty = document.createElement("div");
      empty.className = "search-empty";
      empty.textContent = "Chưa lấy được kết quả phù hợp từ Wikipedia. Bạn có thể mở tìm kiếm đầy đủ trên Google.";
      panel.append(empty);
    }

    const google = document.createElement("a");
    google.className = "search-google";
    google.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    google.target = "_blank";
    google.rel = "noopener noreferrer";
    google.textContent = "Tìm tiếp trên Internet";
    panel.append(google);

    showPanel();
  }

  async function wikipediaSearch(query) {
    const params = new URLSearchParams({
      action: "query",
      list: "search",
      srsearch: query,
      format: "json",
      origin: "*",
      utf8: "1",
      srlimit: "5"
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    try {
      const response = await fetch(
        `https://vi.wikipedia.org/w/api.php?${params.toString()}`,
        {
          method: "GET",
          signal: controller.signal
        }
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();

      return (data?.query?.search || []).map(item => ({
        title: escapeForText(item.title),
        snippet: stripHtml(item.snippet),
        url: `https://vi.wikipedia.org/wiki/${encodeURIComponent(String(item.title || "").replace(/ /g, "_"))}`
      }));
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async function doSearch() {
    const query = input.value.trim();

    if (!query) {
      renderResults("", null, []);
      return;
    }

    const key = normalize(query);
    const special = specialAnswers[key] || null;

    makeLoading(query);

    try {
      const webResults = await wikipediaSearch(query);
      renderResults(query, special, webResults);
    } catch (error) {
      console.warn("Không lấy được dữ liệu Internet:", error);
      renderResults(query, special, []);
    }
  }

  // Bắt ở capture để không cho listener search cũ trong dashboard.js mở dialog khác.
  input.addEventListener("keydown", event => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    event.stopImmediatePropagation();
    doSearch();
  }, true);

  button.addEventListener("click", event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    doSearch();
  }, true);

  document.addEventListener("click", event => {
    if (!panel.classList.contains("show")) return;
    if (panel.contains(event.target) || input.contains(event.target) || button.contains(event.target)) return;
    hidePanel();
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") hidePanel();
  });

  window.addEventListener("resize", positionPanel);
  window.addEventListener("scroll", positionPanel, { passive: true });
})();
