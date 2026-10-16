const params = new URLSearchParams(location.search);
const storyPath = params.get("story");
const content = document.querySelector("#storyPageContent");
const titleEl = document.querySelector("#storyPageTitle");

function parseFrontMatter(text){
  const m=text.match(/^---\s*([\s\S]*?)\s*---/);
  if(!m) return {meta:{},body:text};
  const meta={};
  m[1].split("\n").forEach(line=>{
    const i=line.indexOf(":");
    if(i>0) meta[line.slice(0,i).trim()] = line.slice(i+1).trim();
  });
  return {meta,body:text.slice(m[0].length).trim()};
}

function renderMarkdown(md) {
  let s=md.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  s=s.replace(/:::fullwidth\s*([\s\S]*?)\s*:::/g,'<div class="fullwidth">$1</div>');
  s=s.replace(/:::gallery\s*([\s\S]*?)\s*:::/g,'<div class="photo-gallery">$1</div>');
  s=s.replace(/^### (.*)$/gm,"<h3>$1</h3>");
  s=s.replace(/^## (.*)$/gm,"<h2>$1</h2>");
  s=s.replace(/^# (.*)$/gm,"<h1>$1</h1>");
  s=s.replace(/^\*([^*\n]+)\*$/gm,'<figcaption>$1</figcaption>');
  s=s.replace(/^!\[([^\]]*)\]\(([^)]+)\)$/gm,'<figure><img src="$2" alt="$1" loading="lazy" class="zoomable"><figcaption>$1</figcaption></figure>');
  s=s.replace(/^\s*-\s+(.*)$/gm,"<li>$1</li>");
  s=s.replace(/(<li>.*<\/li>\n?)+/g,m=>"<ul>"+m+"</ul>");
  s=s.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>");
  s=s.replace(/\*([^*]+)\*/g,"<em>$1</em>");
  s=s.replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2">$1</a>');
  s=s.split(/\n{2,}/).map(block=>{
    block=block.trim();
    if(!block || /^<(h[1-3]|ul|figure|div)/.test(block)) return block;
    return `<p>${block.replace(/\n/g," ")}</p>`;
  }).join("\n");
  return s;
}

async function load(){
  if(!storyPath){ content.innerHTML="<p>Story not found.</p>"; return; }
  const res=await fetch(storyPath);
  const text=await res.text();
  const {meta,body}=parseFrontMatter(text);
  titleEl.textContent=meta.title||"Story";
  const cover=meta.cover ? `<img class="story-hero" src="${meta.cover}" alt="${meta.title||""}">` : "";
  content.innerHTML=cover+renderMarkdown(body);
  document.querySelectorAll(".zoomable").forEach(img=>{
    img.addEventListener("click",()=>openLightbox(img.src,img.alt));
  });
}
function openLightbox(src,alt){
  const el=document.createElement("div");
  el.className="lightbox";
  el.innerHTML=`<button aria-label="Close">×</button><img src="${src}" alt="${alt}">`;
  el.onclick=e=>{ if(e.target===el || e.target.tagName==="BUTTON") el.remove(); };
  document.body.appendChild(el);
}
load();
