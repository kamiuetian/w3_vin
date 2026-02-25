(function(){
  const cfg = window.W3_CONFIG || {};
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  // Language
  const html = document.documentElement;
  if(cfg.languages && cfg.languages.length){
    const stored = localStorage.getItem("w3_lang");
    const initial = stored && cfg.languages.includes(stored) ? stored : (cfg.defaultLang || "en");
    html.setAttribute("data-lang", initial);
  } else {
    html.setAttribute("data-lang","en");
  }

  const toast = $("#toast");
  function showToast(msg){
    if(!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(()=>toast.classList.remove("show"), 2200);
  }

  // Copy helpers
  $$(".copy-domain").forEach(btn=>{
    btn.addEventListener("click", async ()=>{
      try{
        await navigator.clipboard.writeText(cfg.domain || "");
        showToast("Copied: " + (cfg.domain || ""));
      }catch(e){
        showToast("Copy not available");
      }
    });
  });

  // Inquiry modal
  const modal = $("#inquiryModal");
  const openBtns = $$(".open-inquiry");
  const closeBtns = $$(".close-modal");
  const form = $("#inquiryForm");
  const submitRow = form ? form.querySelector(".cta-row") : null;
  let formStatus = $("#inquiryStatus");

  if(form && !formStatus){
    formStatus = document.createElement("div");
    formStatus.id = "inquiryStatus";
    formStatus.style.marginTop = "12px";
    formStatus.style.fontSize = "13px";
    formStatus.style.lineHeight = "1.4";
    formStatus.style.textAlign = "right";
    formStatus.style.color = "var(--muted)";
    if(submitRow){
      submitRow.insertAdjacentElement("afterend", formStatus);
    } else {
      form.appendChild(formStatus);
    }
  }

  function setStatus(msg, type="info"){
    if(!formStatus) return;
    formStatus.textContent = msg || "";
    if(type === "success"){
      formStatus.style.color = "#8fe3b0";
      return;
    }
    if(type === "error"){
      formStatus.style.color = "#ff9c9c";
      return;
    }
    formStatus.style.color = "var(--muted)";
  }

  function openModal(){ if(modal){ modal.classList.add("show"); } }
  function closeModal(){
    if(modal){ modal.classList.remove("show"); }
    setStatus("");
  }

  openBtns.forEach(b=>b.addEventListener("click", (e)=>{ e.preventDefault(); openModal(); }));
  closeBtns.forEach(b=>b.addEventListener("click", (e)=>{ e.preventDefault(); closeModal(); }));
  if(modal){
    modal.addEventListener("click",(e)=>{ if(e.target === modal) closeModal(); });
    document.addEventListener("keydown",(e)=>{ if(e.key==="Escape") closeModal(); });
  }

  const FORM_ENDPOINT = cfg.formEndpoint || "https://www.ranzotech.com/form/contact.php";

  async function submitInquiry(payload){
    const data = new FormData();
    data.append("name", payload.name || "");
    data.append("company", payload.org || "");
    data.append("role", payload.role || "");
    data.append("buyer_type", payload.type || "");
    data.append("intent", payload.use || "");
    data.append("budget", payload.budget || "");
    data.append("message", payload.msg || "");
    data.append("domain", cfg.domain || location.hostname);
    data.append("display_email", cfg.displayEmail || "");
    data.append("source_url", location.href);
    data.append("website", ""); // Honeypot field; must remain empty.
    data.append("response", "json");

    const resp = await fetch(FORM_ENDPOINT, {
      method: "POST",
      mode: "cors",
      headers: { Accept: "application/json" },
      body: data,
    });

    const contentType = resp.headers.get("content-type") || "";
    if(!contentType.includes("application/json")){
      throw new Error("Form endpoint response invalid. Please deploy updated contact.php.");
    }

    const body = await resp.json().catch(()=>null);
    if(!resp.ok || !body || body.success !== true){
      throw new Error((body && body.message) || "Inquiry submission failed.");
    }
  }

  if(form){
    form.addEventListener("submit", async (e)=>{
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      const payload = {
        name: $("#f_name")?.value.trim(),
        org: $("#f_org")?.value.trim(),
        role: $("#f_role")?.value.trim(),
        type: $("#f_type")?.value,
        use: $("#f_use")?.value.trim(),
        budget: $("#f_budget")?.value,
        msg: $("#f_msg")?.value.trim(),
      };

      if(submitBtn) submitBtn.disabled = true;
      setStatus("Sending inquiry...", "info");
      showToast("Sending inquiry...");

      try{
        await submitInquiry(payload);
        form.reset();
        setStatus("Inquiry sent successfully. We will contact you shortly.", "success");
        showToast("Inquiry sent successfully.");
      }catch(err){
        setStatus(err?.message || "Submission failed.", "error");
        showToast(err?.message || "Submission failed.");
      }finally{
        if(submitBtn) submitBtn.disabled = false;
      }
    });
  }

  // Language toggle button
  const langBtn = $("#langToggle");
  if(langBtn && cfg.languages && cfg.languages.length){
    langBtn.addEventListener("click", ()=>{
      const current = html.getAttribute("data-lang") || "en";
      const next = current === "en" ? (cfg.languages.includes("de") ? "de" : "en") : "en";
      html.setAttribute("data-lang", next);
      localStorage.setItem("w3_lang", next);
      showToast(next === "de" ? "Deutsch" : "English");
    });
  }

  // Hero parallax (subtle)
  const hero = $(".hero .bg");
  if(hero){
    let ticking = false;
    window.addEventListener("scroll", ()=>{
      if(ticking) return;
      ticking = true;
      window.requestAnimationFrame(()=>{
        const y = window.scrollY || 0;
        hero.style.backgroundPosition = `center ${Math.min(30, y*0.08)}px`;
        ticking = false;
      });
    }, {passive:true});
  }

  // Market strip: live top-10 crypto marquee
  const marketStrip = $(".market-strip");
  const marketTrack = $(".market-strip .track");
  const MARKET_API = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h";

  function escapeHtml(value){
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatUsd(value){
    if(typeof value !== "number" || !Number.isFinite(value)) return "-";
    if(value >= 1000){
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(value);
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(value);
  }

  function formatPct(value){
    if(typeof value !== "number" || !Number.isFinite(value)) return "0.00%";
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}%`;
  }

  function setTickerSpeed(){
    if(!marketTrack) return;
    const halfWidth = marketTrack.scrollWidth / 2;
    const pxPerSecond = 95;
    const seconds = Math.max(22, Math.min(90, halfWidth / pxPerSecond));
    marketTrack.style.setProperty("--ticker-speed", `${seconds}s`);
    // Force runtime animation so OS/browser motion prefs do not disable this banner.
    marketTrack.style.animation = `marquee ${seconds}s linear infinite`;
  }

  function renderMarketStrip(items){
    if(!marketTrack) return;
    if(!Array.isArray(items) || items.length === 0){
      marketTrack.innerHTML = "";
      marketStrip?.classList.add("market-strip--empty");
      return;
    }

    const row = items.map((coin)=>{
      const symbol = escapeHtml((coin.symbol || "").toUpperCase());
      const price = escapeHtml(formatUsd(coin.current_price));
      const pctValue = coin.price_change_percentage_24h;
      const pct = escapeHtml(formatPct(pctValue));
      const trendClass = Number.isFinite(pctValue) ? (pctValue >= 0 ? "up" : "down") : "flat";
      return `<div class="ticker"><span class="pill">${symbol}</span> <b>${price}</b> <span class="change ${trendClass}">${pct}</span></div>`;
    }).join("");

    // Duplicate once for seamless marquee.
    marketTrack.innerHTML = row + row;
    marketStrip?.classList.remove("market-strip--empty");
    setTickerSpeed();
  }

  async function refreshMarketStrip(){
    if(!marketTrack) return;
    try{
      const resp = await fetch(MARKET_API, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if(!resp.ok) throw new Error(`Market API error: ${resp.status}`);

      const data = await resp.json();
      if(!Array.isArray(data) || data.length === 0){
        throw new Error("Market API returned no data.");
      }

      renderMarketStrip(data.slice(0, 10));
    }catch(err){
      renderMarketStrip([]);
      if(window.console && console.warn){
        console.warn("Unable to load market strip data.", err);
      }
    }
  }

  if(Array.isArray(window.W3_MARKET_DATA?.TOP10) && window.W3_MARKET_DATA.TOP10.length){
    renderMarketStrip(window.W3_MARKET_DATA.TOP10.slice(0, 10));
  } else {
    refreshMarketStrip();
    window.setInterval(refreshMarketStrip, 60000);
  }

})();
