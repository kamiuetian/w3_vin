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

  // Market strip: placeholder values; API-ready hook
  function setTicker(sym, price){
    document.querySelectorAll(`[data-ticker="${sym}"]`).forEach(el=>{ el.textContent = price; });
  }

  // Default placeholders (no external calls by design)
  setTicker("BTC","-");
  setTicker("ETH","-");
  setTicker("AUX","-");

  // If developer later injects window.W3_MARKET_DATA, we render it
  if(window.W3_MARKET_DATA){
    const md = window.W3_MARKET_DATA;
    if(md.BTC) setTicker("BTC", md.BTC);
    if(md.ETH) setTicker("ETH", md.ETH);
    if(md.AUX) setTicker("AUX", md.AUX);
  }

})();
