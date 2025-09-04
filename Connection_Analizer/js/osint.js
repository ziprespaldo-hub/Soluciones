
async function startOsintAnalysis() {
  const personName = document.getElementById('person1').value;
  if (!personName) {
    alert('Por favor, ingresa el nombre para análisis OSINT.');
    return;
  }
  const response = await fetch(`/api/osint?name=${encodeURIComponent(personName)}`);
  const osintData = await response.json();
  const osintSection = document.getElementById('resultsSection');
  osintSection.innerHTML = osintData.map(entry => `
    <div class='glass p-4 mb-2 rounded-lg shadow border border-slate-700'>
      <div class='flex justify-between'>
        <span class='text-blue-400 font-semibold'>${entry.source}</span>
        <span class='text-xs text-slate-400'>${entry.date}</span>
      </div>
      <div class='text-sm text-slate-300'>${entry.type}</div>
      <a href='${entry.url}' target='_blank' class='text-xs text-blue-400 underline'>Ver fuente</a>
    </div>
  `).join('');
}
