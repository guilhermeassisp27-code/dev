// Renderizador de Markdown minimalista (sem dependências externas).
// Suporta: títulos (#, ##, ###), negrito (**), listas (-, *) e parágrafos.
// Escapa HTML antes de converter para evitar injeção.

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inline(s: string): string {
  return escapeHtml(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<em>$1</em>");
}

export function markdownToHtml(md: string): string {
  const linhas = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let emLista = false;
  let paragrafo: string[] = [];

  const fecharParagrafo = () => {
    if (paragrafo.length) {
      out.push(`<p>${inline(paragrafo.join(" "))}</p>`);
      paragrafo = [];
    }
  };
  const fecharLista = () => {
    if (emLista) {
      out.push("</ul>");
      emLista = false;
    }
  };

  for (const linha of linhas) {
    const l = linha.trim();
    if (l === "") {
      fecharParagrafo();
      fecharLista();
      continue;
    }
    const h = l.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      fecharParagrafo();
      fecharLista();
      const nivel = h[1].length;
      out.push(`<h${nivel}>${inline(h[2])}</h${nivel}>`);
      continue;
    }
    const item = l.match(/^[-*]\s+(.*)$/);
    if (item) {
      fecharParagrafo();
      if (!emLista) {
        out.push("<ul>");
        emLista = true;
      }
      out.push(`<li>${inline(item[1])}</li>`);
      continue;
    }
    paragrafo.push(l);
  }
  fecharParagrafo();
  fecharLista();
  return out.join("\n");
}
