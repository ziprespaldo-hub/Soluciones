
async function extractExif() {
  const imgInput = document.getElementById('img1').files[0];
  if (!imgInput) {
    alert('Por favor, carga una imagen para extraer EXIF.');
    return;
  }
  const reader = new FileReader();
  reader.onload = function (e) {
    const exifData = EXIF.readFromBinaryFile(e.target.result);
    const exifSection = document.getElementById('resultsSection');
    exifSection.innerHTML = `<pre class='text-xs'>${JSON.stringify(exifData, null, 2)}</pre>`;
  };
  reader.readAsArrayBuffer(imgInput);
}
