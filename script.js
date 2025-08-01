const videoElement = document.getElementById('input-video');
const canvasElement = document.getElementById('output-canvas');
const canvasCtx = canvasElement.getContext('2d');

const FACE_MESH_LIPS = [
  [61, 146], [146, 91], [91, 181], [181, 84], [84, 17], [17, 314],
  [314, 405], [405, 321], [321, 375], [375, 291], [61, 185], [185, 40],
  [40, 39], [39, 37], [37, 0], [0, 267], [267, 269], [269, 270],
  [270, 409], [409, 291]
];

// Setup MediaPipe FaceMesh
const faceMesh = new FaceMesh({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
});
faceMesh.setOptions({
  maxNumFaces: 1,
  refineLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});
faceMesh.onResults(onResults);

function onResults(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  if (results.multiFaceLandmarks && results.multiFaceLandmarks[0]) {
    const landmarks = results.multiFaceLandmarks[0];

    // Gather lip points
    const lipPoints = [];
    for (const pair of FACE_MESH_LIPS) {
      const [i, j] = pair;
      lipPoints.push(landmarks[i]);
      lipPoints.push(landmarks[j]);
    }
    let xs = lipPoints.map(p => p.x * canvasElement.width);
    let ys = lipPoints.map(p => p.y * canvasElement.height);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const width = maxX - minX;
    const height = maxY - minY;

    // Enlarge lips (scale > 1.0)
    const scale = 1.3;
    const lipImageData = canvasCtx.getImageData(minX, minY, width, height);

    canvasCtx.clearRect(minX, minY, width, height);

    canvasCtx.translate(centerX, centerY);
    canvasCtx.scale(scale, scale);
    canvasCtx.translate(-centerX, -centerY);

    canvasCtx.putImageData(
      lipImageData,
      minX - (scale - 1) * width / 2,
      minY - (scale - 1) * height / 2
    );

    // Restore
    canvasCtx.setTransform(1, 0, 0, 1, 0, 0);
  }
  canvasCtx.restore();
}

// Camera setup
const camera = new Camera(videoElement, {
  onFrame: async () => {
    await faceMesh.send({ image: videoElement });
  },
  width: 640,
  height: 480
});
camera.start();
