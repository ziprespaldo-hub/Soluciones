// ===============================
// Sistema de Análisis Jurídico Integral
// ===============================

class CarpetaAnalyzer {
  constructor() {
    this.documents = [];
    this.analysisResults = [];
    this.legalFramework = this.initLegalFramework();
    this.documentTypes = this.initDocumentTypes();
    this.init();
  }

  init() {
    this.initPDFWorker();
    this.setupEventListeners();
  }

  initPDFWorker() {
    if (typeof pdfjsLib !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
  }

  setupEventListeners() {
    document.addEventListener('DOMContentLoaded', () => {
      const fileInput = document.getElementById('fileInput');
      if (fileInput) fileInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files));

      const startBtn = document.getElementById('startAnalysis');
      if (startBtn) startBtn.addEventListener('click', () => this.startAnalysis());
    });
  }

  async handleFileSelect(files) {
    for (const file of files) {
      if (this.isValidFileType(file)) {
        const content = await this.extractText(file);
        this.documents.push({
          id: this.generateId(),
          name: file.name,
          content,
          analyzed: false
        });
      }
    }
    alert(`${this.documents.length} documentos cargados correctamente.`);
  }

  async startAnalysis() {
    this.analysisResults = [];
    for (const doc of this.documents) {
      const analysis = await this.analyzeDocument(doc);
      this.analysisResults.push(analysis);
      doc.analyzed = true;
    }
    alert('Análisis completado.');
    this.displayResults();
  }

  async analyzeDocument(doc) {
    const type = this.classifyDocument(doc.content);
    const foundArticles = this.getApplicableArticles(doc.content, type);

    return {
      documentName: doc.name,
      documentType: type,
      articles: foundArticles,
      resumen: `Documento ${doc.name} clasificado como ${type} con ${foundArticles.length} artículos legales aplicables.`
    };
  }

  classifyDocument(content) {
    let best = 'desconocido';
    let max = 0;
    const lower = content.toLowerCase();

    for (const [key, def] of Object.entries(this.documentTypes)) {
      const matches = def.keywords.filter(k => lower.includes(k)).length;
      if (matches > max) {
        max = matches;
        best = key;
      }
    }
    return best;
  }

  getApplicableArticles(content, docType) {
    const found = [];
    const lower = content.toLowerCase();

    for (const [code, arts] of Object.entries(this.legalFramework)) {
      for (const [art, def] of Object.entries(arts)) {
        const matches = def.applies.filter(k => lower.includes(k) || docType.includes(k));
        if (matches.length > 0) {
          found.push({ codigo: code, articulo: art, contenido: def.content });
        }
      }
    }
    return found;
  }

  displayResults() {
    const container = document.getElementById('resultsGrid');
    if (!container) return;

    container.innerHTML = '';

    this.analysisResults.forEach(result => {
      const card = document.createElement('div');
      card.className = 'result-card';

      const tipo = this.documentTypes[result.documentType]?.name || 'Desconocido';
      const articulos = result.articles.map(art => 
        `<li><strong>${art.codigo} ${art.articulo}:</strong> ${art.contenido}</li>`
      ).join('');

      card.innerHTML = `
        <div class="result-header">
          <div class="result-title">${result.documentName}</div>
          <div class="result-score score-medium">${tipo}</div>
        </div>
        <p>${result.resumen}</p>
        <ul>${articulos}</ul>
      `;

      container.appendChild(card);
    });
  }

  isValidFileType(file) {
    return /\.(pdf|docx)$/i.test(file.name);
  }

  async extractText(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    const buf = await file.arrayBuffer();

    if (ext === 'pdf') {
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const tc = await page.getTextContent();
        text += tc.items.map(t => t.str).join(' ') + '\n';
      }
      return text;
    }

    if (ext === 'docx') {
      const result = await mammoth.extractRawText({ arrayBuffer: buf });
      return result.value;
    }

    return '';
  }

  generateId() {
    return 'doc_' + Date.now() + '_' + Math.random().toString(36).slice(2);
  }

  initDocumentTypes() {
    return {
      denuncia: {
        name: 'Denuncia/Querella',
        keywords: ['denuncia', 'querella', 'hechos', 'delito']
      },
      inspeccion: {
        name: 'Inspección',
        keywords: ['inspección', 'evidencia', 'croquis']
      },
      entrevista: {
        name: 'Entrevista',
        keywords: ['entrevista', 'declaración', 'testigo']
      }
    };
  }

  initLegalFramework() {
    return {
      CPEUM: {
        art14: { content: 'Principio de legalidad', applies: ['legalidad', 'sentencia'] },
        art16: { content: 'Motivación de actos de autoridad', applies: ['mandamiento', 'cateo'] }
      },
      CNPP: {
        art131: { content: 'Ejercicio de la acción penal', applies: ['acusación', 'datos de prueba'] },
        art259: { content: 'Prueba ilícita', applies: ['custodia', 'prueba', 'evidencia'] }
      }
    };
  }
}

// Instancia global
window.addEventListener('DOMContentLoaded', () => {
  window.carpetaAnalyzer = new CarpetaAnalyzer();
});

function exportResultsAsPDF() {
  const container = document.getElementById('resultsGrid');
  if (!container) {
    alert('No hay resultados para exportar.');
    return;
  }

  const opt = {
    margin: 0.5,
    filename: 'analisis_carpeta_investigacion.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(container).save();
}

