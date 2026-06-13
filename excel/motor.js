/* ============================================================
   IMPÉRIO DIGITAL — Simulador de Excel (motor de fórmulas + planilha)
   Pura: avalia fórmulas em pt-BR sobre uma grade de células.
   Testável no Node (module.exports) e usável no navegador (DOM).
   ============================================================ */
(function () {
  "use strict";

  /* ---------- utilidades de referência ---------- */
  function colParaNum(letras) {
    let n = 0;
    for (const ch of letras.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64);
    return n; // A=1
  }
  function numParaCol(n) {
    let s = "";
    while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); }
    return s;
  }
  function parseRef(ref) {
    const m = /^\$?([A-Za-z]{1,3})\$?(\d+)$/.exec(ref);
    if (!m) return null;
    return { col: colParaNum(m[1]), row: parseInt(m[2], 10) };
  }
  const ERR = (e) => ({ e });
  const ehErro = (v) => v && typeof v === "object" && "e" in v;

  /* ---------- tokenizer ---------- */
  function tokenizar(f) {
    const toks = [];
    let i = 0;
    const ops3 = []; // none
    while (i < f.length) {
      const c = f[i];
      if (c === " " || c === "\t" || c === "\n") { i++; continue; }
      // string
      if (c === '"') {
        let j = i + 1, s = "";
        while (j < f.length) {
          if (f[j] === '"') { if (f[j + 1] === '"') { s += '"'; j += 2; continue; } break; }
          s += f[j]; j++;
        }
        toks.push({ t: "str", v: s }); i = j + 1; continue;
      }
      // número (decimal com ponto)
      if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(f[i + 1]))) {
        let j = i, s = "";
        while (j < f.length && /[0-9.]/.test(f[j])) { s += f[j]; j++; }
        toks.push({ t: "num", v: parseFloat(s) }); i = j; continue;
      }
      // operadores de 2 chars
      const dois = f.substr(i, 2);
      if (dois === "<>" || dois === "<=" || dois === ">=") { toks.push({ t: "op", v: dois }); i += 2; continue; }
      if ("+-*/^&=<>".includes(c)) { toks.push({ t: "op", v: c }); i++; continue; }
      if (c === "(") { toks.push({ t: "(", v: c }); i++; continue; }
      if (c === ")") { toks.push({ t: ")", v: c }); i++; continue; }
      if (c === ";" || c === ",") { toks.push({ t: "sep", v: ";" }); i++; continue; }
      if (c === ":") { toks.push({ t: "colon", v: ":" }); i++; continue; }
      if (c === "%") { toks.push({ t: "op", v: "%" }); i++; continue; }
      // identificador: nome de função, referência ou booleano
      if (/[A-Za-zÀ-ÿ_$]/.test(c)) {
        let j = i, s = "";
        while (j < f.length && /[A-Za-zÀ-ÿ0-9_.$]/.test(f[j])) { s += f[j]; j++; }
        // é referência de célula?
        if (parseRef(s)) toks.push({ t: "ref", v: s });
        else toks.push({ t: "nome", v: s });
        i = j; continue;
      }
      throw { e: "#NOME?" };
    }
    return toks;
  }

  /* ---------- parser (descida recursiva) ---------- */
  function parsear(toks) {
    let p = 0;
    const peek = () => toks[p];
    const next = () => toks[p++];
    function expr() { return comparacao(); }
    function comparacao() {
      let no = concat();
      while (peek() && peek().t === "op" && ["=", "<>", "<", ">", "<=", ">="].includes(peek().v)) {
        const op = next().v; no = { tipo: "bin", op, a: no, b: concat() };
      }
      return no;
    }
    function concat() {
      let no = aritAdd();
      while (peek() && peek().t === "op" && peek().v === "&") { next(); no = { tipo: "bin", op: "&", a: no, b: aritAdd() }; }
      return no;
    }
    function aritAdd() {
      let no = aritMul();
      while (peek() && peek().t === "op" && (peek().v === "+" || peek().v === "-")) { const op = next().v; no = { tipo: "bin", op, a: no, b: aritMul() }; }
      return no;
    }
    function aritMul() {
      let no = unario();
      while (peek() && peek().t === "op" && (peek().v === "*" || peek().v === "/")) { const op = next().v; no = { tipo: "bin", op, a: no, b: unario() }; }
      return no;
    }
    function unario() {
      if (peek() && peek().t === "op" && (peek().v === "-" || peek().v === "+")) { const op = next().v; return { tipo: "un", op, a: unario() }; }
      return posfixo();
    }
    function posfixo() {
      let no = potencia();
      while (peek() && peek().t === "op" && peek().v === "%") { next(); no = { tipo: "pct", a: no }; }
      return no;
    }
    function potencia() {
      let no = primario();
      if (peek() && peek().t === "op" && peek().v === "^") { next(); no = { tipo: "bin", op: "^", a: no, b: unario() }; }
      return no;
    }
    function primario() {
      const tk = peek();
      if (!tk) throw { e: "#VALOR!" };
      if (tk.t === "num") { next(); return { tipo: "num", v: tk.v }; }
      if (tk.t === "str") { next(); return { tipo: "str", v: tk.v }; }
      if (tk.t === "(") { next(); const e = expr(); if (!peek() || peek().t !== ")") throw { e: "#VALOR!" }; next(); return e; }
      if (tk.t === "ref") {
        next();
        if (peek() && peek().t === "colon") { next(); const fim = next(); if (!fim || fim.t !== "ref") throw { e: "#REF!" }; return { tipo: "range", de: tk.v, ate: fim.v }; }
        return { tipo: "ref", v: tk.v };
      }
      if (tk.t === "nome") {
        next();
        const nome = tk.v.toUpperCase();
        if (peek() && peek().t === "(") {
          next(); const args = [];
          if (peek() && peek().t !== ")") {
            args.push(expr());
            while (peek() && peek().t === "sep") { next(); args.push(expr()); }
          }
          if (!peek() || peek().t !== ")") throw { e: "#VALOR!" };
          next();
          return { tipo: "func", nome, args };
        }
        if (nome === "VERDADEIRO") return { tipo: "bool", v: true };
        if (nome === "FALSO") return { tipo: "bool", v: false };
        throw { e: "#NOME?" };
      }
      throw { e: "#VALOR!" };
    }
    const arvore = expr();
    if (p < toks.length) throw { e: "#VALOR!" };
    return arvore;
  }

  /* ---------- coerção ---------- */
  function paraNumero(v) {
    if (ehErro(v)) return v;
    if (typeof v === "number") return v;
    if (typeof v === "boolean") return v ? 1 : 0;
    if (v === "" || v === null || v === undefined) return 0;
    if (typeof v === "string") {
      const s = v.trim().replace(",", ".");
      if (s !== "" && !isNaN(Number(s))) return Number(s);
      return ERR("#VALOR!");
    }
    return ERR("#VALOR!");
  }
  function paraTexto(v) {
    if (ehErro(v)) return v.e;
    if (typeof v === "boolean") return v ? "VERDADEIRO" : "FALSO";
    if (v === null || v === undefined) return "";
    if (typeof v === "number") return formatarNumero(v);
    return String(v);
  }
  function formatarNumero(n) {
    if (!isFinite(n)) return String(n);
    if (Number.isInteger(n)) return String(n);
    return String(Math.round(n * 1e10) / 1e10);
  }

  /* ---------- avaliador ---------- */
  function criarMotor(raw) {
    // raw: { "A1": "conteúdo", ... }
    const cache = {};
    const calculando = {};

    function valorBrutoDaCelula(ref) {
      const key = ref.toUpperCase().replace(/\$/g, "");
      return raw[key];
    }
    function valorCelula(ref) {
      const key = ref.toUpperCase().replace(/\$/g, "");
      if (key in cache) return cache[key];
      if (calculando[key]) return ERR("#REF!"); // ciclo
      calculando[key] = true;
      let res;
      const bruto = raw[key];
      if (bruto === undefined || bruto === null || bruto === "") res = "";
      else if (typeof bruto === "string" && bruto[0] === "=") {
        try { res = avaliarTexto(bruto.slice(1)); }
        catch (err) { res = ehErro(err) ? err : ERR("#VALOR!"); }
      } else {
        const s = String(bruto).trim();
        if (s !== "" && !isNaN(Number(s.replace(",", ".")))) res = Number(s.replace(",", "."));
        else res = bruto;
      }
      cache[key] = res; delete calculando[key];
      return res;
    }

    function expandirRange(de, ate) {
      const a = parseRef(de), b = parseRef(ate);
      if (!a || !b) return ERR("#REF!");
      const c1 = Math.min(a.col, b.col), c2 = Math.max(a.col, b.col);
      const r1 = Math.min(a.row, b.row), r2 = Math.max(a.row, b.row);
      const rows = [];
      for (let r = r1; r <= r2; r++) {
        const linha = [];
        for (let c = c1; c <= c2; c++) linha.push(valorCelula(numParaCol(c) + r));
        rows.push(linha);
      }
      return { range: true, rows };
    }
    function achatar(v) {
      if (v && v.range) { const o = []; v.rows.forEach((l) => l.forEach((x) => o.push(x))); return o; }
      return [v];
    }

    function ev(no) {
      switch (no.tipo) {
        case "num": return no.v;
        case "str": return no.v;
        case "bool": return no.v;
        case "ref": return valorCelula(no.v);
        case "range": return expandirRange(no.de, no.ate);
        case "un": {
          const a = ev(no.a); if (ehErro(a)) return a;
          const n = paraNumero(a); if (ehErro(n)) return n;
          return no.op === "-" ? -n : n;
        }
        case "pct": {
          const a = ev(no.a); if (ehErro(a)) return a;
          const n = paraNumero(a); if (ehErro(n)) return n;
          return n / 100;
        }
        case "bin": return binario(no);
        case "func": return funcao(no.nome, no.args);
        default: return ERR("#VALOR!");
      }
    }
    function binario(no) {
      const a = ev(no.a), b = ev(no.b);
      if (no.op === "&") {
        if (ehErro(a)) return a; if (ehErro(b)) return b;
        return paraTexto(a) + paraTexto(b);
      }
      if (["=", "<>", "<", ">", "<=", ">="].includes(no.op)) {
        if (ehErro(a)) return a; if (ehErro(b)) return b;
        return comparar(a, b, no.op);
      }
      const x = paraNumero(a); if (ehErro(x)) return x;
      const y = paraNumero(b); if (ehErro(y)) return y;
      switch (no.op) {
        case "+": return x + y;
        case "-": return x - y;
        case "*": return x * y;
        case "/": return y === 0 ? ERR("#DIV/0!") : x / y;
        case "^": return Math.pow(x, y);
      }
      return ERR("#VALOR!");
    }
    function comparar(a, b, op) {
      let r;
      if (typeof a === "number" && typeof b === "number") r = a - b;
      else if (typeof a === "boolean" || typeof b === "boolean") r = (a ? 1 : 0) - (b ? 1 : 0);
      else r = paraTexto(a).toLowerCase().localeCompare(paraTexto(b).toLowerCase());
      switch (op) {
        case "=": return r === 0;
        case "<>": return r !== 0;
        case "<": return r < 0;
        case ">": return r > 0;
        case "<=": return r <= 0;
        case ">=": return r >= 0;
      }
    }

    // critério tipo "Sul", ">1000", "<>x", "São*"
    function casaCriterio(valor, criterioRaw) {
      let crit = criterioRaw;
      if (typeof crit === "number") return paraNumero(valor) === crit;
      crit = String(crit);
      const m = /^(<=|>=|<>|=|<|>)(.*)$/.exec(crit);
      if (m) {
        const op = m[1] === "=" ? "=" : m[1]; const alvo = m[2];
        const alvoNum = !isNaN(Number(alvo)) && alvo !== "" ? Number(alvo) : null;
        if (alvoNum !== null && typeof valor !== "string") return comparar(paraNumero(valor), alvoNum, op === "=" ? "=" : op);
        return comparar(paraTexto(valor), alvo, op);
      }
      // curinga * e ?
      if (crit.includes("*") || crit.includes("?")) {
        const re = new RegExp("^" + crit.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".") + "$", "i");
        return re.test(paraTexto(valor));
      }
      return paraTexto(valor).toLowerCase() === crit.toLowerCase();
    }

    function nums(lista) { const o = []; lista.forEach((v) => { if (typeof v === "number") o.push(v); else if (typeof v === "string" && v.trim() !== "" && !isNaN(Number(v.replace(",", ".")))) o.push(Number(v.replace(",", "."))); }); return o; }

    function funcao(nome, args) {
      const A = () => args.map(ev);
      switch (nome) {
        case "SOMA": { let s = 0; for (const a of A()) { if (ehErro(a)) return a; nums(achatar(a)).forEach((n) => s += n); } return s; }
        case "MÉDIA": case "MEDIA": { let s = 0, c = 0; for (const a of A()) { if (ehErro(a)) return a; nums(achatar(a)).forEach((n) => { s += n; c++; }); } return c ? s / c : ERR("#DIV/0!"); }
        case "MÁXIMO": case "MAXIMO": case "MÁX": case "MAX": { const v = []; for (const a of A()) { if (ehErro(a)) return a; v.push(...nums(achatar(a))); } return v.length ? Math.max(...v) : 0; }
        case "MÍNIMO": case "MINIMO": case "MÍN": case "MIN": { const v = []; for (const a of A()) { if (ehErro(a)) return a; v.push(...nums(achatar(a))); } return v.length ? Math.min(...v) : 0; }
        case "CONT.NÚM": case "CONT.NUM": { let c = 0; for (const a of A()) { if (ehErro(a)) return a; c += nums(achatar(a)).length; } return c; }
        case "CONT.VALORES": { let c = 0; for (const a of A()) { if (ehErro(a)) return a; achatar(a).forEach((x) => { if (!(x === "" || x === null || x === undefined)) c++; }); } return c; }
        case "CONT.SE": { const r = ev(args[0]); const crit = ev(args[1]); if (ehErro(r)) return r; let c = 0; achatar(r).forEach((x) => { if (casaCriterio(x, crit)) c++; }); return c; }
        case "SOMASE": {
          const teste = ev(args[0]); const crit = ev(args[1]);
          const somaR = args[2] ? ev(args[2]) : teste;
          if (ehErro(teste)) return teste;
          const tl = achatar(teste), sl = achatar(somaR); let s = 0;
          tl.forEach((x, idx) => { if (casaCriterio(x, crit)) { const sv = sl[idx]; if (typeof sv === "number") s += sv; else { const n = paraNumero(sv); if (!ehErro(n)) s += n; } } });
          return s;
        }
        case "SOMASES": {
          const soma = achatar(ev(args[0])); let s = 0;
          const pares = [];
          for (let k = 1; k + 1 < args.length; k += 2) pares.push([achatar(ev(args[k])), ev(args[k + 1])]);
          for (let idx = 0; idx < soma.length; idx++) {
            let ok = true;
            for (const [arr, crit] of pares) if (!casaCriterio(arr[idx], crit)) { ok = false; break; }
            if (ok) { const n = paraNumero(soma[idx]); if (!ehErro(n)) s += n; }
          }
          return s;
        }
        case "SE": { const cond = ev(args[0]); if (ehErro(cond)) return cond; const verd = !!(cond === true || (typeof cond === "number" && cond !== 0)); return verd ? ev(args[1]) : (args[2] !== undefined ? ev(args[2]) : false); }
        case "SES": { for (let k = 0; k + 1 < args.length; k += 2) { const cond = ev(args[k]); if (ehErro(cond)) return cond; if (cond === true || (typeof cond === "number" && cond !== 0)) return ev(args[k + 1]); } return ERR("#N/D"); }
        case "E": { for (const a of A()) { if (ehErro(a)) return a; if (!(a === true || (typeof a === "number" && a !== 0))) return false; } return true; }
        case "OU": { for (const a of A()) { if (ehErro(a)) return a; if (a === true || (typeof a === "number" && a !== 0)) return true; } return false; }
        case "NÃO": case "NAO": { const a = ev(args[0]); if (ehErro(a)) return a; return !(a === true || (typeof a === "number" && a !== 0)); }
        case "SEERRO": case "SE.ERRO": { const a = ev(args[0]); return ehErro(a) ? ev(args[1]) : a; }
        case "PROCV": {
          const chave = ev(args[0]); const matriz = ev(args[1]); const indice = paraNumero(ev(args[2]));
          if (ehErro(matriz)) return matriz; if (ehErro(indice)) return indice;
          if (!matriz.range) return ERR("#VALOR!");
          for (const linha of matriz.rows) {
            if (casaCriterio(linha[0], chave) || comparar(linha[0], chave, "=") === true) {
              const col = indice - 1; if (col < 0 || col >= linha.length) return ERR("#REF!");
              return linha[col];
            }
          }
          return ERR("#N/D");
        }
        case "PROCX": {
          const chave = ev(args[0]); const proc = ev(args[1]); const ret = ev(args[2]);
          const seNao = args[3] !== undefined ? ev(args[3]) : ERR("#N/D");
          const pl = achatar(proc), rl = achatar(ret);
          for (let idx = 0; idx < pl.length; idx++) if (comparar(pl[idx], chave, "=") === true) return rl[idx];
          return seNao;
        }
        case "CONCAT": case "CONCATENAR": { let s = ""; for (const a of A()) { if (ehErro(a)) return a; achatar(a).forEach((x) => s += paraTexto(x)); } return s; }
        case "ESQUERDA": { const t = paraTexto(ev(args[0])); const n = args[1] ? paraNumero(ev(args[1])) : 1; return t.slice(0, n); }
        case "DIREITA": { const t = paraTexto(ev(args[0])); const n = args[1] ? paraNumero(ev(args[1])) : 1; return n <= 0 ? "" : t.slice(-n); }
        case "EXT.TEXTO": case "EXT.TEXT": { const t = paraTexto(ev(args[0])); const ini = paraNumero(ev(args[1])); const q = paraNumero(ev(args[2])); return t.substr(Math.max(0, ini - 1), q); }
        case "NÚM.CARACT": case "NUM.CARACT": return paraTexto(ev(args[0])).length;
        case "MAIÚSCULA": case "MAIUSCULA": return paraTexto(ev(args[0])).toUpperCase();
        case "MINÚSCULA": case "MINUSCULA": return paraTexto(ev(args[0])).toLowerCase();
        case "PRI.MAIÚSCULA": case "PRI.MAIUSCULA": return paraTexto(ev(args[0])).toLowerCase().replace(/(^|\s)\S/g, (m) => m.toUpperCase());
        case "ARRUMAR": return paraTexto(ev(args[0])).replace(/\s+/g, " ").trim();
        case "LOCALIZAR": case "PROCURAR": { const proc = paraTexto(ev(args[0])); const dentro = paraTexto(ev(args[1])); const ini = args[2] ? paraNumero(ev(args[2])) : 1; const pos = dentro.toLowerCase().indexOf(proc.toLowerCase(), ini - 1); return pos < 0 ? ERR("#VALOR!") : pos + 1; }
        case "SUBSTITUIR": { const t = paraTexto(ev(args[0])); const de = paraTexto(ev(args[1])); const para = paraTexto(ev(args[2])); return t.split(de).join(para); }
        case "ARRED": { const n = paraNumero(ev(args[0])); const d = args[1] ? paraNumero(ev(args[1])) : 0; const f = Math.pow(10, d); return Math.round(n * f) / f; }
        case "HOJE": { const d = new Date(); return formatarData(d); }
        case "AGORA": { return formatarData(new Date(), true); }
        case "ABS": { const n = paraNumero(ev(args[0])); return ehErro(n) ? n : Math.abs(n); }
        case "ARRED.PARA.CIMA": case "TETO": { const n = paraNumero(ev(args[0])); return Math.ceil(n); }
        default: return ERR("#NOME?");
      }
    }
    function formatarData(d, hora) {
      const p = (x) => String(x).padStart(2, "0");
      let s = `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
      if (hora) s += ` ${p(d.getHours())}:${p(d.getMinutes())}`;
      return s;
    }

    function avaliarTexto(formula) {
      const toks = tokenizar(formula);
      const arvore = parsear(toks);
      return ev(arvore);
    }

    return {
      // resultado exibível de uma célula
      resultado(ref) {
        const v = valorCelula(ref);
        return ehErro(v) ? v.e : paraTexto(v);
      },
      // valor "cru" computado (número/texto/bool/erro)
      valor(ref) { return valorCelula(ref); },
      bruto(ref) { return valorBrutoDaCelula(ref); },
    };
  }

  const API = { criarMotor, colParaNum, numParaCol, parseRef };

  if (typeof module !== "undefined" && module.exports) module.exports = API;
  if (typeof window !== "undefined") window.SimuladorExcel = API;
})();
