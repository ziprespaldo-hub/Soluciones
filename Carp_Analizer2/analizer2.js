// ===============================
// Sistema de Análisis Jurídico Integral - CORREGIDO
// ===============================

class CarpetaAnalyzer {
  constructor() {
    this.documents = [];
    this.analysisResults = [];
    this.legalFramework = this.initLegalFramework();
    this.documentTypes = this.initDocumentTypes();
    this.currentProgress = 0;
    this.isAnalyzing = false;
  }

  init() {
    this.initPDFWorker();
    this.setupEventListeners();
    this.setupNavigation();
    this.setupDragAndDrop();
    this.updateStats();
    console.log('CarpetaAnalyzer inicializado correctamente');
  }

  initPDFWorker() {
    if (typeof pdfjsLib !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
  }

  setupEventListeners() {
    // Input de archivos
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files));
    }

    // Botón de análisis
    const startBtn = document.getElementById('startAnalysis');
    if (startBtn) {
      startBtn.addEventListener('click', () => this.startAnalysis());
    }

    // Botones de exportación
    const exportPDFBtn = document.getElementById('exportPDF');
    if (exportPDFBtn) {
      exportPDFBtn.addEventListener('click', () => this.exportResultsAsPDF());
    }

    console.log('Event listeners configurados');
  }

  setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.section');

    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetSection = btn.dataset.section;
        
        // Remover clases activas
        navButtons.forEach(b => b.classList.remove('active'));
        sections.forEach(s => s.classList.remove('active'));
        
        // Agregar clases activas
        btn.classList.add('active');
        const targetElement = document.getElementById(targetSection);
        if (targetElement) {
          targetElement.classList.add('active');
        }
        
        console.log(`Navegando a sección: ${targetSection}`);
      });
    });
  }

  setupDragAndDrop() {
    const uploadArea = document.getElementById('uploadArea');
    if (!uploadArea) return;

    // Prevenir comportamiento por defecto
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      uploadArea.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });

    // Efectos visuales
    ['dragenter', 'dragover'].forEach(eventName => {
      uploadArea.addEventListener(eventName, () => {
        uploadArea.classList.add('drag-over');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      uploadArea.addEventListener(eventName, () => {
        uploadArea.classList.remove('drag-over');
      });
    });

    // Manejar drop
    uploadArea.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      this.handleFileSelect(files);
    });

    // Click para abrir selector
    uploadArea.addEventListener('click', () => {
      document.getElementById('fileInput').click();
    });
  }

  async handleFileSelect(files) {
    if (!files || files.length === 0) return;

    this.updateAnalysisLog('Procesando archivos seleccionados...');
    let validFiles = 0;

    for (const file of files) {
      if (this.isValidFileType(file)) {
        try {
          const content = await this.extractText(file);
          const docId = this.generateId();
          
          this.documents.push({
            id: docId,
            name: file.name,
            content: content,
            size: file.size,
            type: file.type,
            analyzed: false,
            uploadDate: new Date()
          });
          
          validFiles++;
          this.addFileToList(file, docId);
          this.updateAnalysisLog(`✓ ${file.name} procesado correctamente`);
          
        } catch (error) {
          console.error(`Error procesando ${file.name}:`, error);
          this.updateAnalysisLog(`✗ Error procesando ${file.name}: ${error.message}`);
        }
      } else {
        this.updateAnalysisLog(`✗ ${file.name} - Formato no soportado`);
      }
    }

    this.updateStats();
    this.updateDocumentTree();
    
    if (validFiles > 0) {
      this.updateAnalysisLog(`\n🎉 ${validFiles} documentos cargados correctamente. Listos para análisis.`);
    }
  }

  addFileToList(file, docId) {
    const fileList = document.getElementById('fileList');
    if (!fileList) return;

    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    fileItem.id = `file-${docId}`;
    
    const sizeStr = this.formatFileSize(file.size);
    const typeIcon = this.getFileIcon(file.name);
    
    fileItem.innerHTML = `
      <div class="file-info">
        <span class="file-icon">${typeIcon}</span>
        <div class="file-details">
          <div class="file-name">${file.name}</div>
          <div class="file-meta">${sizeStr} • ${new Date().toLocaleTimeString()}</div>
        </div>
      </div>
      <div class="file-actions">
        <span class="file-status">✓ Cargado</span>
        <button class="remove-btn" onclick="carpetaAnalyzer.removeFile('${docId}')">🗑️</button>
      </div>
    `;
    
    fileList.appendChild(fileItem);
  }

  removeFile(docId) {
    this.documents = this.documents.filter(doc => doc.id !== docId);
    const fileElement = document.getElementById(`file-${docId}`);
    if (fileElement) {
      fileElement.remove();
    }
    this.updateStats();
    this.updateDocumentTree();
    this.updateAnalysisLog(`Documento removido del análisis`);
  }

  async startAnalysis() {
    if (this.documents.length === 0) {
      alert('No hay documentos cargados para analizar.');
      return;
    }

    if (this.isAnalyzing) {
      alert('Análisis en progreso. Por favor espera...');
      return;
    }

    this.isAnalyzing = true;
    this.analysisResults = [];
    this.currentProgress = 0;
    
    const startBtn = document.getElementById('startAnalysis');
    if (startBtn) {
      startBtn.textContent = '⏳ Analizando...';
      startBtn.disabled = true;
    }

    this.updateAnalysisStatus('Iniciando análisis jurídico...');
    this.updateAnalysisLog('🔍 INICIANDO ANÁLISIS JURÍDICO INTEGRAL\n');

    try {
      for (let i = 0; i < this.documents.length; i++) {
        const doc = this.documents[i];
        this.updateAnalysisLog(`\n📄 Analizando: ${doc.name}`);
        
        const analysis = await this.analyzeDocument(doc);
        this.analysisResults.push(analysis);
        doc.analyzed = true;
        
        this.currentProgress = Math.round(((i + 1) / this.documents.length) * 100);
        this.updateProgress();
        
        // Simular tiempo de procesamiento
        await this.delay(500);
      }

      this.updateAnalysisStatus('Análisis completado');
      this.updateAnalysisLog('\n✅ ANÁLISIS COMPLETADO EXITOSAMENTE');
      this.displayResults();
      this.updateStats();
      
      // Cambiar a sección de resultados
      document.querySelector('[data-section="results"]').click();
      
    } catch (error) {
      console.error('Error durante análisis:', error);
      this.updateAnalysisLog(`\n❌ Error durante análisis: ${error.message}`);
      this.updateAnalysisStatus('Error en análisis');
    } finally {
      this.isAnalyzing = false;
      if (startBtn) {
        startBtn.textContent = '🔍 Iniciar Análisis Jurídico';
        startBtn.disabled = false;
      }
    }
  }

  async analyzeDocument(doc) {
    const type = this.classifyDocument(doc.content);
    const foundArticles = this.getApplicableArticles(doc.content, type);
    const legalScore = this.calculateLegalScore(doc.content, type, foundArticles);
    
    this.updateAnalysisLog(`  • Tipo: ${this.documentTypes[type]?.name || 'Desconocido'}`);
    this.updateAnalysisLog(`  • Artículos aplicables: ${foundArticles.length}`);
    this.updateAnalysisLog(`  • Score legal: ${legalScore}%`);

    return {
      documentName: doc.name,
      documentType: type,
      articles: foundArticles,
      legalScore: legalScore,
      resumen: this.generateDocumentSummary(doc, type, foundArticles, legalScore),
      recommendations: this.generateRecommendations(type, foundArticles, legalScore)
    };
  }

  classifyDocument(content) {
    let bestType = 'desconocido';
    let maxScore = 0;
    const lowerContent = content.toLowerCase();

    for (const [key, definition] of Object.entries(this.documentTypes)) {
      let score = 0;
      
      // Buscar palabras clave
      for (const keyword of definition.keywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = (lowerContent.match(regex) || []).length;
        score += matches * (keyword.length > 4 ? 2 : 1); // Palabras más largas tienen más peso
      }
      
      if (score > maxScore) {
        maxScore = score;
        bestType = key;
      }
    }
    
    return bestType;
  }

  getApplicableArticles(content, docType) {
    const foundArticles = [];
    const lowerContent = content.toLowerCase();

    for (const [codigo, articulos] of Object.entries(this.legalFramework)) {
      for (const [articulo, definicion] of Object.entries(articulos)) {
        let isApplicable = false;
        
        // Verificar si aplica por contenido
        for (const keyword of definicion.applies) {
          if (lowerContent.includes(keyword.toLowerCase())) {
            isApplicable = true;
            break;
          }
        }
        
        // Verificar si aplica por tipo de documento
        if (!isApplicable && definicion.documentTypes && definicion.documentTypes.includes(docType)) {
          isApplicable = true;
        }
        
        if (isApplicable) {
          foundArticles.push({
            codigo: codigo,
            articulo: articulo,
            contenido: definicion.content,
            relevancia: definicion.relevancia || 'media'
          });
        }
      }
    }
    
    return foundArticles.sort((a, b) => {
      const relevanciaOrder = { 'alta': 3, 'media': 2, 'baja': 1 };
      return (relevanciaOrder[b.relevancia] || 0) - (relevanciaOrder[a.relevancia] || 0);
    });
  }

  calculateLegalScore(content, type, articles) {
    let score = 0;
    
    // Score base por tipo de documento conocido
    if (type !== 'desconocido') score += 20;
    
    // Score por artículos aplicables
    score += Math.min(articles.length * 10, 50);
    
    // Score por contenido jurídico
    const legalTerms = ['delito', 'prueba', 'evidencia', 'testigo', 'declaración', 'investigación'];
    const lowerContent = content.toLowerCase();
    const foundTerms = legalTerms.filter(term => lowerContent.includes(term));
    score += Math.min(foundTerms.length * 5, 30);
    
    return Math.min(score, 100);
  }

  generateDocumentSummary(doc, type, articles, score) {
    const typeName = this.documentTypes[type]?.name || 'Documento desconocido';
    return `${typeName} "${doc.name}" con ${articles.length} artículos legales aplicables y score de suficiencia del ${score}%. ${this.getScoreDescription(score)}`;
  }

  generateRecommendations(type, articles, score) {
    const recommendations = [];
    
    if (score < 50) {
      recommendations.push('⚠️ Documento requiere complementación jurídica');
    }
    
    if (articles.length < 2) {
      recommendations.push('📋 Revisar marco legal aplicable');
    }
    
    if (type === 'desconocido') {
      recommendations.push('🔍 Clasificar tipo de documento correctamente');
    }
    
    return recommendations;
  }

  getScoreDescription(score) {
    if (score >= 80) return 'Excelente suficiencia probatoria';
    if (score >= 60) return 'Suficiencia probatoria adecuada';
    if (score >= 40) return 'Suficiencia probatoria regular';
    return 'Requiere fortalecimiento probatorio';
  }

  displayResults() {
    const container = document.getElementById('resultsGrid');
    if (!container) return;

    container.innerHTML = '';

    if (this.analysisResults.length === 0) {
      container.innerHTML = '<p class="no-results">No hay resultados para mostrar.</p>';
      return;
    }

    this.analysisResults.forEach((result, index) => {
      const card = document.createElement('div');
      card.className = 'result-card';

      const scoreClass = this.getScoreClass(result.legalScore);
      const typeName = this.documentTypes[result.documentType]?.name || 'Desconocido';
      
      const articlesHtml = result.articles.length > 0 
        ? result.articles.map(art => 
            `<li><strong>${art.codigo} Art. ${art.articulo}:</strong> ${art.contenido} <span class="relevancia ${art.relevancia}">(${art.relevancia})</span></li>`
          ).join('')
        : '<li>No se encontraron artículos específicamente aplicables</li>';

      const recommendationsHtml = result.recommendations.length > 0
        ? `<div class="recommendations">
             <h4>📋 Recomendaciones:</h4>
             <ul>${result.recommendations.map(rec => `<li>${rec}</li>`).join('')}</ul>
           </div>`
        : '';

      card.innerHTML = `
        <div class="result-header">
          <div class="result-title">📄 ${result.documentName}</div>
          <div class="result-score ${scoreClass}">${result.legalScore}%</div>
        </div>
        <div class="result-meta">
          <span class="doc-type">Tipo: ${typeName}</span>
          <span class="articles-count">${result.articles.length} artículos aplicables</span>
        </div>
        <p class="result-summary">${result.resumen}</p>
        <div class="legal-articles">
          <h4>⚖️ Marco Legal Aplicable:</h4>
          <ul>${articlesHtml}</ul>
        </div>
        ${recommendationsHtml}
      `;

      container.appendChild(card);
    });
  }

  getScoreClass(score) {
    if (score >= 80) return 'score-high';
    if (score >= 60) return 'score-medium';
    return 'score-low';
  }

  // Funciones de utilidad
  updateStats() {
    const totalDocs = document.getElementById('totalDocs');
    const analyzedDocs = document.getElementById('analyzedDocs');
    const avgScore = document.getElementById('avgScore');
    const docCount = document.getElementById('docCount');

    if (totalDocs) totalDocs.textContent = this.documents.length;
    if (docCount) docCount.textContent = this.documents.length;
    
    const analyzed = this.documents.filter(d => d.analyzed).length;
    if (analyzedDocs) analyzedDocs.textContent = analyzed;

    if (avgScore && this.analysisResults.length > 0) {
      const avg = Math.round(
        this.analysisResults.reduce((sum, r) => sum + r.legalScore, 0) / this.analysisResults.length
      );
      avgScore.textContent = `${avg}%`;
    } else if (avgScore) {
      avgScore.textContent = '0%';
    }
  }

  updateDocumentTree() {
    const tree = document.getElementById('documentTree');
    if (!tree) return;

    const treeHTML = `
      <div class="tree-item">📋 Carpeta de Investigación</div>
      <div class="tree-item">└── 📁 Documentos Cargados (${this.documents.length})</div>
      ${this.documents.map(doc => 
        `<div class="tree-item">    └── ${this.getFileIcon(doc.name)} ${doc.name} ${doc.analyzed ? '✅' : '⏳'}</div>`
      ).join('')}
    `;
    
    tree.innerHTML = treeHTML;
  }

  updateProgress() {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    if (progressFill) {
      progressFill.style.width = `${this.currentProgress}%`;
    }
    
    if (progressText) {
      progressText.textContent = `${this.currentProgress}% completado`;
    }
  }

  updateAnalysisStatus(status) {
    const statusElement = document.getElementById('analysisStatus');
    if (statusElement) {
      statusElement.textContent = status;
    }
  }

  updateAnalysisLog(message) {
    const logElement = document.getElementById('analysisLog');
    if (logElement) {
      logElement.innerHTML += message + '\n';
      logElement.scrollTop = logElement.scrollHeight;
    }
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
      'pdf': '📄',
      'docx': '📝',
      'doc': '📝',
      'txt': '📋',
      'csv': '📊',
      'xlsx': '📈',
      'json': '🔧'
    };
    return icons[ext] || '📎';
  }

  isValidFileType(file) {
    const validTypes = ['.pdf', '.docx', '.doc', '.txt', '.csv', '.json', '.xlsx'];
    return validTypes.some(type => file.name.toLowerCase().endsWith(type));
  }

  async extractText(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    
    try {
      if (ext === 'txt' || ext === 'csv' || ext === 'json') {
        return await file.text();
      }
      
      const arrayBuffer = await file.arrayBuffer();
      
      if (ext === 'pdf') {
        return await this.extractFromPDF(arrayBuffer);
      }
      
      if (ext === 'docx' || ext === 'doc') {
        return await this.extractFromDOCX(arrayBuffer);
      }
      
      if (ext === 'xlsx') {
        return await this.extractFromXLSX(arrayBuffer);
      }
      
      return '';
    } catch (error) {
      console.error(`Error extrayendo texto de ${file.name}:`, error);
      throw new Error(`No se pudo procesar el archivo: ${error.message}`);
    }
  }

  async extractFromPDF(arrayBuffer) {
    if (typeof pdfjsLib === 'undefined') {
      throw new Error('PDF.js no está disponible');
    }
    
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText;
  }

  async extractFromDOCX(arrayBuffer) {
    if (typeof mammoth === 'undefined') {
      throw new Error('Mammoth.js no está disponible');
    }
    
    const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
    return result.value;
  }

  async extractFromXLSX(arrayBuffer) {
    if (typeof XLSX === 'undefined') {
      throw new Error('SheetJS no está disponible');
    }
    
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    let allText = '';
    
    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      allText += csv + '\n';
    });
    
    return allText;
  }

  generateId() {
    return 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  exportResultsAsPDF() {
    const container = document.getElementById('resultsGrid');
    if (!container || this.analysisResults.length === 0) {
      alert('No hay resultados para exportar.');
      return;
    }

    if (typeof html2pdf === 'undefined') {
      alert('Función de exportación PDF no disponible.');
      return;
    }

    const opt = {
      margin: 0.5,
      filename: `analisis_carpeta_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(container).save();
  }

  // Definiciones de datos
  initDocumentTypes() {
    return {
      denuncia: {
        name: 'Denuncia/Querella',
        keywords: ['denuncia', 'querella', 'hechos', 'delito', 'narración', 'acontecimiento', 'suceso']
      },
      inspeccion: {
        name: 'Inspección',
        keywords: ['inspección', 'evidencia', 'croquis', 'lugar', 'hallazgo', 'observación', 'levantamiento']
      },
      entrevista: {
        name: 'Entrevista',
        keywords: ['entrevista', 'declaración', 'testigo', 'víctima', 'imputado', 'manifestación', 'testimonio']
      },
      dictamen: {
        name: 'Dictamen Pericial',
        keywords: ['dictamen', 'perito', 'análisis', 'técnico', 'pericial', 'especialista', 'estudio']
      },
      oficio: {
        name: 'Oficio',
        keywords: ['oficio', 'comunicación', 'solicitud', 'requerimiento', 'petición', 'exhorto']
      },
      custodia: {
        name: 'Cadena de Custodia',
        keywords: ['custodia', 'evidencia', 'indicio', 'objeto', 'preservación', 'resguardo']
      }
    };
  }

  initLegalFramework() {
    return {
      CPEUM: {
        'art14': {
          content: 'Garantía de audiencia y legalidad - Nadie podrá ser privado de la libertad o de sus propiedades, posesiones o derechos, sino mediante juicio seguido ante los tribunales previamente establecidos',
          applies: ['audiencia', 'legalidad', 'juicio', 'tribunal', 'debido proceso'],
          relevancia: 'alta',
          documentTypes: ['denuncia', 'entrevista']
        },
        'art16': {
          content: 'Garantía de legalidad - Nadie puede ser molestado en su persona, familia, domicilio, papeles o posesiones, sino en virtud de mandamiento escrito de la autoridad competente',
          applies: ['cateo', 'orden', 'mandamiento', 'autoridad', 'domicilio'],
          relevancia: 'alta',
          documentTypes: ['inspeccion', 'oficio']
        },
        'art20': {
          content: 'Principios del proceso penal acusatorio y oral - El proceso penal será acusatorio y oral. Se regirá por los principios de publicidad, contradicción, concentración, continuidad e inmediación',
          applies: ['proceso penal', 'acusatorio', 'oral', 'publicidad', 'contradicción'],
          relevancia: 'media',
          documentTypes: ['entrevista', 'dictamen']
        },
        'art21': {
          content: 'Ministerio Público - La investigación de los delitos corresponde al Ministerio Público y a las policías, las cuales actuarán bajo la conducción y mando de aquél',
          applies: ['ministerio público', 'investigación', 'policía', 'delito'],
          relevancia: 'alta',
          documentTypes: ['denuncia', 'inspeccion']
        }
      },
      CNPP: {
        'art131': {
          content: 'Ejercicio de la acción penal - Corresponde al Ministerio Público el ejercicio exclusivo de la acción penal, la cual tiene por objeto el esclarecimiento de los hechos',
          applies: ['acción penal', 'ministerio público', 'esclarecimiento', 'hechos'],
          relevancia: 'alta',
          documentTypes: ['denuncia']
        },
        'art211': {
          content: 'Denuncia - Cualquier persona que tenga conocimiento de la comisión de un delito podrá denunciarlo ante el Ministerio Público',
          applies: ['denuncia', 'conocimiento', 'delito', 'comisión'],
          relevancia: 'alta',
          documentTypes: ['denuncia']
        },
        'art259': {
          content: 'Exclusión de prueba ilícita - El Órgano jurisdiccional no podrá admitir o desahogar los medios de prueba que hayan sido obtenidos de manera ilícita',
          applies: ['prueba ilícita', 'exclusión', 'admisión', 'ilícita'],
          relevancia: 'media',
          documentTypes: ['custodia', 'dictamen']
        },
        'art266': {
          content: 'Cadena de custodia - Se aplicará la cadena de custodia a los indicios, huellas o vestigios del hecho delictuoso, así como a los instrumentos, objetos o productos del delito',
          applies: ['cadena de custodia', 'indicios', 'huellas', 'vestigios', 'instrumentos'],
          relevancia: 'alta',
          documentTypes: ['custodia', 'inspeccion']
        },
        'art313': {
          content: 'Declaración del imputado - El imputado no estará obligado a declarar y su silencio no podrá ser utilizado en su perjuicio',
          applies: ['declaración', 'imputado', 'silencio', 'perjuicio'],
          relevancia: 'alta',
          documentTypes: ['entrevista']
        },
        'art335': {
          content: 'Testimonio - Toda persona tendrá la obligación de concurrir al llamamiento judicial y declarar la verdad de cuanto supiere y le fuere preguntado',
          applies: ['testimonio', 'testigo', 'verdad', 'declarar'],
          relevancia: 'media',
          documentTypes: ['entrevista']
        },
        'art359': {
          content: 'Dictamen pericial - Los peritos deberán tener título oficial en la ciencia, técnica, arte, oficio o actividad especializada',
          applies: ['dictamen pericial', 'perito', 'título', 'especializada'],
          relevancia: 'alta',
          documentTypes: ['dictamen']
        }
      }
    };
  }
}

// Inicialización global
let carpetaAnalyzer;

// Función de exportación global para HTML
function exportResultsAsPDF() {
  if (carpetaAnalyzer) {
    carpetaAnalyzer.exportResultsAsPDF();
  } else {
    alert('Sistema no inicializado correctamente.');
  }
}

/ Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM cargado, inicializando CarpetaAnalyzer...');
    try {
        carpetaAnalyzer = new CarpetaAnalyzer();
        carpetaAnalyzer.init();
        console.log('✅ CarpetaAnalyzer inicializado correctamente');
    } catch (error) {
        console.error('❌ Error inicializando CarpetaAnalyzer:', error);
        alert('Error inicializando el sistema. Revisa la consola para más detalles.');
    }
});
