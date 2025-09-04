
async function compareFacesReal(image1, image2) {
  const detection1 = await faceapi.detectSingleFace(image1).withFaceLandmarks().withFaceDescriptor();
  const detection2 = await faceapi.detectSingleFace(image2).withFaceLandmarks().withFaceDescriptor();
  if (!detection1 || !detection2) {
    return { matched: false, similarity: 0 };
  }
  const distance = faceapi.euclideanDistance(detection1.descriptor, detection2.descriptor);
  const similarity = Math.max(0, (1 - distance)) * 100;
  return { matched: distance < 0.6, similarity: similarity.toFixed(2) };
}
