const data = window.ATLAS;
let currentFilter = "all", currentYear = 2026, yearFilterActive = false;
const $ = s => document.querySelector(s);
const typeName = t => ({work:"Work",travel:"Travel",nala:"Nala",project:"Project"}[t]);

const map = new maplibregl.Map({
  container:"map",
  style:"https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  center:[8,30],
  zoom:1.35,
  minZoom:1.7,
  maxZoom:12,
  renderWorldCopies:false
});
map.addControl(new maplibregl.NavigationControl({showCompass:false}),"bottom-right");

const markers = new Map();

function visible(item){
  const typeOK = currentFilter === "all" || item.type === currentFilter;
  const yearOK = !yearFilterActive || item.year <= currentYear;
  return typeOK && yearOK;
}

function makeMarker(item){
  const el=document.createElement("div");
  el.className=`marker ${item.type}`;
  el.classList.add("placeholder");
  const label=document.createElement("div");
  label.className="marker-label";
  label.textContent=item.title;
  el.appendChild(label);
  el.addEventListener("click",()=>openStory(item));
  const marker=new maplibregl.Marker({element:el,anchor:"center"})
    .setLngLat([item.lng,item.lat]).addTo(map);
  markers.set(item.id,marker);
}

data.forEach(makeMarker);

function render(){
  const list=data.filter(visible);
  $("#itemCount").textContent=list.length;
  $("#visibleCount").textContent=`${list.length} shown`;

  markers.forEach((m,id)=>{
    const item=data.find(x=>x.id===id);
    m.getElement().style.display=visible(item)?"":"none";
  });

  $("#cards").innerHTML=list.map(card).join("");
  document.querySelectorAll(".card").forEach(c=>{
    c.onclick=()=>openStory(data.find(x=>x.id===c.dataset.id));
  });
}

function card(x){
  return `<article class="card" data-id="${x.id}">
    <div class="card-img placeholder">Open story</div>
    <div class="card-body">
      <div class="tag">${typeName(x.type)} · ${x.year}</div>
      <h3>${x.title}</h3>
      <p class="card-summary">Loading story…</p>
      <div class="meta">${x.location}</div>
    </div>
  </article>`;
}

async function loadStory(item){
  const response = await fetch(item.story);
  if(!response.ok) throw new Error(`Could not load ${item.story}`);
  const markdown = await response.text();
  return parseMarkdownStory(markdown);
}

function parseMarkdownStory(source){
  const match = source.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  const meta = {};
  let body = source;

  if(match){
    match[1].split("\n").forEach(line=>{
      const i=line.indexOf(":");
      if(i>0) meta[line.slice(0,i).trim()] = line.slice(i+1).trim();
    });
    body=match[2].trim();
  }

  return {
    meta,
    body,
    html:markdownToHtml(body)
  };
}

function escapeHtml(value){
  return String(value).replace(/[&<>"']/g,c=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

function inlineMarkdown(text){
  let safe=escapeHtml(text);
  safe=safe.replace(/!\[([^\]]*)\]\(([^)]+)\)/g,'<img src="$2" alt="$1">');
  safe=safe.replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2">$1</a>');
  safe=safe.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>");
  safe=safe.replace(/\*([^*]+)\*/g,"<em>$1</em>");
  return safe;
}

function markdownToHtml(markdown){
  const lines=markdown.split(/\r?\n/);
  const html=[];
  let paragraph=[];
  let list=[];

  const flushParagraph=()=>{
    if(paragraph.length){
      html.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
      paragraph=[];
    }
  };

  const flushList=()=>{
    if(list.length){
      html.push(`<ul>${list.map(x=>`<li>${inlineMarkdown(x)}</li>`).join("")}</ul>`);
      list=[];
    }
  };

  for(const line of lines){
    if(/^#{1,6}\s+/.test(line)){
      flushParagraph(); flushList();
      const m=line.match(/^(#{1,6})\s+(.*)$/);
      const level=m[1].length;
      html.push(`<h${level}>${inlineMarkdown(m[2])}</h${level}>`);
    }else if(/^- /.test(line)){
      flushParagraph();
      list.push(line.slice(2));
    }else if(!line.trim()){
      flushParagraph(); flushList();
    }else{
      flushList();
      paragraph.push(line.trim());
    }
  }
  flushParagraph(); flushList();
  return html.join("\n");
}

async function openStory(item){
  const dialog=$("#storyDialog");
  const content=$("#dialogContent");
  content.innerHTML=`<div class="loading">Loading story…</div>`;
  dialog.showModal();

  try{
    const story=await loadStory(item);
    const cover=story.meta.cover;
    content.innerHTML=`
      ${cover?`<div class="story-hero" style="background-image:url('${cover}')"></div>`:`<div class="story-hero placeholder">Add a hero photo</div>`}
      <article class="dialog-body story-content">
        <div class="tag">${typeName(item.type)} · ${item.year}</div>
        <h2>${escapeHtml(story.meta.title || item.title)}</h2>
        <div class="location">${escapeHtml(story.meta.location || item.location)}</div>
        <div class="markdown">${story.html}</div>
        <div class="story-actions">
          <a class="read-more" href="story.html?story=${encodeURIComponent(item.story)}">Open full story ↗</a>
        </div>
      </article>`;
  }catch(error){
    content.innerHTML=`
      <div class="dialog-body">
        <div class="tag">${typeName(item.type)} · ${item.year}</div>
        <h2>${escapeHtml(item.title)}</h2>
        <p>Could not load this story. Check that the site is being served from GitHub Pages or another web server.</p>
        <code>${escapeHtml(item.story)}</code>
      </div>`;
    console.error(error);
  }
}

$(".close").onclick=()=>$("#storyDialog").close();
$("#storyDialog").addEventListener("click",e=>{
  if(e.target.id==="storyDialog") $("#storyDialog").close();
});

document.querySelectorAll(".filter").forEach(btn=>btn.onclick=()=>{
  document.querySelectorAll(".filter").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
  currentFilter=btn.dataset.filter;
  render();
});

$("#year").oninput=e=>{
  currentYear=+e.target.value;
  yearFilterActive=true;
  $("#yearLabel").textContent=currentYear;
  render();
};

$("#resetYear").onclick=()=>{
  yearFilterActive=false;
  $("#year").value=2026;
  $("#yearLabel").textContent="2026";
  render();
};

render();
