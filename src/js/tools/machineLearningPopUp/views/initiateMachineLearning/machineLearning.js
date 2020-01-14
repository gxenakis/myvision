import { getAllImageData } from '../../../imageList/imageList';
import { drawTempShapesToShowCaseMLResults, updateImageThumbnails } from '../../../toolkit/buttonClickEvents/facadeWorkersUtils/drawShapesViaCoordinates/drawShapesViaCoordinates';
import { getCurrentImageId } from '../../../toolkit/buttonClickEvents/facadeWorkersUtils/stateManager';
import {
  displayErrorMessage, updateProgressMessage, removeCancelButton,
  displayNoImagesFoundError, displayNextButton,
  removeLoaderWheel, displayErrorButtons,
  changeToLoadingStyle,
} from './style';

let tfModel = null;
let isInProgress = false;
let isCancelled = false;
let modelLoadingInitiated = false;
const tensorflowJSScript = { element: document.createElement('script'), status: { download: 'waiting' } };
const cocoSSDScript = { element: document.createElement('script'), status: { download: 'waiting' } };

function errorHandler() {
  removeLoaderWheel();
  displayErrorMessage('ERROR! Please try again later.');
  displayErrorButtons();
  isInProgress = false;
}

function predict(image) {
  return tfModel.detect(image.data);
  // return tfModel.detect(image.data);
}

// check overflow

/*
let stopState = false;

function stopAPromiseAll() {
  stopState = true;
}

function predict(image) {
  return new Promise((resolve, reject) => {
    if (!stopState) {
      tfModel.detect(image.data).then((result) => {resolve(result)});
      // check if we don't need to do .catch((error) => reject(error));
    } else {
      reject();
    }
  });
}

// check if catch works
*/

// TEST
// check that only the images that have been checked have their shapes regenerated

// TEST
// check if it is not too early to display finished as the images still need to
// be updated with shapes

function isObjectEmpty(object) {
  return Object.keys(object).length === 0 && object.constructor === Object;
}

function executeAndRecordPredictionResults(promisesArray, predictionIdToImageId,
  nextViewCallback, setMachineLearningData, coverage) {
  Promise.all(promisesArray)
    .catch(() => {
      // if stopstate = true
      // else display an error
      console.log('error');
      // should return the completed array promises
      errorHandler();
      // return promisesArray;
    })
    // TEST
    // check to see if only the completed operations are returned and should
    // there be more work needed to match the IDs
    .then((predictions) => {
      // opportunity for remembering the last changed label names by moving
      // this object outside of the function
      const predictedImageCoordinates = {};
      for (let i = 0; i < predictions.length; i += 1) {
        predictedImageCoordinates[predictionIdToImageId[i]] = predictions[i];
      }
      setMachineLearningData(predictedImageCoordinates);
      removeLoaderWheel();
      removeCancelButton();
      if (isObjectEmpty(predictedImageCoordinates)) {
        nextViewCallback();
      } else {
        displayNextButton();
        if (coverage === 'all'
        || (coverage === 'new' && Object.prototype.hasOwnProperty.call(predictedImageCoordinates, getCurrentImageId()))) {
          drawTempShapesToShowCaseMLResults(predictedImageCoordinates);
        }
        updateImageThumbnails(predictedImageCoordinates);
        updateProgressMessage('Finished!');
      }
      isInProgress = false;
      // timeout here and then move to next, or use a different callback to style.js and
      // display a button (with registered handler) to continue and call doneCallback
    });
}

// TEST
// check that the current image shapes are being regenerated by the model

// decided not to store generated shapes because if you have 100 images with
// 100s of shapes, it would lead to significant memory usage

function makePredictionsForAllImages(nextViewCallback, setMachineLearningData, coverage) {
  const predictPromises = [];
  const allImageData = getAllImageData();
  const predictionIdToImageId = [];
  // optimisation for not generating shapes on untouched images taken out
  // as when displaying the generated label names, only the new name label
  // names were shown, but when looked at image, all of them were there
  // this did not look right in terms of UX
  // Optimisation description:
  // only predicting images with no highlighted shapes and current image
  // as it can have partial highlighting, so predicting all again
  // 12/01/2020
  for (let i = 0; i < allImageData.length; i += 1) {
    const image = allImageData[i];
    if (coverage === 'all' || (coverage === 'new' && !image.analysedByML)) {
      image.analysedByML = true;
      predictPromises.push(predict(image));
      predictionIdToImageId.push(i);
    }
  }
  console.log(predictPromises);
  executeAndRecordPredictionResults(predictPromises, predictionIdToImageId,
    nextViewCallback, setMachineLearningData, coverage);
}

function markScriptDownloadSuccessfull(status) {
  status.download = 'complete';
}

function loadModel(status) {
  markScriptDownloadSuccessfull(status);
  return new Promise((resolve, reject) => {
    if (isCancelled) return;
    const { cocoSsd } = window;
    if (!modelLoadingInitiated) {
      modelLoadingInitiated = true;
      cocoSsd.load().then((model) => {
        tfModel = model;
        if (isCancelled) return;
        resolve();
      }).catch(() => {
        modelLoadingInitiated = false;
        reject();
      });
    }
  });
}

function downloadScript({ element, status }, url, resolve, reject) {
  if (isCancelled) return;
  if (status.download === 'complete') {
    resolve(status);
    return;
  }
  if (status.download === 'in_progress') {
    document.head.removeChild(element);
  }
  element.onload = resolve.bind(this, status);
  element.onerror = reject;
  status.download = 'in_progress';
  element.src = url;
  document.head.appendChild(element);
}

function downloadCOCOSSD(status) {
  markScriptDownloadSuccessfull(status);
  return new Promise((resolve, reject) => {
    downloadScript(cocoSSDScript, 'https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd',
      resolve, reject);
  });
}

function downloadTensorflowJS() {
  return new Promise((resolve, reject) => {
    downloadScript(tensorflowJSScript, 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs',
      resolve, reject);
  });
}

function startMachineLearning(nextViewCallback, setMachineLearningData, coverage) {
  if (isCancelled) { isCancelled = false; }
  const allImageData = getAllImageData();
  if (allImageData.length > 0) {
    changeToLoadingStyle();
    if (!tfModel) {
      isInProgress = true;
      downloadTensorflowJS()
        .then(resultScriptStatus => downloadCOCOSSD(resultScriptStatus))
        .then(resultScriptStatus => loadModel(resultScriptStatus))
        .then(() => makePredictionsForAllImages(nextViewCallback, setMachineLearningData, coverage))
        .catch(() => errorHandler());
    } else {
      makePredictionsForAllImages(nextViewCallback, setMachineLearningData, coverage);
    }
  } else {
    displayNoImagesFoundError();
  }
}

function isFractionOfImagesAnalysedByML() {
  const images = getAllImageData();
  let imagesAnalysedByML = false;
  let imagesNotYetAnalysedByML = false;
  for (let i = 0; i < images.length; i += 1) {
    if (images[i].analysedByML) {
      imagesAnalysedByML = true;
    } else {
      imagesNotYetAnalysedByML = true;
    }
    if (imagesAnalysedByML && imagesNotYetAnalysedByML) {
      return true;
    }
  }
  return false;
}

function cancelMachineLearning() {
  isCancelled = true;
  isInProgress = false;
}

function getProgressStatus() {
  return isInProgress;
}

export {
  startMachineLearning, cancelMachineLearning,
  getProgressStatus, isFractionOfImagesAnalysedByML,
};
